import React from 'react';
import { EmbeddedScene, SceneFlexItem, SceneFlexLayout } from '@grafana/scenes';

import { DataSourceOptions } from '../../../types/settings';
import { PanelTimeseries } from './PanelTimeseries';

/**
 * The MetricsPersistentVolumeClaims component displays the
 * PersistentVolumeClaim metrics.
 */
export function MetricsPersistentVolumeClaims(props: {
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
          body: PanelTimeseries(props.settings, 'Data', 'bytes', [
            {
              refId: 'A',
              expr: `sum(kubelet_volume_stats_used_bytes{job="${props.settings.integrationsMetricsKubeletJob}", namespace="${props.namespace}", persistentvolumeclaim=~"${props.name}"})`,
              format: 'time_series',
              legendFormat: 'Used',
            },
            {
              refId: 'B',
              expr: `sum(kubelet_volume_stats_capacity_bytes{job="${props.settings.integrationsMetricsKubeletJob}", namespace="${props.namespace}", persistentvolumeclaim=~"${props.name}"})`,
              format: 'time_series',
              legendFormat: 'Capacity',
            },
          ]).build(),
        }),
        new SceneFlexItem({
          height: '400px',
          body: PanelTimeseries(props.settings, 'Inodes', 'short', [
            {
              refId: 'A',
              expr: `sum(kubelet_volume_stats_inodes_used{job="${props.settings.integrationsMetricsKubeletJob}", namespace="${props.namespace}", persistentvolumeclaim=~"${props.name}"})`,
              format: 'time_series',
              legendFormat: 'Used',
            },
            {
              refId: 'B',
              expr: `sum(kubelet_volume_stats_inodes{job="${props.settings.integrationsMetricsKubeletJob}", namespace="${props.namespace}", persistentvolumeclaim=~"${props.name}"})`,
              format: 'time_series',
              legendFormat: 'Total',
            },
          ]).build(),
        }),
      ],
    }),
  });

  return <scene.Component model={scene} />;
}
