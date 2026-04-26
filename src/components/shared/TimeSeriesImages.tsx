import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import {
  FieldColorModeId,
  GraphDrawStyle,
  LegendDisplayMode,
  StackingMode,
} from '@grafana/schema';
import React from 'react';

import { useVizPanelMenu } from '../../hooks/useVizPanelMenu';

interface Props {
  expr: string;
  legendFormat: string;
}

export function TimeSeriesImages({ expr, legendFormat }: Props) {
  const dataProvider = useQueryRunner({
    datasource: {
      type: 'prometheus',
      uid: '$prometheus',
    },
    queries: [
      {
        refId: 'images',
        format: 'time_series',
        expr: expr,
        legendFormat: legendFormat,
      },
    ],
  });

  const viz = VizConfigBuilders.timeseries()
    .setMin(0)
    .setOption('legend', {
      asTable: false,
      displayMode: LegendDisplayMode.List,
      placement: 'bottom',
    })
    .setCustomFieldConfig('drawStyle', GraphDrawStyle.Bars)
    .setCustomFieldConfig('stacking', { mode: StackingMode.Normal })
    .setColor({
      mode: FieldColorModeId.PaletteClassic,
    })
    .build();

  const menu = useVizPanelMenu({
    data: dataProvider.useState(),
    viz,
  });

  return (
    <VizPanel
      title="Images"
      menu={menu}
      viz={viz}
      dataProvider={dataProvider}
    />
  );
}
