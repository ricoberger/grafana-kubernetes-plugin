import React from 'react';
import { EmbeddedScene, SceneFlexItem, SceneFlexLayout } from '@grafana/scenes';

import { DataSourceOptions } from '../../../types/settings';
import { PanelTimeseries } from './PanelTimeseries';

/**
 * The MetricsJobs component displays the Jobs metrics.
 */
export function MetricsJobs(props: {
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
          body: PanelTimeseries(props.settings, 'Jobs', 'short', [
            {
              refId: 'A',
              expr: `sum(kube_job_status_succeeded{job="${props.settings.integrationsMetricsKubeStateMetricsJob}", namespace="${props.namespace}", job_name=~"${props.name}"})`,
              format: 'time_series',
              legendFormat: 'Succeeded',
            },
            {
              refId: 'B',
              expr: `sum(kube_job_status_active{job="${props.settings.integrationsMetricsKubeStateMetricsJob}", namespace="${props.namespace}", job_name=~"${props.name}"})`,
              format: 'time_series',
              legendFormat: 'Active',
            },
            {
              refId: 'C',
              expr: `sum(kube_job_status_failed{job="${props.settings.integrationsMetricsKubeStateMetricsJob}", namespace="${props.namespace}", job_name=~"${props.name}"})`,
              format: 'time_series',
              legendFormat: 'Failed',
            },
          ]).build(),
        }),
      ],
    }),
  });

  return <scene.Component model={scene} />;
}
