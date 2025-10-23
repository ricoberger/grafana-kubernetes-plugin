import React from 'react';
import { EmbeddedScene, SceneFlexItem, SceneFlexLayout } from '@grafana/scenes';

import { DataSourceOptions } from '../../../types/settings';
import { PanelTimeseries } from './PanelTimeseries';

/**
 * The MetricsVPAs component displays the VerticalPodAutoscalers metrics.
 */
export function MetricsVPAs(props: {
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
          body: PanelTimeseries(
            props.settings,
            'CPU Recommendations',
            'short',
            [
              {
                refId: 'A',
                expr: `sum by (container) (kube_verticalpodautoscaler_status_recommendation_containerrecommendations_target{job="${props.settings.integrationsMetricsKubeStateMetricsJob}", resource="cpu", namespace="${props.namespace}", verticalpodautoscaler=~"${props.name}"})`,
                format: 'time_series',
                legendFormat: 'Target {{container}}',
              },
              {
                refId: 'B',
                expr: `sum by (container) (kube_verticalpodautoscaler_status_recommendation_containerrecommendations_upperbound{job="${props.settings.integrationsMetricsKubeStateMetricsJob}", resource="cpu", namespace="${props.namespace}", verticalpodautoscaler=~"${props.name}"})`,
                format: 'time_series',
                legendFormat: 'Upper bound {{container}}',
              },
              {
                refId: 'C',
                expr: `sum by (container) (kube_verticalpodautoscaler_status_recommendation_containerrecommendations_lowerbound{job="${props.settings.integrationsMetricsKubeStateMetricsJob}", resource="cpu", namespace="${props.namespace}", verticalpodautoscaler=~"${props.name}"})`,
                format: 'time_series',
                legendFormat: 'Lower bound {{container}}',
              },
            ],
          ).build(),
        }),
        new SceneFlexItem({
          height: '400px',
          body: PanelTimeseries(
            props.settings,
            'Memory Recommendations',
            'bytes',
            [
              {
                refId: 'A',
                expr: `sum by (container) (kube_verticalpodautoscaler_status_recommendation_containerrecommendations_target{job="${props.settings.integrationsMetricsKubeStateMetricsJob}", resource="memory", namespace="${props.namespace}", verticalpodautoscaler=~"${props.name}"})`,
                format: 'time_series',
                legendFormat: 'Target {{container}}',
              },
              {
                refId: 'B',
                expr: `sum by (container) (kube_verticalpodautoscaler_status_recommendation_containerrecommendations_upperbound{job="${props.settings.integrationsMetricsKubeStateMetricsJob}", resource="memory", namespace="${props.namespace}", verticalpodautoscaler=~"${props.name}"})`,
                format: 'time_series',
                legendFormat: 'Upper bound {{container}}',
              },
              {
                refId: 'C',
                expr: `sum by (container) (kube_verticalpodautoscaler_status_recommendation_containerrecommendations_lowerbound{job="${props.settings.integrationsMetricsKubeStateMetricsJob}", resource="memory", namespace="${props.namespace}", verticalpodautoscaler=~"${props.name}"})`,
                format: 'time_series',
                legendFormat: 'Lower bound {{container}}',
              },
            ],
          ).build(),
        }),
      ],
    }),
  });

  return <scene.Component model={scene} />;
}
