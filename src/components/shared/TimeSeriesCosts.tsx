import { SceneDataQuery, VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import {
  LegendDisplayMode,
  StackingMode,
  TooltipDisplayMode,
} from '@grafana/schema';
import React from 'react';

import { useVizPanelMenu } from '../../hooks/useVizPanelMenu';

interface Props {
  title: string;
  description: string;
  cpuExpr: string;
  memoryExpr: string;
  totalExpr?: string;
}

export function TimeSeriesCosts({
  title,
  description,
  cpuExpr,
  memoryExpr,
  totalExpr,
}: Props) {
  const queries: SceneDataQuery[] = [
    {
      refId: 'cpu',
      format: 'time_series',
      instant: false,
      range: true,
      expr: cpuExpr,
      legendFormat: 'CPU',
    },
    {
      refId: 'memory',
      format: 'time_series',
      instant: false,
      range: true,
      expr: memoryExpr,
      legendFormat: 'Memory',
    },
  ];

  if (totalExpr) {
    queries.push({
      refId: 'total',
      format: 'time_series',
      instant: false,
      range: true,
      expr: totalExpr,
      legendFormat: 'Total',
    });
  }

  const dataProvider = useQueryRunner({
    datasource: {
      type: 'prometheus',
      uid: '$prometheus',
    },
    queries,
  });

  const viz = VizConfigBuilders.timeseries()
    .setUnit('suffix:$/h')
    .setOption('legend', {
      asTable: true,
      displayMode: LegendDisplayMode.Table,
      placement: 'bottom',
      calcs: ['min', 'mean', 'max', 'lastNotNull'],
    })
    .setOption('tooltip', { mode: TooltipDisplayMode.Multi })
    .setCustomFieldConfig('lineWidth', 2)
    .setCustomFieldConfig('spanNulls', false)
    .setCustomFieldConfig('stacking', { mode: StackingMode.None })
    .setOverrides((b) =>
      b
        .matchFieldsByQuery('cpu')
        .overrideColor({ mode: 'fixed', fixedColor: 'orange' })
        .matchFieldsByQuery('memory')
        .overrideColor({ mode: 'fixed', fixedColor: 'blue' })
        .matchFieldsByQuery('total')
        .overrideColor({ mode: 'fixed', fixedColor: 'green' }),
    )
    .build();

  const menu = useVizPanelMenu({
    data: dataProvider.useState(),
    viz,
  });

  return (
    <VizPanel
      title={title}
      description={description}
      menu={menu}
      viz={viz}
      dataProvider={dataProvider}
    />
  );
}
