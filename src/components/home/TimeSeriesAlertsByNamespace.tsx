import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import { LegendDisplayMode } from '@grafana/schema';
import React from 'react';

import { useVizPanelMenu } from '../../hooks/useVizPanelMenu';
import { queries } from '../../utils/utils.queries';

export function TimeSeriesAlertsByNamespace() {
  const dataProvider = useQueryRunner({
    datasource: {
      type: 'prometheus',
      uid: '$prometheus',
    },
    queries: [
      {
        refId: 'alerts_by_namespace',
        format: 'time_series',
        interval: '$__rate_interval',
        expr: queries.cluster.alertsByNamespace,
        legendFormat: '{{namespace}}',
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
