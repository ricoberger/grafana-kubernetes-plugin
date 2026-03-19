import React from 'react';
import { DataTransformerID, MappingType } from '@grafana/data';
import {
  useDataTransformer,
  useQueryRunner,
  VizPanel,
} from '@grafana/scenes-react';
import { SceneDataQuery, VizConfigBuilders } from '@grafana/scenes';

import { useVizPanelMenu } from '../../../hooks/useVizPanelMenu';
import { ROUTES } from '../../../constants';
import { prefixRoute } from '../../../utils/utils.routing';

interface Props {
  title: string;
  cpuAllocationExpr: string;
  memoryAllocationExpr: string;
  cpuIdleExpr: string;
  memoryIdleExpr: string;
}

export function TableCosts({
  title,
  cpuAllocationExpr,
  memoryAllocationExpr,
  cpuIdleExpr,
  memoryIdleExpr,
}: Props) {
  const queries: SceneDataQuery[] = [
    {
      refId: 'cpu_allocation',
      format: 'table',
      instant: true,
      expr: cpuAllocationExpr,
    },
    {
      refId: 'cpu_idle',
      format: 'table',
      instant: true,
      expr: cpuIdleExpr,
    },
    {
      refId: 'memory_allocation',
      format: 'table',
      instant: true,
      expr: memoryAllocationExpr,
    },
    {
      refId: 'memory_idle',
      format: 'table',
      instant: true,
      expr: memoryIdleExpr,
    },
  ];

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
            left: 'Value #cpu_allocation',
            operator: '+',
            right: 'Value #memory_allocation',
          },
        },
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
            left: 'Value #cpu_idle',
            operator: '+',
            right: 'Value #memory_idle',
          },
        },
      },
      {
        id: DataTransformerID.organize,
        options: {
          includeByName: {
            ['node']: true,
            ['namespace']: true,
            ['workload']: true,
            ['workload_type']: true,
            ['pod']: true,
            ['container']: true,
            ['Value #cpu_allocation']: true,
            ['Value #memory_allocation']: true,
            ['Value #cpu_allocation + Value #memory_allocation']: true,
            ['Value #cpu_idle']: true,
            ['Value #memory_idle']: true,
            ['Value #cpu_idle + Value #memory_idle']: true,
          },
          indexByName: {
            ['namespace']: 0,
            ['pod']: 1,
            ['container']: 2,
            ['node']: 3,
            ['workload']: 4,
            ['workload_type']: 5,
            ['Value #cpu_allocation']: 7,
            ['Value #memory_allocation']: 8,
            ['Value #cpu_allocation + Value #memory_allocation']: 9,
            ['Value #cpu_idle']: 10,
            ['Value #memory_idle']: 11,
            ['Value #cpu_idle + Value #memory_idle']: 12,
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
            ['Value #cpu_allocation']: 'CPU ALLOCATION',
            ['Value #memory_allocation']: 'MEMORY ALLOCATION',
            ['Value #cpu_idle']: 'CPU IDLE',
            ['Value #memory_idle']: 'MEMORY IDLE',
            ['Value #cpu_allocation + Value #memory_allocation']:
              'TOTAL ALLOCATION',
            ['Value #cpu_idle + Value #memory_idle']: 'TOTAL IDLE',
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
    .setOverrides((b) =>
      b
        .matchFieldsWithName('Value #cpu_allocation')
        .overrideUnit('currencyUSD'),
    )
    .setOverrides((b) =>
      b
        .matchFieldsWithName('Value #memory_allocation')
        .overrideUnit('currencyUSD'),
    )
    .setOverrides((b) =>
      b
        .matchFieldsWithName('Value #cpu_allocation + Value #memory_allocation')
        .overrideUnit('currencyUSD'),
    )
    .setOverrides((b) =>
      b
        .matchFieldsWithName('Value #cpu_idle')
        .overrideUnit('currencyUSD')
        .overrideMappings([
          {
            options: {
              from: null,
              to: 0,
              result: {
                text: 'Undersized',
                index: 0,
              },
            },
            type: MappingType.RangeToText,
          },
        ]),
    )
    .setOverrides((b) =>
      b
        .matchFieldsWithName('Value #memory_idle')
        .overrideUnit('currencyUSD')
        .overrideMappings([
          {
            options: {
              from: null,
              to: 0,
              result: {
                text: 'Undersized',
                index: 0,
              },
            },
            type: MappingType.RangeToText,
          },
        ]),
    )
    .setOverrides((b) =>
      b
        .matchFieldsWithName('Value #cpu_idle + Value #memory_idle')
        .overrideUnit('currencyUSD')
        .overrideMappings([
          {
            options: {
              from: null,
              to: 0,
              result: {
                text: 'Undersized',
                index: 0,
              },
            },
            type: MappingType.RangeToText,
          },
        ]),
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
