import React from 'react';
import { EmbeddedScene, SceneFlexItem, SceneFlexLayout } from '@grafana/scenes';

import { DataSourceOptions } from '../../../types/settings';
import { PanelTimeseries } from './PanelTimeseries';

interface Props {
  settings: DataSourceOptions;
  namespace?: string;
  name?: string;
}

export function MetricsDeployments({ settings, namespace, name }: Props) {
  const scene = new EmbeddedScene({
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          height: '400px',
          body: PanelTimeseries(settings, 'Pods', 'short', [
            {
              refId: 'A',
              expr: `sum(kube_deployment_status_replicas_ready{job="${settings.integrationsMetricsKubeStateMetricsJob}", namespace="${namespace}", deployment=~"${name}"})`,
              format: 'time_series',
              legendFormat: 'Ready',
            },
            {
              refId: 'B',
              expr: `sum(kube_deployment_status_replicas_available{job="${settings.integrationsMetricsKubeStateMetricsJob}", namespace="${namespace}", deployment=~"${name}"})`,
              format: 'time_series',
              legendFormat: 'Available',
            },
            {
              refId: 'C',
              expr: `sum(kube_deployment_status_replicas_unavailable{job="${settings.integrationsMetricsKubeStateMetricsJob}", namespace="${namespace}", deployment=~"${name}"})`,
              format: 'time_series',
              legendFormat: 'Unavailable',
            },
            {
              refId: 'D',
              expr: `sum(kube_deployment_status_replicas_updated{job="${settings.integrationsMetricsKubeStateMetricsJob}", namespace="${namespace}", deployment=~"${name}"})`,
              format: 'time_series',
              legendFormat: 'Updated',
            },
            {
              refId: 'E',
              expr: `sum(kube_deployment_status_replicas{job="${settings.integrationsMetricsKubeStateMetricsJob}", namespace="${namespace}", deployment=~"${name}"})`,
              format: 'time_series',
              legendFormat: 'Replicas',
            },
          ]).build(),
        }),
      ],
    }),
  });

  return <scene.Component model={scene} />;
}
