import { DataTransformerID } from '@grafana/data';
import { VizConfigBuilders } from '@grafana/scenes';
import {
  useDataTransformer,
  useQueryRunner,
  VizPanel,
} from '@grafana/scenes-react';
import React from 'react';

import { ROUTES } from '../../constants';
import { useVizPanelMenu } from '../../hooks/useVizPanelMenu';
import { queries } from '../../utils/utils.queries';
import { prefixRoute } from '../../utils/utils.routing';

export function SearchPageWorkloads() {
  const dataProvider = useQueryRunner({
    datasource: {
      type: 'prometheus',
      uid: '$prometheus',
    },
    queries: [
      {
        refId: 'info',
        format: 'table',
        instant: true,
        expr: queries.workloads.search,
      },
    ],
  });

  const dataTransformer = useDataTransformer({
    data: dataProvider,
    transformations: [
      {
        id: DataTransformerID.organize,
        options: {
          includeByName: {
            ['namespace']: true,
            ['workload']: true,
            ['workload_type']: true,
          },
          indexByName: {
            ['namespace']: 0,
            ['workload']: 1,
            ['workload_type']: 2,
          },
          renameByName: {
            ['namespace']: 'NAMESPACE',
            ['workload']: 'WORKLOAD',
            ['workload_type']: 'WORKLOAD TYPE',
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
        displayName: 'WORKLOAD',
      },
      {
        desc: false,
        displayName: 'WORKLOAD TYPE',
      },
    ])
    .setOverrides((b) => {
      return b
        .matchFieldsWithName('namespace')
        .overrideLinks([
          {
            title: '',
            url: `${prefixRoute(ROUTES.Namespaces)}/\${__value.raw}?\${__url_time_range}&var-datasource=$datasource`,
          },
        ])
        .build();
    })
    .setOverrides((b) => {
      return b
        .matchFieldsWithName('workload')
        .overrideLinks([
          {
            title: '',
            url: `${prefixRoute(ROUTES.Workloads)}/\${__data.fields["namespace"].text}/\${__data.fields["workload_type"].text}/\${__value.raw}?\${__url_time_range}&var-datasource=$datasource`,
          },
        ])
        .build();
    })
    .setOverrides((b) => {
      return b.matchFieldsWithName('workload_type').build();
    })
    .build();

  const menu = useVizPanelMenu({
    data: dataProvider.useState(),
    viz,
  });

  return (
    <VizPanel
      title="Workloads"
      menu={menu}
      viz={viz}
      dataProvider={dataTransformer}
    />
  );
}
