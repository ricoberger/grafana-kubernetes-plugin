import React from 'react';
import { EmbeddedScene, SceneFlexItem, SceneFlexLayout } from '@grafana/scenes';

import { DataSourceOptions } from '../../../types/settings';
import { PanelTimeseries } from './PanelTimeseries';

interface Props {
  settings: DataSourceOptions;
  namespace?: string;
  name?: string;
}

export function MetricsJobs({ settings, namespace, name }: Props) {
  const scene = new EmbeddedScene({
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          height: '400px',
          body: PanelTimeseries(settings, 'Jobs', 'short', [
            {
              refId: 'A',
              expr: `sum(kube_job_status_succeeded{job="${settings.integrationsMetricsKubeStateMetricsJob}", namespace="${namespace}", job_name=~"${name}"})`,
              format: 'time_series',
              legendFormat: 'Succeeded',
            },
            {
              refId: 'B',
              expr: `sum(kube_job_status_active{job="${settings.integrationsMetricsKubeStateMetricsJob}", namespace="${namespace}", job_name=~"${name}"})`,
              format: 'time_series',
              legendFormat: 'Active',
            },
            {
              refId: 'C',
              expr: `sum(kube_job_status_failed{job="${settings.integrationsMetricsKubeStateMetricsJob}", namespace="${namespace}", job_name=~"${name}"})`,
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
