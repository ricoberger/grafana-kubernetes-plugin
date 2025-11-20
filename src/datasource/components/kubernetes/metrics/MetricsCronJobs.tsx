import React from 'react';
import { EmbeddedScene, SceneFlexItem, SceneFlexLayout } from '@grafana/scenes';

import { DataSourceOptions } from '../../../types/settings';
import { PanelTimeseries } from './PanelTimeseries';

interface Props {
  settings: DataSourceOptions;
  namespace?: string;
  name?: string;
}

export function MetricsCronJobs({ settings, namespace, name }: Props) {
  const scene = new EmbeddedScene({
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          height: '400px',
          body: PanelTimeseries(settings, 'CronJobs', 'short', [
            {
              refId: 'B',
              expr: `sum(kube_cronjob_status_active{job="${settings.integrationsMetricsKubeStateMetricsJob}", namespace="${namespace}", cronjob=~"${name}"})`,
              format: 'time_series',
              legendFormat: 'Active',
            },
          ]).build(),
        }),
      ],
    }),
  });

  return <scene.Component model={scene} />;
}
