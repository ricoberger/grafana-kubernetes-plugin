import React from 'react';
import { EmbeddedScene, SceneFlexItem, SceneFlexLayout } from '@grafana/scenes';

import { DataSourceOptions } from '../../../types/settings';
import { PanelTimeseries } from './PanelTimeseries';

interface Props {
  settings: DataSourceOptions;
  namespace?: string;
  name?: string;
}

export function MetricsVPAs({ settings, namespace, name }: Props) {
  const scene = new EmbeddedScene({
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          height: '400px',
          body: PanelTimeseries(settings, 'CPU Recommendations', 'short', [
            {
              refId: 'A',
              expr: `sum by (container) (kube_verticalpodautoscaler_status_recommendation_containerrecommendations_target{job="${settings.integrationsMetricsKubeStateMetricsJob}", resource="cpu", namespace="${namespace}", verticalpodautoscaler=~"${name}"})`,
              format: 'time_series',
              legendFormat: 'Target {{container}}',
            },
            {
              refId: 'B',
              expr: `sum by (container) (kube_verticalpodautoscaler_status_recommendation_containerrecommendations_upperbound{job="${settings.integrationsMetricsKubeStateMetricsJob}", resource="cpu", namespace="${namespace}", verticalpodautoscaler=~"${name}"})`,
              format: 'time_series',
              legendFormat: 'Upper bound {{container}}',
            },
            {
              refId: 'C',
              expr: `sum by (container) (kube_verticalpodautoscaler_status_recommendation_containerrecommendations_lowerbound{job="${settings.integrationsMetricsKubeStateMetricsJob}", resource="cpu", namespace="${namespace}", verticalpodautoscaler=~"${name}"})`,
              format: 'time_series',
              legendFormat: 'Lower bound {{container}}',
            },
          ]).build(),
        }),
        new SceneFlexItem({
          height: '400px',
          body: PanelTimeseries(settings, 'Memory Recommendations', 'bytes', [
            {
              refId: 'A',
              expr: `sum by (container) (kube_verticalpodautoscaler_status_recommendation_containerrecommendations_target{job="${settings.integrationsMetricsKubeStateMetricsJob}", resource="memory", namespace="${namespace}", verticalpodautoscaler=~"${name}"})`,
              format: 'time_series',
              legendFormat: 'Target {{container}}',
            },
            {
              refId: 'B',
              expr: `sum by (container) (kube_verticalpodautoscaler_status_recommendation_containerrecommendations_upperbound{job="${settings.integrationsMetricsKubeStateMetricsJob}", resource="memory", namespace="${namespace}", verticalpodautoscaler=~"${name}"})`,
              format: 'time_series',
              legendFormat: 'Upper bound {{container}}',
            },
            {
              refId: 'C',
              expr: `sum by (container) (kube_verticalpodautoscaler_status_recommendation_containerrecommendations_lowerbound{job="${settings.integrationsMetricsKubeStateMetricsJob}", resource="memory", namespace="${namespace}", verticalpodautoscaler=~"${name}"})`,
              format: 'time_series',
              legendFormat: 'Lower bound {{container}}',
            },
          ]).build(),
        }),
      ],
    }),
  });

  return <scene.Component model={scene} />;
}
