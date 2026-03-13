import React from 'react';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import { LegendDisplayMode } from '@grafana/schema';
import { SceneDataQuery, VizConfigBuilders } from '@grafana/scenes';

import { useVizPanelMenu } from '../../../hooks/useVizPanelMenu';

interface Props {
  title: string;
  unit: 'binBps' | 'pps';
  color: 'blue' | 'red';
  rxExpr: string;
  txExpr: string;
  rxLegend: string;
  txLegend: string;
}

export function TimeSeriesNetwork({
  title,
  unit,
  color,
  rxExpr,
  txExpr,
  rxLegend,
  txLegend,
}: Props) {
  const queries: SceneDataQuery[] = [
    {
      refId: 'rx',
      format: 'time_series',
      expr: rxExpr,
      legendFormat: rxLegend,
    },
    {
      refId: 'tx',
      format: 'time_series',
      expr: txExpr,
      legendFormat: txLegend,
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
    .setCustomFieldConfig('axisSoftMin', -100)
    .setCustomFieldConfig('axisSoftMax', 100)
    .setOverrides((b) =>
      b
        .matchFieldsByQuery('rx')
        .overrideColor({
          mode: 'shades',
          fixedColor: `super-light-${color}`,
        })
        .overrideCustomFieldConfig('fillOpacity', 10),
    )
    .setOverrides((b) =>
      b
        .matchFieldsByQuery('tx')
        .overrideColor({
          mode: 'shades',
          fixedColor: `dark-${color}`,
        })
        .overrideCustomFieldConfig('fillOpacity', 10),
    )
    .build();

  const menu = useVizPanelMenu({
    data: dataProvider.useState(),
    viz,
  });

  return (
    <VizPanel title={title} menu={menu} viz={viz} dataProvider={dataProvider} />
  );
}
