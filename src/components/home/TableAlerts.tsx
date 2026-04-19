import { DataTransformerID, MappingType } from '@grafana/data';
import { VizConfigBuilders } from '@grafana/scenes';
import {
  useDataTransformer,
  useQueryRunner,
  VizPanel,
} from '@grafana/scenes-react';
import { TableCellDisplayMode } from '@grafana/schema';
import React from 'react';

import { ROUTES } from '../../constants';
import { useVizPanelMenu } from '../../hooks/useVizPanelMenu';
import { queries } from '../../utils/utils.queries';
import { prefixRoute } from '../../utils/utils.routing';

export function TableAlerts() {
  const dataProvider = useQueryRunner({
    datasource: {
      type: 'prometheus',
      uid: '$prometheus',
    },
    queries: [
      {
        refId: 'alerts',
        format: 'table',
        instant: true,
        expr: queries.cluster.alerts,
      },
    ],
  });

  const dataTransformer = useDataTransformer({
    data: dataProvider,
    transformations: [
      {
        id: DataTransformerID.joinByField,
        options: {
          byField: 'join_key',
          mode: 'outer',
        },
      },
      {
        id: DataTransformerID.organize,
        options: {
          includeByName: {
            ['alertname']: true,
            ['severity']: true,
            ['node']: true,
            ['namespace']: true,
            ['persistentvolumeclaim']: true,
            ['workload']: true,
            ['workload_type']: true,
            ['pod']: true,
            ['container']: true,
            ['reason']: true,
          },
          indexByName: {
            ['alertname']: 0,
            ['severity']: 1,
            ['node']: 2,
            ['namespace']: 3,
            ['persistentvolumeclaim']: 4,
            ['workload']: 5,
            ['workload_type']: 6,
            ['pod']: 7,
            ['container']: 8,
            ['reason']: 9,
          },
          renameByName: {
            ['alertname']: 'ALERTNAME',
            ['severity']: 'SEVERITY',
            ['node']: 'NODE',
            ['namespace']: 'NAMESPACE',
            ['persistentvolumeclaim']: 'PVC',
            ['workload']: 'WORKLOAD',
            ['workload_type']: 'WORKLOAD TYPE',
            ['pod']: 'POD',
            ['container']: 'CONTAINER',
            ['reason']: 'REASON',
          },
        },
      },
    ],
  });

  const viz = VizConfigBuilders.table()
    .setOverrides((b) => {
      return b
        .matchFieldsWithName('alertname')
        .overrideCustomFieldConfig('width', 300)
        .build();
    })
    .setOverrides((b) => {
      return b
        .matchFieldsWithName('severity')
        .overrideCustomFieldConfig('width', 100)
        .overrideCustomFieldConfig('cellOptions', {
          type: TableCellDisplayMode.ColorText,
        })
        .overrideMappings([
          {
            options: {
              ['critical']: {
                color: 'purpel',
                index: 0,
              },
              ['error']: {
                color: 'red',
                index: 1,
              },
              ['warning']: {
                color: 'orange',
                index: 2,
              },
              ['info']: {
                color: 'blue',
                index: 3,
              },
            },
            type: MappingType.ValueToText,
          },
        ])
        .build();
    })
    .setOverrides((b) => {
      return b
        .matchFieldsWithName('node')
        .overrideCustomFieldConfig('width', 200)
        .overrideLinks([
          {
            title: '',
            url: `${prefixRoute(ROUTES.Nodes)}/\${__value.raw}?\${__url_time_range}&var-datasource=$datasource`,
          },
        ])
        .build();
    })
    .setOverrides((b) => {
      return b
        .matchFieldsWithName('namespace')
        .overrideCustomFieldConfig('width', 200)
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
        .matchFieldsWithName('persistentvolumeclaim')
        .overrideCustomFieldConfig('width', 200)
        .overrideLinks([
          {
            title: '',
            url: `${prefixRoute(ROUTES.PersistentVolumeClaims)}/\${__data.fields["namespace"].text}/\${__value.raw}?\${__url_time_range}&var-datasource=$datasource`,
          },
        ])
        .build();
    })
    .setOverrides((b) => {
      return b
        .matchFieldsWithName('workload')
        .overrideCustomFieldConfig('width', 200)
        .overrideLinks([
          {
            title: '',
            url: `${prefixRoute(ROUTES.Workloads)}/\${__data.fields["namespace"].text}/\${__data.fields["workload_type"].text}/\${__value.raw}?\${__url_time_range}&var-datasource=$datasource`,
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
            url: `${prefixRoute(ROUTES.Pods)}/\${__data.fields["namespace"].text}/\${__value.raw}?\${__url_time_range}&var-datasource=$datasource`,
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
        .matchFieldsWithName('reason')
        .overrideCustomFieldConfig('width', 300)
        .build();
    })
    .build();

  const menu = useVizPanelMenu({
    data: dataProvider.useState(),
    viz,
  });

  return (
    <VizPanel
      title="Alerts"
      menu={menu}
      viz={viz}
      dataProvider={dataTransformer}
    />
  );
}
