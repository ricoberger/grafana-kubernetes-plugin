import { SceneDataQuery, VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import { LegendDisplayMode } from '@grafana/schema';
import React from 'react';

import { useVizPanelMenu } from '../../hooks/useVizPanelMenu';

interface Props {
  title: string;
  unit: string;
  capacityExpr?: string;
  allocationExpr?: string;
  limitsExpr?: string;
  requestsExpr?: string;
  usageExpr?: string;
}

export function TimeSeriesMemoryOrCPU({
  title,
  unit,
  capacityExpr,
  allocationExpr,
  limitsExpr,
  requestsExpr,
  usageExpr,
}: Props) {
  const queries: SceneDataQuery[] = [];

  if (capacityExpr) {
    queries.push({
      refId: 'capacity',
      format: 'time_series',
      expr: capacityExpr,
      legendFormat: 'Capacity',
    });
  }
  if (allocationExpr) {
    queries.push({
      refId: 'allocation',
      format: 'time_series',
      expr: allocationExpr,
      legendFormat: 'Allocation',
    });
  }
  if (limitsExpr) {
    queries.push({
      refId: 'limits',
      format: 'time_series',
      expr: limitsExpr,
      legendFormat: 'Limits',
    });
  }
  if (requestsExpr) {
    queries.push({
      refId: 'requests',
      format: 'time_series',
      expr: requestsExpr,
      legendFormat: 'Requests',
    });
  }
  if (usageExpr) {
    queries.push({
      refId: 'usage',
      format: 'time_series',
      expr: usageExpr,
      legendFormat: 'Usage',
    });
  }

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
      calcs: ['min', 'mean', 'max', 'lastNotNull'],
    })
    .setCustomFieldConfig('lineWidth', 2)
    .setCustomFieldConfig('spanNulls', true)
    .setOverrides((b) =>
      b
        .matchFieldsByQuery('capacity')
        .overrideColor({
          mode: 'fixed',
          fixedColor: 'purple',
        })
        .overrideCustomFieldConfig('fillOpacity', 10),
    )
    .setOverrides((b) =>
      b
        .matchFieldsByQuery('allocation')
        .overrideColor({
          mode: 'fixed',
          fixedColor: 'green',
        })
        .overrideCustomFieldConfig('fillOpacity', 10),
    )
    .setOverrides((b) =>
      b
        .matchFieldsByQuery('limits')
        .overrideColor({
          mode: 'fixed',
          fixedColor: 'red',
        })
        .overrideCustomFieldConfig('lineStyle', {
          dash: [10, 10],
          fill: 'dash',
        }),
    )
    .setOverrides((b) =>
      b
        .matchFieldsByQuery('requests')
        .overrideColor({
          mode: 'fixed',
          fixedColor: 'orange',
        })
        .overrideCustomFieldConfig('lineStyle', {
          dash: [10, 10],
          fill: 'dash',
        }),
    )
    .setOverrides((b) =>
      b.matchFieldsByQuery('usage').overrideColor({
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
    <VizPanel title={title} menu={menu} viz={viz} dataProvider={dataProvider} />
  );
}
