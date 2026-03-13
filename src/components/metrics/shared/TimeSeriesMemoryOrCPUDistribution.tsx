import React from 'react';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import {
  FieldColorModeId,
  LegendDisplayMode,
  StackingMode,
} from '@grafana/schema';
import { SceneDataQuery, VizConfigBuilders } from '@grafana/scenes';

import { useVizPanelMenu } from '../../../hooks/useVizPanelMenu';

interface Props {
  title: string;
  unit: string;
  expr: string;
  legend: string;
}

export function TimeSeriesMemoryOrCPUDistribution({
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
    })
    .setCustomFieldConfig('stacking', { mode: StackingMode.Normal })
    .setCustomFieldConfig('fillOpacity', 100)
    .setColor({
      mode: FieldColorModeId.Shades,
      fixedColor: 'blue',
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
