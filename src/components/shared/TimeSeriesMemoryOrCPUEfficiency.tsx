import { SceneDataQuery, VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import {
  FieldColorModeId,
  GraphThresholdsStyleMode,
  LegendDisplayMode,
  ThresholdsMode,
} from '@grafana/schema';
import React from 'react';

import { useVizPanelMenu } from '../../hooks/useVizPanelMenu';

interface Props {
  title: string;
  unit: string;
  expr: string;
  legend: string;
}

export function TimeSeriesMemoryOrCPUEfficiency({
  title,
  unit,
  expr,
  legend,
}: Props) {
  const queries: SceneDataQuery[] = [
    {
      refId: 'distribution',
      format: 'time_series',
      expr: expr,
      legendFormat: legend,
    },
  ];

  const dataProvider = useQueryRunner({
    datasource: {
      type: 'prometheus',
      uid: '$prometheus',
    },
    queries: queries,
  });

  const viz = VizConfigBuilders.timeseries()
    .setUnit(unit)
    .setOption('legend', {
      asTable: true,
      displayMode: LegendDisplayMode.Table,
      placement: 'bottom',
      calcs: ['p95'],
    })
    .setColor({
      mode: FieldColorModeId.Shades,
      fixedColor: 'blue',
    })
    .setThresholds({
      mode: ThresholdsMode.Absolute,
      steps: [
        {
          color: 'transparent',
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
    })
    .setCustomFieldConfig('thresholdsStyle', {
      mode: GraphThresholdsStyleMode.Dashed,
    })
    .build();

  const menu = useVizPanelMenu({
    data: dataProvider.useState(),
    viz,
  });

  return (
    <VizPanel title={title} menu={menu} viz={viz} dataProvider={dataProvider} />
  );
}
