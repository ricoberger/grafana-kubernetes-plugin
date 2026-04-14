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

export function SearchPagePods() {
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
        expr: queries.pods.search,
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
            ['pod']: true,
          },
          indexByName: {
            ['namespace']: 0,
            ['pod']: 1,
          },
          renameByName: {
            ['namespace']: 'NAMESPACE',
            ['pod']: 'POD',
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
    ])
    .setOverrides((b) => {
      return b
        .matchFieldsWithName('namespace')
        .overrideLinks([
          {
            title: '',
            url: `${prefixRoute(ROUTES.MetricsNamespaces)}/\${__value.raw}?\${__url_time_range}&var-datasource=$datasource`,
          },
        ])
        .build();
    })
    .setOverrides((b) => {
      return b
        .matchFieldsWithName('pod')
        .overrideLinks([
          {
            title: '',
            url: `${prefixRoute(ROUTES.MetricsPods)}/\${__data.fields["namespace"].text}/\${__value.raw}?\${__url_time_range}&var-datasource=$datasource`,
          },
        ])
        .build();
    })
    .build();

  const menu = useVizPanelMenu({
    data: dataProvider.useState(),
    viz,
  });

  return (
    <VizPanel
      title="Pods"
      menu={menu}
      viz={viz}
      dataProvider={dataTransformer}
    />
  );
}
