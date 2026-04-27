import { SceneDataQuery, VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import { LegendDisplayMode } from '@grafana/schema';
import React from 'react';

import { useVizPanelMenu } from '../../hooks/useVizPanelMenu';

interface Props {
  title: string;
  queries: SceneDataQuery[];
}

export function TimeSeriesWorkloadStatus({ title, queries }: Props) {
  const dataProvider = useQueryRunner({
    datasource: {
      type: 'prometheus',
      uid: '$prometheus',
    },
    queries: queries,
  });

  const viz = VizConfigBuilders.timeseries()
    .setMin(0)
    .setOption('legend', {
      asTable: false,
      displayMode: LegendDisplayMode.List,
      placement: 'bottom',
    })
    .setCustomFieldConfig('lineWidth', 1)
    .setColor({
      mode: 'palette-classic',
    })
    .setOverrides((b) =>
      b
        .matchFieldsByQuery('pods')
        .overrideColor({
          mode: 'fixed',
          fixedColor: 'green',
        })
        .overrideCustomFieldConfig('fillOpacity', 10)
        .overrideCustomFieldConfig('spanNulls', true),
    )
    .setOverrides((b) =>
      b
        .matchFieldsByQuery('replicas')
        .overrideColor({
          mode: 'fixed',
          fixedColor: 'green',
        })
        .overrideCustomFieldConfig('fillOpacity', 10),
    )
    .setOverrides((b) =>
      b
        .matchFieldsByQuery('desired')
        .overrideColor({
          mode: 'fixed',
          fixedColor: 'green',
        })
        .overrideCustomFieldConfig('fillOpacity', 10),
    )
    .setOverrides((b) =>
      b
        .matchFieldsByQuery('active')
        .overrideColor({
          mode: 'fixed',
          fixedColor: 'green',
        })
        .overrideCustomFieldConfig('fillOpacity', 10),
    )
    .setOverrides((b) =>
      b.matchFieldsByQuery('available').overrideColor({
        mode: 'fixed',
        fixedColor: 'dark-green',
      }),
    )
    .setOverrides((b) =>
      b.matchFieldsByQuery('ready').overrideColor({
        mode: 'fixed',
        fixedColor: 'dark-green',
      }),
    )
    .setOverrides((b) =>
      b.matchFieldsByQuery('scheduled').overrideColor({
        mode: 'fixed',
        fixedColor: 'dark-green',
      }),
    )
    .setOverrides((b) =>
      b.matchFieldsByQuery('updated').overrideColor({
        mode: 'fixed',
        fixedColor: 'dark-green',
      }),
    )
    .setOverrides((b) =>
      b.matchFieldsByQuery('succeeded').overrideColor({
        mode: 'fixed',
        fixedColor: 'dark-green',
      }),
    )
    .setOverrides((b) =>
      b.matchFieldsByQuery('unavailable').overrideColor({
        mode: 'fixed',
        fixedColor: 'red',
      }),
    )
    .setOverrides((b) =>
      b.matchFieldsByQuery('misscheduled').overrideColor({
        mode: 'fixed',
        fixedColor: 'red',
      }),
    )
    .setOverrides((b) =>
      b.matchFieldsByQuery('failed').overrideColor({
        mode: 'fixed',
        fixedColor: 'red',
      }),
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
