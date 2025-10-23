import React from 'react';
import { EmbeddedScene, SceneFlexItem, SceneFlexLayout } from '@grafana/scenes';

import { DataSourceOptions } from '../../../types/settings';
import { PanelTimeseries } from './PanelTimeseries';

/**
 * The MetricsDeployments component displays the Deployments metrics.
 */
export function MetricsDeployments(props: {
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
          body: PanelTimeseries(props.settings, 'Pods', 'short', [
            {
              refId: 'A',
              expr: `sum(kube_deployment_status_replicas_ready{job="${props.settings.integrationsMetricsKubeStateMetricsJob}", namespace="${props.namespace}", deployment=~"${props.name}"})`,
              format: 'time_series',
              legendFormat: 'Ready',
            },
            {
              refId: 'B',
              expr: `sum(kube_deployment_status_replicas_available{job="${props.settings.integrationsMetricsKubeStateMetricsJob}", namespace="${props.namespace}", deployment=~"${props.name}"})`,
              format: 'time_series',
              legendFormat: 'Available',
            },
            {
              refId: 'C',
              expr: `sum(kube_deployment_status_replicas_unavailable{job="${props.settings.integrationsMetricsKubeStateMetricsJob}", namespace="${props.namespace}", deployment=~"${props.name}"})`,
              format: 'time_series',
              legendFormat: 'Unavailable',
            },
            {
              refId: 'D',
              expr: `sum(kube_deployment_status_replicas_updated{job="${props.settings.integrationsMetricsKubeStateMetricsJob}", namespace="${props.namespace}", deployment=~"${props.name}"})`,
              format: 'time_series',
              legendFormat: 'Updated',
            },
            {
              refId: 'E',
              expr: `sum(kube_deployment_status_replicas{job="${props.settings.integrationsMetricsKubeStateMetricsJob}", namespace="${props.namespace}", deployment=~"${props.name}"})`,
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
