import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import {
  BigValueColorMode,
  BigValueGraphMode,
  BigValueTextMode,
  FieldColorModeId,
} from '@grafana/schema';
import React from 'react';

import { useVizPanelMenu } from '../../../hooks/useVizPanelMenu';
import { prefixRoute } from '../../../utils/utils.routing';

interface Props {
  title: string;
  expr: string;
  route: string;
  color?: string;
}

export function StatWithFixedColorAndLink({
  title,
  expr,
  route,
  color = 'blue',
}: Props) {
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
    .setColor({
      mode: FieldColorModeId.Fixed,
      fixedColor: color,
    })
    .setOption('colorMode', BigValueColorMode.Background)
    .setOption('graphMode', BigValueGraphMode.None)
    .setOption('textMode', BigValueTextMode.Value)
    .setLinks([
      {
        url: `${prefixRoute(route)}\${__url.params:exclude:var-node,var-namespace,var-workloadtype,var-workload,var-pod,var-pvc}`,
        title: title,
      },
    ])
    .build();

  const menu = useVizPanelMenu({
    data: dataProvider.useState(),
    viz,
  });

  return (
    <VizPanel title={title} menu={menu} viz={viz} dataProvider={dataProvider} />
  );
}
