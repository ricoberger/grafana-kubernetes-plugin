import React from 'react';
import { EmbeddedScene, SceneFlexItem, SceneFlexLayout } from '@grafana/scenes';

import { DataSourceOptions } from '../../../types/settings';
import { PanelTimeseries } from './PanelTimeseries';

interface Props {
  settings: DataSourceOptions;
  namespace?: string;
  name?: string;
}

export function MetricsPersistentVolumeClaims({
  settings,
  namespace,
  name,
}: Props) {
  const scene = new EmbeddedScene({
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          height: '400px',
          body: PanelTimeseries(settings, 'Data', 'bytes', [
            {
              refId: 'A',
              expr: `sum(kubelet_volume_stats_used_bytes{job="${settings.integrationsMetricsKubeletJob}", namespace="${namespace}", persistentvolumeclaim=~"${name}"})`,
              format: 'time_series',
              legendFormat: 'Used',
            },
            {
              refId: 'B',
              expr: `sum(kubelet_volume_stats_capacity_bytes{job="${settings.integrationsMetricsKubeletJob}", namespace="${namespace}", persistentvolumeclaim=~"${name}"})`,
              format: 'time_series',
              legendFormat: 'Capacity',
            },
          ]).build(),
        }),
        new SceneFlexItem({
          height: '400px',
          body: PanelTimeseries(settings, 'Inodes', 'short', [
            {
              refId: 'A',
              expr: `sum(kubelet_volume_stats_inodes_used{job="${settings.integrationsMetricsKubeletJob}", namespace="${namespace}", persistentvolumeclaim=~"${name}"})`,
              format: 'time_series',
              legendFormat: 'Used',
            },
            {
              refId: 'B',
              expr: `sum(kubelet_volume_stats_inodes{job="${settings.integrationsMetricsKubeletJob}", namespace="${namespace}", persistentvolumeclaim=~"${name}"})`,
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
