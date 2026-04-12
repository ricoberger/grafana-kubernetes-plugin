import { DataTransformerID, MappingType, ThresholdsMode } from '@grafana/data';
import { SceneDataQuery, VizConfigBuilders } from '@grafana/scenes';
import {
  useDataTransformer,
  useQueryRunner,
  VizPanel,
} from '@grafana/scenes-react';
import { TableCellDisplayMode } from '@grafana/schema';
import React from 'react';

import { ROUTES } from '../../../constants';
import { useVizPanelMenu } from '../../../hooks/useVizPanelMenu';
import { prefixRoute } from '../../../utils/utils.routing';

interface Props {
  title: string;
  infoNodeExpr?: string;
  infoNamespaceExpr?: string;
  infoPodExpr?: string;
  infoContainerExpr?: string;
  cpuUsageAvgExpr?: string;
  cpuUsageAvgPercentExpr?: string;
  cpuUsageMaxExpr?: string;
  cpuUsageMaxPercentExpr?: string;
  memoryUsageAvgExpr?: string;
  memoryUsageAvgPercentExpr?: string;
  memoryUsageMaxExpr?: string;
  memoryUsageMaxPercentExpr?: string;
  desiredPodsExpr?: string;
  readyPodsExpr?: string;
  alertsExpr?: string;
}

export function TableResourceUsage({
  title,
  infoNodeExpr,
  infoNamespaceExpr,
  infoPodExpr,
  infoContainerExpr,
  cpuUsageAvgExpr,
  cpuUsageAvgPercentExpr,
  cpuUsageMaxExpr,
  cpuUsageMaxPercentExpr,
  memoryUsageAvgExpr,
  memoryUsageAvgPercentExpr,
  memoryUsageMaxExpr,
  memoryUsageMaxPercentExpr,
  desiredPodsExpr,
  readyPodsExpr,
  alertsExpr,
}: Props) {
  const queries: SceneDataQuery[] = [];

  if (infoNodeExpr) {
    queries.push({
      refId: 'info_node',
      format: 'table',
      instant: true,
      expr: infoNodeExpr,
    });
  }
  if (infoNamespaceExpr) {
    queries.push({
      refId: 'info_namespace',
      format: 'table',
      instant: true,
      expr: infoNamespaceExpr,
    });
  }
  if (infoPodExpr) {
    queries.push({
      refId: 'info_pod',
      format: 'table',
      instant: true,
      expr: infoPodExpr,
    });
  }
  if (infoContainerExpr) {
    queries.push({
      refId: 'info_container',
      format: 'table',
      instant: true,
      expr: infoContainerExpr,
    });
  }
  if (cpuUsageAvgExpr) {
    queries.push({
      refId: 'cpu_usage_avg',
      format: 'table',
      instant: true,
      expr: cpuUsageAvgExpr,
    });
  }
  if (cpuUsageAvgPercentExpr) {
    queries.push({
      refId: 'cpu_usage_avg_percent',
      format: 'table',
      instant: true,
      expr: cpuUsageAvgPercentExpr,
    });
  }
  if (cpuUsageMaxExpr) {
    queries.push({
      refId: 'cpu_usage_max',
      format: 'table',
      instant: true,
      expr: cpuUsageMaxExpr,
    });
  }
  if (cpuUsageMaxPercentExpr) {
    queries.push({
      refId: 'cpu_usage_max_percent',
      format: 'table',
      instant: true,
      expr: cpuUsageMaxPercentExpr,
    });
  }
  if (memoryUsageAvgExpr) {
    queries.push({
      refId: 'memory_usage_avg',
      format: 'table',
      instant: true,
      expr: memoryUsageAvgExpr,
    });
  }
  if (memoryUsageAvgPercentExpr) {
    queries.push({
      refId: 'memory_usage_avg_percent',
      format: 'table',
      instant: true,
      expr: memoryUsageAvgPercentExpr,
    });
  }
  if (memoryUsageMaxExpr) {
    queries.push({
      refId: 'memory_usage_max',
      format: 'table',
      instant: true,
      expr: memoryUsageMaxExpr,
    });
  }
  if (memoryUsageMaxPercentExpr) {
    queries.push({
      refId: 'memory_usage_max_percent',
      format: 'table',
      instant: true,
      expr: memoryUsageMaxPercentExpr,
    });
  }
  if (desiredPodsExpr) {
    queries.push({
      refId: 'desired_pods',
      format: 'table',
      instant: true,
      expr: desiredPodsExpr,
    });
  }
  if (readyPodsExpr) {
    queries.push({
      refId: 'ready_pods',
      format: 'table',
      instant: true,
      expr: readyPodsExpr,
    });
  }
  if (alertsExpr) {
    queries.push({
      refId: 'alerts',
      format: 'table',
      instant: true,
      expr: alertsExpr,
    });
  }

  const dataProvider = useQueryRunner({
    datasource: {
      type: 'prometheus',
      uid: '$prometheus',
    },
    queries: queries,
  });

  const dataTransformer = useDataTransformer({
    data: dataProvider,
    transformations: [
      {
        id: DataTransformerID.merge,
        options: {},
      },
      {
        id: DataTransformerID.calculateField,
        options: {
          mode: 'binary',
          reduce: {
            reducer: 'sum',
          },
          alias: '',
          binary: {
            left: 'Value #ready_pods',
            operator: '/',
            right: 'Value #desired_pods',
          },
        },
      },
      {
        id: DataTransformerID.organize,
        options: {
          includeByName: {
            ['node']: infoContainerExpr ? false : true,
            ['namespace']: infoContainerExpr ? false : true,
            ['workload']: infoContainerExpr ? false : true,
            ['workload_type']: infoContainerExpr ? false : true,
            ['pod']: infoContainerExpr ? false : true,
            ['container']: infoContainerExpr ? true : false,
            ['phase']: true,
            ['image_spec']: true,
            ['Value #info_namespace']: true,
            ['Value #cpu_usage_avg']: true,
            ['Value #cpu_usage_avg_percent']: true,
            ['Value #cpu_usage_max']: true,
            ['Value #cpu_usage_max_percent']: true,
            ['Value #memory_usage_avg']: true,
            ['Value #memory_usage_avg_percent']: true,
            ['Value #memory_usage_max']: true,
            ['Value #memory_usage_max_percent']: true,
            ['Value #ready_pods / Value #desired_pods']: true,
            ['Value #alerts']: true,
          },
          indexByName: {
            ['namespace']: 0,
            ['pod']: 1,
            ['container']: 2,
            ['node']: 3,
            ['workload']: 4,
            ['workload_type']: 5,
            ['phase']: 6,
            ['image_spec']: 6,
            ['Value #info_namespace']: 7,
            ['Value #cpu_usage_avg']: 8,
            ['Value #cpu_usage_avg_percent']: 9,
            ['Value #cpu_usage_max']: 10,
            ['Value #cpu_usage_max_percent']: 11,
            ['Value #memory_usage_avg']: 12,
            ['Value #memory_usage_avg_percent']: 13,
            ['Value #memory_usage_max']: 14,
            ['Value #memory_usage_max_percent']: 15,
            ['Value #ready_pods / Value #desired_pods']: 16,
            ['Value #alerts']: 17,
          },
          renameByName: {
            ['node']: 'NODE',
            ['namespace']: 'NAMESPACE',
            ['workload']: 'WORKLOAD',
            ['workload_type']: 'WORKLOAD TYPE',
            ['pod']: 'POD',
            ['container']: 'CONTAINER',
            ['phase']: 'PHASE',
            ['image_spec']: 'IMAGE',
            ['Value #info_namespace']: 'WORKLOADS',
            ['Value #cpu_usage_avg']: 'CPU AVG',
            ['Value #cpu_usage_avg_percent']: 'CPU AVG %',
            ['Value #cpu_usage_max']: 'CPU MAX',
            ['Value #cpu_usage_max_percent']: 'CPU MAX %',
            ['Value #memory_usage_avg']: 'MEM AVG',
            ['Value #memory_usage_avg_percent']: 'MEM AVG %',
            ['Value #memory_usage_max']: 'MEM MAX',
            ['Value #memory_usage_max_percent']: 'MEM MAX %',
            ['Value #ready_pods / Value #desired_pods']: 'READY',
            ['Value #alerts']: 'ALERTS',
          },
        },
      },
    ],
  });

  const viz = VizConfigBuilders.table()
    .setOption('sortBy', [
      {
        desc: false,
        displayName: 'NAMESPACE',
      },
      {
        desc: false,
        displayName: 'POD',
      },
      {
        desc: false,
        displayName: 'NODE',
      },
      {
        desc: false,
        displayName: 'WORKLOAD',
      },
      {
        desc: false,
        displayName: 'WORKLOAD TYPE',
      },
    ])
    .setOverrides((b) => {
      return b
        .matchFieldsWithName('node')
        .overrideCustomFieldConfig('width', 300)
        .overrideLinks([
          {
            title: '',
            url: `${prefixRoute(ROUTES.MetricsNodes)}/\${__value.raw}\${__url.params:exclude:var-node,var-namespace,var-workloadtype,var-workload,var-pod}`,
          },
        ])
        .build();
    })
    .setOverrides((b) => {
      return b
        .matchFieldsWithName('namespace')
        .overrideCustomFieldConfig('width', 300)
        .overrideLinks([
          {
            title: '',
            url: `${prefixRoute(ROUTES.MetricsNamespaces)}/\${__value.raw}\${__url.params:exclude:var-node,var-namespace,var-workloadtype,var-workload,var-pod,var-pvc}`,
          },
        ])
        .build();
    })
    .setOverrides((b) => {
      return b
        .matchFieldsWithName('workload')
        .overrideCustomFieldConfig('width', 300)
        .overrideLinks([
          {
            title: '',
            url: `${prefixRoute(ROUTES.MetricsWorkloads)}/\${__data.fields["namespace"].text}/\${__data.fields["workload_type"].text}/\${__value.raw}\${__url.params:exclude:var-node,var-namespace,var-workloadtype,var-workload,var-pod,var-pvc}`,
          },
        ])
        .build();
    })
    .setOverrides((b) => {
      return b
        .matchFieldsWithName('workload_type')
        .overrideCustomFieldConfig('width', 150)
        .build();
    })
    .setOverrides((b) => {
      return b
        .matchFieldsWithName('pod')
        .overrideCustomFieldConfig('width', 300)
        .overrideLinks([
          {
            title: '',
            url: `${prefixRoute(ROUTES.MetricsPods)}/\${__data.fields["namespace"].text}/\${__value.raw}\${__url.params:exclude:var-node,var-namespace,var-workloadtype,var-workload,var-pod,var-pvc}`,
          },
        ])
        .build();
    })
    .setOverrides((b) => {
      return b
        .matchFieldsWithName('container')
        .overrideCustomFieldConfig('width', 200)
        .build();
    })
    .setOverrides((b) => {
      return b
        .matchFieldsWithName('phase')
        .overrideCustomFieldConfig('width', 100)
        .overrideCustomFieldConfig('cellOptions', {
          type: TableCellDisplayMode.ColorText,
        })
        .overrideMappings([
          {
            options: {
              ['Running']: {
                color: 'green',
                index: 0,
              },
              ['Succeeded']: {
                color: 'green',
                index: 1,
              },
              ['Unknown']: {
                color: 'orange',
                index: 1,
              },
              ['Failed']: {
                color: 'red',
                index: 1,
              },
              ['Pending']: {
                color: 'red',
                index: 1,
              },
            },
            type: MappingType.ValueToText,
          },
        ])
        .build();
    })
    .setOverrides((b) => {
      return b
        .matchFieldsWithName('image_spec')
        .overrideCustomFieldConfig('width', 300)
        .build();
    })
    .setOverrides((b) =>
      b
        .matchFieldsWithName('Value #info_namespace')
        .overrideCustomFieldConfig('width', 100),
    )
    .setOverrides((b) =>
      b.matchFieldsWithName('Value #cpu_usage_avg').overrideUnit('cores'),
    )
    .setOverrides((b) =>
      b
        .matchFieldsWithName('Value #cpu_usage_avg_percent')
        .overrideUnit('percentunit')
        .overrideCustomFieldConfig('width', 150)
        .overrideCustomFieldConfig('cellOptions', {
          type: TableCellDisplayMode.ColorText,
        })
        .overrideThresholds({
          mode: ThresholdsMode.Absolute,
          steps: [
            {
              color: 'orange',
              value: 0,
            },
            {
              color: 'green',
              value: 0.6,
            },
            {
              color: 'red',
              value: 0.9,
            },
          ],
        }),
    )
    .setOverrides((b) =>
      b
        .matchFieldsWithName('Value #cpu_usage_max')
        .overrideUnit('cores')
        .overrideCustomFieldConfig('width', 150),
    )
    .setOverrides((b) =>
      b
        .matchFieldsWithName('Value #cpu_usage_max_percent')
        .overrideUnit('percentunit')
        .overrideCustomFieldConfig('width', 150)
        .overrideCustomFieldConfig('cellOptions', {
          type: TableCellDisplayMode.ColorText,
        })
        .overrideThresholds({
          mode: ThresholdsMode.Absolute,
          steps: [
            {
              color: 'orange',
              value: 0,
            },
            {
              color: 'green',
              value: 0.6,
            },
            {
              color: 'red',
              value: 0.9,
            },
          ],
        }),
    )
    .setOverrides((b) =>
      b
        .matchFieldsWithName('Value #memory_usage_avg')
        .overrideUnit('bytes')
        .overrideCustomFieldConfig('width', 150),
    )
    .setOverrides((b) =>
      b
        .matchFieldsWithName('Value #memory_usage_avg_percent')
        .overrideUnit('percentunit')
        .overrideCustomFieldConfig('width', 150)
        .overrideCustomFieldConfig('cellOptions', {
          type: TableCellDisplayMode.ColorText,
        })
        .overrideThresholds({
          mode: ThresholdsMode.Absolute,
          steps: [
            {
              color: 'orange',
              value: 0,
            },
            {
              color: 'green',
              value: 0.6,
            },
            {
              color: 'red',
              value: 0.9,
            },
          ],
        }),
    )
    .setOverrides((b) =>
      b
        .matchFieldsWithName('Value #memory_usage_max')
        .overrideUnit('bytes')
        .overrideCustomFieldConfig('width', 150),
    )
    .setOverrides((b) =>
      b
        .matchFieldsWithName('Value #memory_usage_max_percent')
        .overrideUnit('percentunit')
        .overrideCustomFieldConfig('width', 150)
        .overrideCustomFieldConfig('cellOptions', {
          type: TableCellDisplayMode.ColorText,
        })
        .overrideThresholds({
          mode: ThresholdsMode.Absolute,
          steps: [
            {
              color: 'orange',
              value: 0,
            },
            {
              color: 'green',
              value: 0.6,
            },
            {
              color: 'red',
              value: 0.9,
            },
          ],
        }),
    )
    .setOverrides((b) =>
      b
        .matchFieldsWithName('Value #ready_pods / Value #desired_pods')
        .overrideUnit('percentunit')
        .overrideCustomFieldConfig('width', 100)
        .overrideCustomFieldConfig('cellOptions', {
          type: TableCellDisplayMode.ColorText,
        })
        .overrideThresholds({
          mode: ThresholdsMode.Absolute,
          steps: [
            {
              color: 'red',
              value: 0,
            },
            {
              color: 'orange',
              value: 0.6,
            },
            {
              color: 'green',
              value: 0.9,
            },
          ],
        }),
    )
    .setOverrides((b) =>
      b
        .matchFieldsWithName('Value #alerts')
        .overrideCustomFieldConfig('width', 100)
        .overrideCustomFieldConfig('cellOptions', {
          type: TableCellDisplayMode.ColorText,
        })
        .overrideThresholds({
          mode: ThresholdsMode.Absolute,
          steps: [
            {
              color: 'red',
              value: 1,
            },
          ],
        }),
    )
    .build();

  const menu = useVizPanelMenu({
    data: dataProvider.useState(),
    viz,
  });

  return (
    <VizPanel
      title={title}
      menu={menu}
      viz={viz}
      dataProvider={dataTransformer}
    />
  );
}
