import React from 'react';
import { EmbeddedScene, SceneFlexItem, SceneFlexLayout } from '@grafana/scenes';

import { DataSourceOptions } from '../../../types/settings';
import { PanelTimeseries } from './PanelTimeseries';

/**
 * The MetricsCronJobs component displays the CronJobs metrics.
 */
export function MetricsCronJobs(props: {
  settings: DataSourceOptions;
  namespace?: string;
  name?: string;
}) {
  const scene = new EmbeddedScene({
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          height: '400px',
          body: PanelTimeseries(props.settings, 'CronJobs', 'short', [
            {
              refId: 'B',
              expr: `sum(kube_cronjob_status_active{job="${props.settings.integrationsMetricsKubeStateMetricsJob}", namespace="${props.namespace}", cronjob=~"${props.name}"})`,
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
