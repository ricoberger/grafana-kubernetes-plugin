import { DataTransformerID, MappingType, ThresholdsMode } from '@grafana/data';
import { SceneDataQuery, VizConfigBuilders } from '@grafana/scenes';
import {
  useDataTransformer,
  useQueryRunner,
  VizPanel,
} from '@grafana/scenes-react';
import {
  BarGaugeDisplayMode,
  BarGaugeValueMode,
  TableCellDisplayMode,
} from '@grafana/schema';
import React from 'react';

import { ROUTES } from '../../constants';
import { useVizPanelMenu } from '../../hooks/useVizPanelMenu';
import { queries } from '../../utils/utils.queries';
import { prefixRoute } from '../../utils/utils.routing';

export function TablePersistentVolumeClaimsUsage() {
  const q: SceneDataQuery[] = [
    {
      refId: 'info',
      format: 'table',
      instant: true,
      expr: queries.persistentVolumeClaims.info,
    },
    {
      refId: 'capacity',
      format: 'table',
      instant: true,
      expr: queries.persistentVolumeClaims.capacity,
    },
    {
      refId: 'used',
      format: 'table',
      instant: true,
      expr: queries.persistentVolumeClaims.used,
    },
    {
      refId: 'available',
      format: 'table',
      instant: true,
      expr: queries.persistentVolumeClaims.available,
    },
    {
      refId: 'phase',
      format: 'table',
      instant: true,
      expr: queries.persistentVolumeClaims.phase,
    },
    {
      refId: 'used_percent',
      format: 'table',
      instant: true,
      expr: queries.persistentVolumeClaims.usedPercent,
    },
  ];

  const dataProvider = useQueryRunner({
    datasource: {
      type: 'prometheus',
      uid: '$prometheus',
    },
    queries: q,
  });

  const dataTransformer = useDataTransformer({
    data: dataProvider,
    transformations: [
      {
        id: DataTransformerID.merge,
        options: {},
      },
      {
        id: DataTransformerID.organize,
        options: {
          includeByName: {
            ['namespace']: true,
            ['persistentvolumeclaim']: true,
            ['storageclass']: true,
            ['volumename']: true,
            ['Value #info']: false,
            ['Value #capacity']: true,
            ['Value #used']: true,
            ['Value #available']: true,
            ['Value #phase']: true,
            ['Value #used_percent']: true,
          },
          indexByName: {
            ['namespace']: 0,
            ['persistentvolumeclaim']: 1,
            ['storageclass']: 2,
            ['volumename']: 3,
            ['Value #info']: 4,
            ['Value #capacity']: 5,
            ['Value #used']: 6,
            ['Value #available']: 7,
            ['Value #phase']: 8,
            ['Value #used_percent']: 9,
          },
          renameByName: {
            ['namespace']: 'NAMESPACE',
            ['persistentvolumeclaim']: 'NAME',
            ['storageclass']: 'STORAGE CLASS',
            ['volumename']: 'VOLUME NAME',
            ['Value #info']: 'INFO',
            ['Value #capacity']: 'CAPACITY',
            ['Value #used']: 'USED',
            ['Value #available']: 'AVAILABLE',
            ['Value #phase']: 'PHASE',
            ['Value #used_percent']: 'USED %',
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
        displayName: 'NAME',
      },
    ])
    .setOverrides((b) => {
      return b
        .matchFieldsWithName('namespace')
        .overrideCustomFieldConfig('width', 300)
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
        .matchFieldsWithName('persistentvolumeclaim')
        .overrideCustomFieldConfig('width', 300)
        .overrideLinks([
          {
            title: '',
            url: `${prefixRoute(ROUTES.MetricsPersistentVolumeClaims)}/\${__data.fields["namespace"].text}/\${__value.raw}?\${__url_time_range}&var-datasource=$datasource`,
          },
        ])
        .build();
    })
    .setOverrides((b) => {
      return b
        .matchFieldsWithName('storageclass')
        .overrideCustomFieldConfig('width', 200)
        .build();
    })
    .setOverrides((b) => {
      return b
        .matchFieldsWithName('volumename')
        .overrideCustomFieldConfig('width', 200)
        .build();
    })
    .setOverrides((b) => {
      return b
        .matchFieldsWithName('Value #capacity')
        .overrideCustomFieldConfig('width', 100)
        .overrideUnit('bytes')
        .build();
    })
    .setOverrides((b) => {
      return b
        .matchFieldsWithName('Value #used')
        .overrideCustomFieldConfig('width', 100)
        .overrideUnit('bytes')
        .build();
    })
    .setOverrides((b) => {
      return b
        .matchFieldsWithName('Value #available')
        .overrideCustomFieldConfig('width', 100)
        .overrideUnit('bytes')
        .build();
    })
    .setOverrides((b) => {
      return b
        .matchFieldsWithName('Value #phase')
        .overrideCustomFieldConfig('width', 100)
        .overrideCustomFieldConfig('cellOptions', {
          type: TableCellDisplayMode.ColorBackground,
        })
        .overrideMappings([
          {
            options: {
              ['0']: {
                text: 'Bound',
                color: 'green',
                index: 0,
              },
              ['1']: {
                text: 'Pending',
                color: 'red',
                index: 1,
              },
              ['2']: {
                text: 'Lost',
                color: 'red',
                index: 2,
              },
            },
            type: MappingType.ValueToText,
          },
        ])
        .build();
    })
    .setOverrides((b) => {
      return b
        .matchFieldsWithName('Value #used_percent')
        .overrideCustomFieldConfig('width', 200)
        .overrideUnit('percentunit')
        .overrideCustomFieldConfig('cellOptions', {
          type: TableCellDisplayMode.Gauge,
          mode: BarGaugeDisplayMode.Lcd,
          valueDisplayMode: BarGaugeValueMode.Color,
        })
        .overrideMin(0)
        .overrideMax(1)
        .overrideDecimals(2)
        .overrideThresholds({
          mode: ThresholdsMode.Absolute,
          steps: [
            {
              color: 'green',
              value: 0,
            },
            {
              color: 'orange',
              value: 0.8,
            },
            {
              color: 'red',
              value: 0.9,
            },
          ],
        })
        .build();
    })
    .build();

  const menu = useVizPanelMenu({
    data: dataProvider.useState(),
    viz,
  });

  return (
    <VizPanel
      title="PersistentVolumeClaims"
      menu={menu}
      viz={viz}
      dataProvider={dataTransformer}
    />
  );
}
