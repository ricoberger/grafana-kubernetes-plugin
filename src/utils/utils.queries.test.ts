import { readFileSync } from 'fs';
import { join } from 'path';
import ts from 'typescript';
import { queries } from './utils.queries';

const identity = 'cluster,namespace,pod,node';
const compact = (query: string) => query.replace(/\s+/g, '');
const resources = ['cpu', 'memory'] as const;

function metricSelector(query: string, metric: string): string {
  const start = query.indexOf(`${metric}{`);
  expect(start).toBeGreaterThanOrEqual(0);
  // A matcher can itself contain braces, e.g. the node port's {2,5}.
  const selector = query.slice(start).match(/^[^{]+\{((?:"[^"]*"|[^"}])*)\}/);
  if (!selector) {
    throw new Error(`Missing selector for ${metric}`);
  }
  return compact(selector[1]);
}

/** Read query parentheses without treating quoted regex parentheses as syntax. */
function closingParenthesis(query: string, opening: number): number {
  let depth = 0;
  let quoted = false;
  for (let index = opening; index < query.length; index++) {
    if (query[index] === '"' && query[index - 1] !== '\\') {
      quoted = !quoted;
    }
    if (!quoted) {
      if (query[index] === '(') {
        depth++;
      } else if (query[index] === ')' && --depth === 0) {
        return index;
      }
    }
  }
  throw new Error('Unbalanced query parentheses');
}

function allocationOperands(query: string): {
  request: string;
  usage: string;
  output: string;
} {
  for (const match of query.matchAll(/\bmax\(/g)) {
    const opening = (match.index ?? 0) + 3;
    const closing = closingParenthesis(query, opening);
    const body = query.slice(opening + 1, closing);
    if (!body.includes('kube_pod_resource_request')) {
      continue;
    }
    for (let index = 0; index < body.length; index++) {
      if (body[index] === '(') {
        index = closingParenthesis(body, index);
      } else if (body.slice(index).match(/^or\s/)) {
        return {
          request: compact(body.slice(0, index)),
          usage: compact(body.slice(index + 2)),
          output: compact(
            query.slice(closing + 1).match(/^\s*by\([^)]*\)/)?.[0] ?? '',
          ),
        };
      }
    }
  }
  throw new Error('Missing max(request or usage) allocation');
}

function resourceExpression(query: string): string {
  for (const match of query.matchAll(/\blabel_replace\(/g)) {
    const opening = (match.index ?? 0) + 'label_replace'.length;
    const expression = query.slice(
      match.index,
      closingParenthesis(query, opening) + 1,
    );
    if (
      /\bkube_pod_resource_(request|limit)\{/.test(expression) &&
      /"resource",\s*"(cpu|memory)",\s*"",\s*""\s*\)$/.test(expression)
    ) {
      return expression;
    }
  }
  throw new Error('Missing effective resource expression');
}

describe('raw query definitions', () => {
  it('contains only literal objects and strings, without JavaScript query generation', () => {
    const filename = join(__dirname, 'utils.queries.ts');
    const source = ts.createSourceFile(
      filename,
      readFileSync(filename, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
    );
    const declaration = source.statements
      .filter(ts.isVariableStatement)
      .flatMap((statement) => [...statement.declarationList.declarations])
      .find(
        (item) => ts.isIdentifier(item.name) && item.name.text === 'queries',
      );
    if (!declaration?.initializer) {
      throw new Error('Missing queries declaration');
    }
    function assertLiteral(node: ts.Expression) {
      if (ts.isObjectLiteralExpression(node)) {
        for (const property of node.properties) {
          if (
            !ts.isPropertyAssignment(property) ||
            !(
              ts.isIdentifier(property.name) ||
              ts.isStringLiteral(property.name)
            )
          ) {
            throw new Error(
              'Query properties must have literal names and values',
            );
          }
          assertLiteral(property.initializer);
        }
      } else {
        expect(
          ts.isNoSubstitutionTemplateLiteral(node) || ts.isStringLiteral(node),
        ).toBe(true);
      }
    }
    assertLiteral(declaration.initializer);
    expect(JSON.parse(JSON.stringify(queries))).toEqual(queries);
  });

  const resourceQueries = Object.entries(queries).flatMap(([scope, group]) =>
    Object.entries(group)
      .filter(([, query]) =>
        /\bkube_pod_resource_(request|limit)\{/.test(query),
      )
      .map(([name, query]) => ({ name: `${scope}.${name}`, query })),
  );

  it.each(resourceQueries)(
    'preserves scheduler preference, deduplication, units and fallback scope in $name',
    ({ query }) => {
      const expression = resourceExpression(query);
      const metric = expression.match(/\bkube_pod_resource_(request|limit)\{/);
      if (!metric) {
        throw new Error('Missing scheduler metric');
      }
      const kind = metric[1];
      const scheduler = metricSelector(expression, `kube_pod_resource_${kind}`);
      const resource = scheduler.includes('resource="cpu"') ? 'cpu' : 'memory';
      const active = expression.includes(
        ':active:kube_pod_container_resource_',
      );
      const fallbackMetric = active
        ? `cluster:namespace:pod_${resource}:active:kube_pod_container_resource_${kind}s`
        : `kube_pod_container_resource_${kind}s`;
      const fallbackSelector = metricSelector(expression, fallbackMetric);
      const scope = scheduler.split(',resource=')[0];
      expect(scheduler).toContain(
        `resource="${resource}",unit="${resource === 'cpu' ? 'cores' : 'bytes'}"`,
      );
      expect(scheduler).not.toContain('container');
      expect(fallbackSelector.startsWith(scope)).toBe(true);
      if (!active) {
        expect(fallbackSelector).toContain(`resource="${resource}"`);
      }
      const normalized = compact(expression);
      expect(normalized).toContain(
        `maxby(${identity})(kube_pod_resource_${kind}{`,
      );
      expect(normalized).toContain(
        `oron(${identity})sumby(${identity})(maxby(${identity},container)(${fallbackMetric}{`,
      );
      expect(normalized.match(/\boron\(/g)).toHaveLength(1);
      expect(normalized.endsWith(`),"resource","${resource}","","")`)).toBe(
        true,
      );
      expect(expression).not.toMatch(
        />\s*0|!=\s*0|\bbool\b|vector\(|clamp_min\(|kube_pod_info|node!=""|cluster!=""/,
      );
      expect(expression).not.toMatch(
        /by\([^)]*(?:instance|job|scheduler|priority|uid)/,
      );
      const [preferred, fallback] = expression.split(`or on(${identity})`);
      expect(fallback).not.toContain('kube_pod_status_phase');
      if (active) {
        expect(compact(preferred)).toContain(
          'andon(cluster,namespace,pod)maxby(cluster,namespace,pod)(kube_pod_status_phase{',
        );
        expect(compact(preferred)).toContain('phase=~"Pending|Running"}==1)');
      } else {
        expect(preferred).not.toContain('kube_pod_status_phase');
      }
    },
  );
});

describe('cluster cost-rate queries', () => {
  it.each([
    'costsCPUAllocation',
    'costsMemoryAllocation',
    'costsCPUIdle',
    'costsMemoryIdle',
  ] as const)(
    '%s preserves the hourly calculation without selected-range integration',
    (name) => {
      const total = compact(queries.cluster[name]);
      const hourly = compact(queries.cluster[`${name}Rate`]);
      expect(total).toBe(`sum_over_time(${hourly}[$__range:5m])/12`);
      expect(hourly).toContain('*on(cluster,node)group_left()');
      expect(hourly).not.toMatch(/sum_over_time|\$__range|vector\(0\)/);
    },
  );

  it('deduplicates node total hourly prices without a zero fallback', () => {
    expect(compact(queries.cluster.costsTotalRate)).toBe(
      'sum(max(node_total_hourly_cost{cluster=~"$cluster"})by(cluster,node))',
    );
  });
});

describe.each(['nodes', 'workloads', 'pods'] as const)(
  '%s cost-rate queries',
  (scope) => {
    it.each([
      'costsCPUAllocation',
      'costsMemoryAllocation',
      'costsCPUIdle',
      'costsMemoryIdle',
    ] as const)(
      '%s removes only time integration, preserving resource attribution and pricing',
      (name) => {
        const total = compact(queries[scope][name]);
        const hourly = compact(queries[scope][`${name}Rate`]);
        const start = total.indexOf('sum_over_time(');
        expect(start).toBeGreaterThanOrEqual(0);
        const opening = start + 'sum_over_time'.length;
        const closing = closingParenthesis(total, opening);
        const integrated = total.slice(opening + 1, closing);
        const range = '[$__range:5m]';
        expect(integrated.endsWith(range)).toBe(true);
        expect(total.slice(closing + 1, closing + 4)).toBe('/12');
        expect(hourly).toBe(
          total.slice(0, start) +
          integrated.slice(0, -range.length) +
          total.slice(closing + 4),
        );
        expect(hourly).not.toMatch(
          /sum_over_time|\$__range|vector\(0\)|clamp_min/,
        );
        expect(hourly).toContain('cluster=~"$cluster"');
        expect(hourly).toContain(
          name.startsWith('costsCPU')
            ? 'node_cpu_hourly_cost'
            : 'node_ram_hourly_cost',
        );
        if (scope === 'nodes') {
          expect(hourly).toContain('node=~"$node(:[0-9]{2,5})?"');
          expect(hourly).not.toContain('$pod');
        } else {
          expect(hourly).toContain('namespace=~"$namespace"');
          if (scope === 'workloads') {
            expect(hourly).toContain(
              'on(cluster,namespace,pod)group_left(workload,workload_type)',
            );
            expect(hourly).toContain('workload=~"$workload"');
            expect(hourly).toContain('workload_type=~"$workloadtype"');
            expect(hourly).not.toContain('$pod');
          } else {
            expect(hourly).toContain('pod=~"$pod"');
            expect(hourly).toContain('node=~"$node"');
          }
        }
      },
    );
  },
);

describe('namespace cost table queries', () => {
  it.each([
    'costsCPUAllocation',
    'costsMemoryAllocation',
    'costsCPUIdle',
    'costsMemoryIdle',
  ] as const)(
    '%s hourly rate preserves namespace totals, pricing and resource fallbacks',
    (name) => {
      const total = compact(queries.namespaces[name]);
      const hourly = compact(queries.namespaces[`${name}Rate`]);
      expect(total).toBe(`sum_over_time(${hourly}[$__range:5m])/12`);
      expect(hourly).toMatch(/^sumby\(namespace\)\(/);
      expect(hourly).toContain('namespace=~"$namespace"');
      expect(hourly).toContain('*on(cluster,node)group_left()');
      expect(hourly).not.toMatch(
        /sum_over_time|\$__range|\$workload|vector\(0\)|clamp_min/,
      );
    },
  );

  it.each(['CPU', 'Memory'] as const)(
    'keeps %s allocation and idle costs grouped by namespace',
    (resource) => {
      for (const kind of ['Allocation', 'Idle'] as const) {
        const query = compact(queries.namespaces[`costs${resource}${kind}`]);
        expect(query).toMatch(/^sum_over_time\(sumby\(namespace\)\(/);
      }

      const idle = compact(queries.namespaces[`costs${resource}Idle`]);
      expect(idle).toContain(
        `${resource === 'CPU' ? 'by(cluster,namespace,node,resource)' : 'by(cluster,namespace,node)'}-on(cluster,namespace,node)group_left()`,
      );
      expect(idle).toContain(
        'by(cluster,namespace,node,pod,container))by(cluster,namespace,node)',
      );
    },
  );
});

describe('pod-and-higher resource query coverage', () => {
  const groups: Array<{
    name: string;
    queries: Record<string, string>;
    suffixes: string[];
  }> = [
      {
        name: 'cluster',
        queries: queries.cluster,
        suffixes: ['Requests', 'Limits'],
      },
      {
        name: 'nodes',
        queries: queries.nodes,
        suffixes: ['Requests', 'Limits', 'Efficiency'],
      },
      {
        name: 'namespaces',
        queries: queries.namespaces,
        suffixes: [
          'Requests',
          'Limits',
          'Allocation',
          'UsageAvgPercentOverTime',
          'UsageMaxPercentOverTime',
        ],
      },
      {
        name: 'workloads',
        queries: queries.workloads,
        suffixes: [
          'Requests',
          'Limits',
          'Allocation',
          'Efficiency',
          'UsageAvgPercentOverTime',
          'UsageMaxPercentOverTime',
          'RequestsJoinKey',
          'LimitsJoinKey',
          'RequestsPercentJoinKey',
          'LimitsPercentJoinKey',
        ],
      },
      {
        name: 'pods',
        queries: queries.pods,
        suffixes: [
          'Requests',
          'Limits',
          'Allocation',
          'UsageAvgPercentOverTime',
          'UsageMaxPercentOverTime',
          'RequestsJoinKey',
          'LimitsJoinKey',
          'RequestsPercentJoinKey',
          'LimitsPercentJoinKey',
        ],
      },
    ];

  it.each(groups)(
    'wires effective resources into all $name totals and ratios',
    ({ queries: group, suffixes }) => {
      for (const resource of resources) {
        for (const suffix of suffixes) {
          const query = group[`${resource}${suffix}`];
          const kind = suffix.startsWith('Limits') ? 'limit' : 'request';
          expect(metricSelector(query, `kube_pod_resource_${kind}`)).toContain(
            `resource="${resource}"`,
          );
          expect(query).toContain(`or on(${identity})`);
          expect(query).not.toMatch(
            /namespace_(cpu|memory):kube_pod_container_resource/,
          );
        }
      }
    },
  );

  it.each(['namespaces', 'workloads', 'pods'] as const)(
    'retains contemporaneous %s historical denominators and filters after preference',
    (name) => {
      for (const resource of resources) {
        for (const statistic of ['Avg', 'Max'] as const) {
          const query =
            queries[name][`${resource}Usage${statistic}PercentOverTime`];
          const normalized = compact(query);
          expect(normalized).toMatch(/^(avg|max)_over_time\(/);
          expect(normalized).toMatch(/>0\)\)\[\$__range:\$__interval\]\)$/);
          expect(normalized.match(/>0/g)).toHaveLength(1);
          expect(normalized.indexOf('>0')).toBeGreaterThan(
            normalized.indexOf(`oron(${identity})`),
          );
          expect(query.match(/_over_time\(/g)).toHaveLength(1);
        }
      }
    },
  );

  it.each(['namespaces', 'workloads', 'pods'] as const)(
    'keeps %s request and usage allocation operands distinct without a cluster label',
    (name) => {
      for (const resource of resources) {
        for (const query of [
          queries[name][`${resource}Allocation`],
          queries[name][
          resource === 'cpu' ? 'costsCPUAllocation' : 'costsMemoryAllocation'
          ],
        ]) {
          const { request, usage, output } = allocationOperands(query);
          // A fixed resource label is retained only on requests until max().
          // Thus even cluster-less request/usage series cannot collide in OR.
          expect(request).toContain(`"resource","${resource}","",""`);
          expect(request).toMatch(/\)by\([^)]*\bresource\)$/);
          expect(usage).not.toContain('resource');
          expect(output).not.toContain('resource');
          expect(usage).toContain(
            resource === 'cpu'
              ? 'container_cpu_usage_seconds_total'
              : 'container_memory_working_set_bytes',
          );
        }
      }
    },
  );

  it.each(['namespaces', 'workloads', 'pods'] as const)(
    'retains %s cost scopes, node attribution, pricing joins and five-minute weighting',
    (name) => {
      for (const resource of resources) {
        for (const kind of ['Allocation', 'Idle'] as const) {
          const query =
            queries[name][
            `costs${resource === 'cpu' ? 'CPU' : 'Memory'}${kind}`
            ];
          const scheduler = metricSelector(query, 'kube_pod_resource_request');
          expect(scheduler).toContain(
            'cluster=~"$cluster",namespace=~"$namespace"',
          );
          expect(scheduler).not.toContain('container');
          expect(query).toContain('kube_pod_container_resource_requests{');
          expect(query).not.toContain(
            ':active:kube_pod_container_resource_requests',
          );
          const opening =
            query.indexOf('label_replace(') + 'label_replace'.length;
          const closing = closingParenthesis(query, opening);
          const phase = query.indexOf('kube_pod_status_phase');
          expect(compact(query.slice(closing + 1))).toMatch(
            /^andon\(cluster,namespace,pod\)maxby\(cluster,namespace,pod\)\(kube_pod_status_phase\{/,
          );
          expect(query.match(/kube_pod_status_phase/g)).toHaveLength(1);
          expect(compact(query)).toContain('phase=~"Pending|Running"}==1)');
          expect(phase).toBeLessThan(query.indexOf('[$__range:5m]'));
          expect(metricSelector(query, 'kube_pod_status_phase')).toBe(
            `cluster=~"$cluster",namespace=~"$namespace"${name === 'pods' ? ',pod=~"$pod"' : name === 'workloads' ? ',pod=~".+"' : ''},phase=~"Pending|Running"`,
          );
          expect(compact(query)).toContain(
            'on(cluster,namespace,pod)group_left(node)',
          );
          expect(compact(query)).toContain('on(cluster,node)group_left()');
          expect(compact(query)).toContain('[$__range:5m])/12');
          expect(query).not.toContain('vector(0)');
          if (name === 'workloads') {
            expect(scheduler).toContain('pod=~".+"');
            expect(query).toContain('workload=~"$workload"');
            expect(query).toContain('workload_type=~"$workloadtype"');
            expect(phase).toBeLessThan(
              query.indexOf('namespace_workload_pod:kube_pod_owner:relabel'),
            );
            expect(
              query.indexOf('namespace_workload_pod:kube_pod_owner:relabel'),
            ).toBeLessThan(query.indexOf('[$__range:5m]'));
          } else if (name === 'pods') {
            expect(scheduler).toContain('pod=~"$pod",node=~"$node"');
            expect(
              metricSelector(query, 'kube_pod_container_resource_requests'),
            ).toContain('container=~".+"');
          }
        }
      }
    },
  );

  it('keeps phase filtering out of non-cost raw resource queries', () => {
    for (const group of [queries.namespaces, queries.workloads, queries.pods]) {
      for (const [name, query] of Object.entries(group)) {
        if (
          !name.startsWith('costs') &&
          /(?:^|\s)kube_pod_container_resource_requests\{/.test(query)
        ) {
          expect(query).not.toContain('kube_pod_status_phase');
        }
      }
    }
  });

  it('preserves resource output labels, instant join keys and OTel CPU limit alternatives', () => {
    expect(
      compact(queries.workloads.cpuRequests).endsWith(')by(resource)'),
    ).toBe(true);
    for (const name of ['workloads', 'pods'] as const) {
      for (const resource of resources) {
        for (const kind of ['Requests', 'Limits'] as const) {
          const query = queries[name][`${resource}${kind}PercentJoinKey`];
          expect(query).toContain('"join_key"');
          expect(query).toContain('/');
          expect(query).toContain(`or on(${identity})`);
        }
      }
    }
    for (const query of [
      queries.nodes.cpuLimits,
      queries.namespaces.cpuLimits,
    ]) {
      expect(query).toContain('k8s_container_cpu_limit{');
      expect(query).toContain('k8s_cluster_name=~"$cluster"');
    }
  });

  it('leaves container-specific resource values and physical capacity formulas alone', () => {
    for (const query of Object.values(queries.containers)) {
      expect(query).not.toMatch(/kube_pod_resource_(request|limit)\{/);
    }
    for (const resource of resources) {
      for (const kind of ['Requests', 'Limits'] as const) {
        const query = queries.workloads[`${resource}${kind}ByContainer`];
        expect(compact(query)).toBe(
          `max(cluster:namespace:pod_${resource}:active:kube_pod_container_resource_${kind.toLowerCase()}{cluster=~"$cluster",namespace=~"$namespace",pod=~"$pod",container="$container"})by(container)`,
        );
      }
    }
    for (const group of [queries.nodes, queries.cluster]) {
      for (const key of [
        'cpuCapacity',
        'memoryCapacity',
        'cpuUsage',
        'memoryUsage',
        'costsCPUIdle',
        'costsMemoryIdle',
        'costsCPUAllocation',
        'costsMemoryAllocation',
      ] as const) {
        expect(group[key]).not.toContain('kube_pod_resource_');
      }
    }
    expect(queries.nodes.cpuDistribution).toContain(
      'kube_node_status_capacity',
    );
    expect(queries.nodes.memoryDistribution).toContain(
      'kube_node_status_capacity',
    );
  });
});
