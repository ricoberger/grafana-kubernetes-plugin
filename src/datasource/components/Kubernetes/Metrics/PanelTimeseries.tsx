import {
  PanelBuilders,
  SceneDataQuery,
  SceneQueryRunner,
  SceneTimeRange,
  VizPanelMenu,
} from '@grafana/scenes';
import { LegendDisplayMode } from '@grafana/schema';

import { DataSourceOptions } from '../../../types/settings';

export function PanelTimeseries(
  settings: DataSourceOptions,
  title: string,
  unit: string,
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

  return PanelBuilders.timeseries()
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
    .setOption('legend', {
      asTable: true,
      displayMode: LegendDisplayMode.Table,
      placement: 'bottom',
      calcs: ['min', 'mean', 'max', 'lastNotNull'],
    })
    .setUnit(unit)
    .setMin(0)
    .setOverrides((b) =>
      b.matchFieldsByQuery('A').overrideColor({
        mode: 'fixed',
        fixedColor: 'rgb(115, 191, 105)',
      }),
    )
    .setOverrides((b) =>
      b.matchFieldsByQuery('B').overrideColor({
        mode: 'fixed',
        fixedColor: 'rgb(250, 222, 42)',
      }),
    )
    .setOverrides((b) =>
      b.matchFieldsByQuery('C').overrideColor({
        mode: 'fixed',
        fixedColor: 'rgb(242, 73, 92)',
      }),
    )
    .setOverrides((b) =>
      b.matchFieldsByQuery('D').overrideColor({
        mode: 'fixed',
        fixedColor: 'rgb(87, 148, 242)',
      }),
    )
    .setOverrides((b) =>
      b.matchFieldsByQuery('E').overrideColor({
        mode: 'fixed',
        fixedColor: 'rgb(255, 152, 48)',
      }),
    )
    .setOverrides((b) =>
      b.matchFieldsByQuery('F').overrideColor({
        mode: 'fixed',
        fixedColor: 'rgb(184, 119, 217)',
      }),
    );
}
