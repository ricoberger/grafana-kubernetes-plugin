import React from 'react';
import { EmbeddedScene, SceneFlexItem, SceneFlexLayout } from '@grafana/scenes';

import { DataSourceOptions } from '../../../types/settings';
import { PanelTimeseries } from './PanelTimeseries';

interface Props {
  settings: DataSourceOptions;
  namespace?: string;
  name?: string;
}

export function MetricsHPAs({ settings, namespace, name }: Props) {
  const scene = new EmbeddedScene({
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          height: '400px',
          body: PanelTimeseries(settings, 'Replicas', 'short', [
            {
              refId: 'A',
              expr: `sum(kube_horizontalpodautoscaler_status_current_replicas{job="${settings.integrationsMetricsKubeStateMetricsJob}", namespace="${namespace}", horizontalpodautoscaler=~"${name}"})`,
              format: 'time_series',
              legendFormat: 'Current',
            },
            {
              refId: 'B',
              expr: `sum(kube_horizontalpodautoscaler_status_desired_replicas{job="${settings.integrationsMetricsKubeStateMetricsJob}", namespace="${namespace}", horizontalpodautoscaler=~"${name}"})`,
              format: 'time_series',
              legendFormat: 'Desired',
            },
            {
              refId: 'C',
              expr: `sum(kube_horizontalpodautoscaler_spec_max_replicas{job="${settings.integrationsMetricsKubeStateMetricsJob}", namespace="${namespace}", horizontalpodautoscaler=~"${name}"})`,
              format: 'time_series',
              legendFormat: 'Max',
            },
            {
              refId: 'D',
              expr: `sum(kube_horizontalpodautoscaler_spec_min_replicas{job="${settings.integrationsMetricsKubeStateMetricsJob}", namespace="${namespace}", horizontalpodautoscaler=~"${name}"})`,
              format: 'time_series',
              legendFormat: 'Min',
            },
          ]).build(),
        }),
        new SceneFlexItem({
          height: '400px',
          body: PanelTimeseries(settings, 'Metrics', 'short', [
            {
              refId: 'A',
              expr: `sum by (metric_name) (kube_horizontalpodautoscaler_status_target_metric{job="${settings.integrationsMetricsKubeStateMetricsJob}", namespace="${namespace}", horizontalpodautoscaler=~"${name}"})`,
              format: 'time_series',
              legendFormat: 'Status {{metric_name}}',
            },
            {
              refId: 'B',
              expr: `sum by (metric_name) (kube_horizontalpodautoscaler_spec_target_metric{job="${settings.integrationsMetricsKubeStateMetricsJob}", namespace="${namespace}", horizontalpodautoscaler=~"${name}"})`,
              format: 'time_series',
              legendFormat: 'Spec {{metric_name}}',
            },
          ]).build(),
        }),
      ],
    }),
  });

  return <scene.Component model={scene} />;
}
