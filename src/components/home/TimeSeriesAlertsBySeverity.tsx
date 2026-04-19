import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import { LegendDisplayMode } from '@grafana/schema';
import React from 'react';

import { useVizPanelMenu } from '../../hooks/useVizPanelMenu';
import { queries } from '../../utils/utils.queries';

export function TimeSeriesAlertsBySeverity() {
  const dataProvider = useQueryRunner({
    datasource: {
      type: 'prometheus',
      uid: '$prometheus',
    },
    queries: [
      {
        refId: 'alerts_by_severity',
        format: 'time_series',
        interval: '$__rate_interval',
        expr: queries.cluster.alertsBySeverity,
        legendFormat: '{{severity}}',
      },
    ],
  });

  const viz = VizConfigBuilders.timeseries()
    .setUnit('short')
    .setOption('legend', {
      asTable: true,
      displayMode: LegendDisplayMode.Table,
      placement: 'bottom',
      calcs: ['last'],
    })
    .setCustomFieldConfig('fillOpacity', 10)
    .setOverrides((b) =>
      b.matchFieldsWithNameByRegex('.*').overrideColor({
        mode: 'fixed',
        fixedColor: 'green',
      }),
    )
    .setOverrides((b) =>
      b.matchFieldsWithName('critical').overrideColor({
        mode: 'fixed',
        fixedColor: 'purple',
      }),
    )
    .setOverrides((b) =>
      b.matchFieldsWithName('error').overrideColor({
        mode: 'fixed',
        fixedColor: 'red',
      }),
    )
    .setOverrides((b) =>
      b.matchFieldsWithName('warning').overrideColor({
        mode: 'fixed',
        fixedColor: 'orange',
      }),
    )
    .setOverrides((b) =>
      b.matchFieldsWithName('info').overrideColor({
        mode: 'fixed',
        fixedColor: 'blue',
      }),
    )
    .build();

  const menu = useVizPanelMenu({
    data: dataProvider.useState(),
    viz,
  });

  return (
    <VizPanel
      title="Alert Severity"
      menu={menu}
      viz={viz}
      dataProvider={dataProvider}
    />
  );
}
