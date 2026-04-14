import { DataTransformerID } from '@grafana/data';
import { SceneDataQuery, VizConfigBuilders } from '@grafana/scenes';
import {
  useDataTransformer,
  useQueryRunner,
  VizPanel,
} from '@grafana/scenes-react';
import React from 'react';

import { ROUTES } from '../../constants';
import { useVizPanelMenu } from '../../hooks/useVizPanelMenu';
import { prefixRoute } from '../../utils/utils.routing';

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
            ['workload_type']: true,
            ['Value #cpu_allocation + Value #memory_allocation']: true,
          },
          indexByName: {
            ['namespace']: 0,
            ['workload']: 1,
            ['workload_type']: 2,
            ['Value #cpu_allocation + Value #memory_allocation']: 3,
          },
          renameByName: {
            ['namespace']: 'NAMESPACE',
            ['workload']: 'WORKLOAD',
            ['workload_type']: 'WORKLOAD TYPE',
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
    // NOTE: See https://github.com/grafana/scenes/issues/1348 for why this is
    // working.
    .setCustomFieldConfig('hideFrom', { viz: true })
    .setOverrides((b) => {
      return (
        b
          .matchFieldsWithName('namespace')
          .overrideCustomFieldConfig('width', 300)
          .overrideLinks([
            {
              title: '',
              url: `${prefixRoute(ROUTES.Namespaces)}/\${__value.raw}?\${__url_time_range}&var-datasource=$datasource`,
            },
          ])
          // @ts-ignore
          .overrideCustomFieldConfig('hideFrom.viz', false)
          .build()
      );
    })
    .setOverrides((b) => {
      return (
        b
          .matchFieldsWithName('workload')
          .overrideCustomFieldConfig('width', 300)
          .overrideLinks([
            {
              title: '',
              url: `${prefixRoute(ROUTES.Workloads)}/\${__data.fields["namespace"].text}/\${__data.fields["workload_type"].text}/\${__value.raw}?\${__url_time_range}&var-datasource=$datasource`,
            },
          ])
          // @ts-ignore
          .overrideCustomFieldConfig('hideFrom.viz', false)
          .build()
      );
    })
    .setOverrides((b) =>
      b
        .matchFieldsWithName('Value #cpu_allocation + Value #memory_allocation')
        .overrideUnit('currencyUSD')
        // @ts-ignore
        .overrideCustomFieldConfig('hideFrom.viz', false),
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
