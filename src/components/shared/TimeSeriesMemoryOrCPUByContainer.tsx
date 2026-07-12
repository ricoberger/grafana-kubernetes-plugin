import { SceneDataQuery, VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import { LegendDisplayMode } from '@grafana/schema';
import React from 'react';

import { useVizPanelMenu } from '../../hooks/useVizPanelMenu';

interface Props {
  title: string;
  unit: string;
  limitsExpr?: string;
  requestsExpr?: string;
  usageAvgExpr?: string;
  usageMaxExpr?: string;
  usageMinExpr?: string;
}

export function TimeSeriesMemoryOrCPUByContainer({
  title,
  unit,
  limitsExpr,
  requestsExpr,
  usageAvgExpr,
  usageMaxExpr,
  usageMinExpr,
}: Props) {
  const queries: SceneDataQuery[] = [];

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
  if (usageAvgExpr) {
    queries.push({
      refId: 'avg',
      format: 'time_series',
      expr: usageAvgExpr,
      legendFormat: 'Avg',
    });
  }
  if (usageMaxExpr) {
    queries.push({
      refId: 'max',
      format: 'time_series',
      expr: usageMaxExpr,
      legendFormat: 'Max',
    });
  }
  if (usageMinExpr) {
    queries.push({
      refId: 'min',
      format: 'time_series',
      expr: usageMinExpr,
      legendFormat: 'Min',
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
      b
        .matchFieldsByQuery('avg')
        .overrideColor({
          mode: 'fixed',
          fixedColor: 'blue',
        })
        .overrideCustomFieldConfig('fillBelowTo', 'Min'),
    )
    .setOverrides((b) =>
      b
        .matchFieldsByQuery('max')
        .overrideColor({
          mode: 'fixed',
          fixedColor: 'blue',
        })
        .overrideCustomFieldConfig('fillBelowTo', 'Avg')
        .overrideCustomFieldConfig('lineWidth', 0),
    )
    .setOverrides((b) =>
      b
        .matchFieldsByQuery('min')
        .overrideColor({
          mode: 'fixed',
          fixedColor: 'blue',
        })
        .overrideCustomFieldConfig('lineWidth', 0),
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
