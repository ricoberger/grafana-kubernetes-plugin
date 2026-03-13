import React from 'react';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import { LegendDisplayMode } from '@grafana/schema';
import { SceneDataQuery, VizConfigBuilders } from '@grafana/scenes';

import { useVizPanelMenu } from '../../../hooks/useVizPanelMenu';

interface Props {
  title: string;
  unit: 'Bps' | 'iops' | 'binBps' | 'pps';
  color: 'blue' | 'purple' | 'red';
  inExpr: string;
  outExpr: string;
  inLegend: string;
  outLegend: string;
}

export function TimeSeriesIO({
  title,
  unit,
  color,
  inExpr,
  outExpr,
  inLegend,
  outLegend,
}: Props) {
  const queries: SceneDataQuery[] = [
    {
      refId: 'in',
      format: 'time_series',
      expr: inExpr,
      legendFormat: inLegend,
    },
    {
      refId: 'out',
      format: 'time_series',
      expr: outExpr,
      legendFormat: outLegend,
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
      calcs: ['lastNotNull'],
    })
    .setCustomFieldConfig('axisSoftMin', -100)
    .setCustomFieldConfig('axisSoftMax', 100)
    .setOverrides((b) =>
      b
        .matchFieldsByQuery('in')
        .overrideColor({
          mode: 'shades',
          fixedColor: `super-light-${color}`,
        })
        .overrideCustomFieldConfig('fillOpacity', 10),
    )
    .setOverrides((b) =>
      b
        .matchFieldsByQuery('out')
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
