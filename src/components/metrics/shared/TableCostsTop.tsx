import React from 'react';
import { DataTransformerID } from '@grafana/data';
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
}

export function TableCostsTop({
  title,
  cpuAllocationExpr,
  memoryAllocationExpr,
}: Props) {
  const queries: SceneDataQuery[] = [
    {
      refId: 'cpu_allocation',
      format: 'table',
      instant: true,
      expr: cpuAllocationExpr,
    },
    {
      refId: 'memory_allocation',
      format: 'table',
      instant: true,
      expr: memoryAllocationExpr,
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
        id: DataTransformerID.organize,
        options: {
          includeByName: {
            ['namespace']: true,
            ['workload']: true,
            ['Value #cpu_allocation + Value #memory_allocation']: true,
          },
          indexByName: {
            ['namespace']: 0,
            ['workload']: 1,
            ['Value #cpu_allocation + Value #memory_allocation']: 2,
          },
          renameByName: {
            ['namespace']: 'NAMESPACE',
            ['workload']: 'WORKLOAD',
            ['Value #cpu_allocation + Value #memory_allocation']: 'COST',
          },
        },
      },
    ],
  });

  const viz = VizConfigBuilders.table()
    .setOption('sortBy', [
      {
        desc: true,
        displayName: 'COST',
      },
    ])
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
    .setOverrides((b) =>
      b
        .matchFieldsWithName('Value #cpu_allocation + Value #memory_allocation')
        .overrideUnit('currencyUSD'),
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
