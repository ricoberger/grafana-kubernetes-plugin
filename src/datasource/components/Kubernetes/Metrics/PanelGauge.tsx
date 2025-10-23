import {
  PanelBuilders,
  SceneDataQuery,
  SceneQueryRunner,
  SceneTimeRange,
  VizPanelMenu,
} from '@grafana/scenes';

import { DataSourceOptions } from '../../../types/settings';
import { ThresholdsMode } from '@grafana/schema';

export function PanelGauge(
  settings: DataSourceOptions,
  title: string,
  thresholds: number[],
  queries: SceneDataQuery[],
) {
  const explore = encodeURIComponent(
    JSON.stringify({
      datasource: settings.integrationsMetricsDatasourceUid,
      queries: queries,
      range: {
        from: 'now-1h',
        to: 'now',
      },
    }),
  );

  return PanelBuilders.gauge()
    .setData(
      new SceneQueryRunner({
        datasource: {
          type: 'prometheus',
          uid: settings.integrationsMetricsDatasourceUid,
        },
        $timeRange: new SceneTimeRange({ from: 'now-1h', to: 'now' }),
        queries: queries,
      }),
    )
    .setTitle(title)
    .setMenu(
      new VizPanelMenu({
        items: [
          {
            text: 'Explore',
            iconClassName: 'compass',
            href: '/explore?left=' + explore,
          },
        ],
      }),
    )
    .setUnit('percent')
    .setThresholds({
      mode: ThresholdsMode.Absolute,
      steps: [
        { color: 'green', value: thresholds[0] },
        { color: 'orange', value: thresholds[1] },
        { color: 'red', value: thresholds[2] },
      ],
    });
}
