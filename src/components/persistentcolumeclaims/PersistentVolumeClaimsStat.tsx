import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import {
  BigValueColorMode,
  BigValueGraphMode,
  BigValueTextMode,
  ThresholdsMode,
} from '@grafana/schema';
import React from 'react';

import { useVizPanelMenu } from '../../hooks/useVizPanelMenu';

interface Props {
  title: string;
  expr: string;
}

export function PersistentVolumeClaimsStat({ title, expr }: Props) {
  const dataProvider = useQueryRunner({
    datasource: {
      type: 'prometheus',
      uid: '$prometheus',
    },
    queries: [
      {
        refId: 'stat',
        format: 'time_series',
        instant: true,
        expr: expr,
      },
    ],
  });

  const viz = VizConfigBuilders.stat()
    .setOption('colorMode', BigValueColorMode.Background)
    .setOption('graphMode', BigValueGraphMode.None)
    .setOption('textMode', BigValueTextMode.Value)
    .setThresholds({
      mode: ThresholdsMode.Absolute,
      steps: [
        {
          color: 'green',
          value: 0,
        },
        {
          color: 'red',
          value: 1,
        },
      ],
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
