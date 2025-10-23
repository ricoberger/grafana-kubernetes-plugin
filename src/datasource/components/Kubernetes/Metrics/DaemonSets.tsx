import React from 'react';
import { EmbeddedScene, SceneFlexItem, SceneFlexLayout } from '@grafana/scenes';

import { DataSourceOptions } from '../../../types/settings';
import { PanelTimeseries } from './PanelTimeseries';

/**
 * The MetricsDaemonSets component displays the DaemonSet metrics.
 */
export function MetricsDaemonSets(props: {
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
              expr: `sum(kube_daemonset_status_number_ready{job="${props.settings.integrationsMetricsKubeStateMetricsJob}", namespace="${props.namespace}", daemonset=~"${props.name}"})`,
              format: 'time_series',
              legendFormat: 'Ready',
            },
            {
              refId: 'B',
              expr: `sum(kube_daemonset_status_number_available{job="${props.settings.integrationsMetricsKubeStateMetricsJob}", namespace="${props.namespace}", daemonset=~"${props.name}"})`,
              format: 'time_series',
              legendFormat: 'Available',
            },
            {
              refId: 'C',
              expr: `sum(kube_daemonset_status_number_unavailable{job="${props.settings.integrationsMetricsKubeStateMetricsJob}", namespace="${props.namespace}", daemonset=~"${props.name}"})`,
              format: 'time_series',
              legendFormat: 'Unavailable',
            },
          ]).build(),
        }),
        new SceneFlexItem({
          height: '400px',
          body: PanelTimeseries(props.settings, 'Pods Scheduled', 'short', [
            {
              refId: 'A',
              expr: `sum(kube_daemonset_status_current_number_scheduled{job="${props.settings.integrationsMetricsKubeStateMetricsJob}", namespace="${props.namespace}", daemonset=~"${props.name}"})`,
              format: 'time_series',
              legendFormat: 'Current',
            },
            {
              refId: 'B',
              expr: `sum(kube_daemonset_status_desired_number_scheduled{job="${props.settings.integrationsMetricsKubeStateMetricsJob}", namespace="${props.namespace}", daemonset=~"${props.name}"})`,
              format: 'time_series',
              legendFormat: 'Desired',
            },
            {
              refId: 'C',
              expr: `sum(kube_daemonset_status_number_misscheduled{job="${props.settings.integrationsMetricsKubeStateMetricsJob}", namespace="${props.namespace}", daemonset=~"${props.name}"})`,
              format: 'time_series',
              legendFormat: 'Misscheduled',
            },
            {
              refId: 'D',
              expr: `sum(kube_daemonset_status_updated_number_scheduled{job="${props.settings.integrationsMetricsKubeStateMetricsJob}", namespace="${props.namespace}", daemonset=~"${props.name}"})`,
              format: 'time_series',
              legendFormat: 'Updated',
            },
          ]).build(),
        }),
      ],
    }),
  });

  return <scene.Component model={scene} />;
}
