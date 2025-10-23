import React from 'react';
import { EmbeddedScene, SceneFlexItem, SceneFlexLayout } from '@grafana/scenes';

import { DataSourceOptions } from '../../../types/settings';
import { PanelTimeseries } from './PanelTimeseries';

/**
 * The MetricsPods component displays the Pod metrics.
 */
export function MetricsPods(props: {
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
          body: PanelTimeseries(props.settings, 'CPU', 'short', [
            {
              refId: 'A',
              expr: `sum(rate(container_cpu_usage_seconds_total{job="${props.settings.integrationsMetricsKubeletJob}", namespace="${props.namespace}", pod=~"${props.name}", container != "", container != "POD"}[$__rate_interval])) by (container)`,
              format: 'time_series',
              legendFormat: 'Usage {{container}}',
            },
            {
              refId: 'B',
              expr: `sum(kube_pod_container_resource_requests{job="${props.settings.integrationsMetricsKubeStateMetricsJob}", resource="cpu", namespace="${props.namespace}", pod=~"${props.name}", container != "", container != "POD"}) by (container)`,
              format: 'time_series',
              legendFormat: 'Requests {{container}}',
            },
            {
              refId: 'C',
              expr: `sum(kube_pod_container_resource_limits{job="${props.settings.integrationsMetricsKubeStateMetricsJob}", resource="cpu", namespace="${props.namespace}", pod=~"${props.name}", container != "", container != "POD"}) by (container)`,
              format: 'time_series',
              legendFormat: 'Limits {{container}}',
            },
          ]).build(),
        }),
        new SceneFlexItem({
          height: '400px',
          body: PanelTimeseries(props.settings, 'Memory', 'bytes', [
            {
              refId: 'A',
              expr: `sum(container_memory_working_set_bytes{job="${props.settings.integrationsMetricsKubeletJob}", namespace="${props.namespace}", pod=~"${props.name}", container != "", container != "POD"}) by (container)`,
              format: 'time_series',
              legendFormat: 'Usage {{container}}',
            },
            {
              refId: 'B',
              expr: `sum(kube_pod_container_resource_requests{job="${props.settings.integrationsMetricsKubeStateMetricsJob}", resource="memory", namespace="${props.namespace}", pod=~"${props.name}", container != "", container != "POD"}) by (container)`,
              format: 'time_series',
              legendFormat: 'Requests {{container}}',
            },
            {
              refId: 'C',
              expr: `sum(kube_pod_container_resource_limits{job="${props.settings.integrationsMetricsKubeStateMetricsJob}", resource="memory", namespace="${props.namespace}", pod=~"${props.name}", container != "", container != "POD"}) by (container)`,
              format: 'time_series',
              legendFormat: 'Limits {{container}}',
            },
          ]).build(),
        }),
        new SceneFlexItem({
          height: '400px',
          body: PanelTimeseries(props.settings, 'Bandwidth', 'Bps', [
            {
              refId: 'A',
              expr: `sum(irate(container_network_receive_bytes_total{job="${props.settings.integrationsMetricsKubeletJob}", namespace="${props.namespace}", pod=~"${props.name}"}[$__rate_interval]))`,
              format: 'time_series',
              legendFormat: 'Receive',
            },
            {
              refId: 'B',
              expr: `sum(irate(container_network_transmit_bytes_total{job="${props.settings.integrationsMetricsKubeletJob}", namespace="${props.namespace}", pod=~"${props.name}"}[$__rate_interval]))`,
              format: 'time_series',
              legendFormat: 'Transmit',
            },
          ]).build(),
        }),
        new SceneFlexItem({
          height: '400px',
          body: PanelTimeseries(props.settings, 'Rate of Packets', 'pps', [
            {
              refId: 'A',
              expr: `sum(irate(container_network_receive_packets_total{job="${props.settings.integrationsMetricsKubeletJob}", namespace="${props.namespace}", pod=~"${props.name}"}[$__rate_interval]))`,
              format: 'time_series',
              legendFormat: 'Receive',
            },
            {
              refId: 'B',
              expr: `sum(irate(container_network_transmit_packets_total{job="${props.settings.integrationsMetricsKubeletJob}", namespace="${props.namespace}", pod=~"${props.name}"}[$__rate_interval]))`,
              format: 'time_series',
              legendFormat: 'Transmit',
            },
          ]).build(),
        }),
        new SceneFlexItem({
          height: '400px',
          body: PanelTimeseries(
            props.settings,
            'Rate of Packets Dropped',
            'pps',
            [
              {
                refId: 'A',
                expr: `sum(irate(container_network_receive_packets_dropped_total{job="${props.settings.integrationsMetricsKubeletJob}", namespace="${props.namespace}", pod=~"${props.name}"}[$__rate_interval]))`,
                format: 'time_series',
                legendFormat: 'Receive',
              },
              {
                refId: 'B',
                expr: `sum(irate(container_network_transmit_packets_dropped_total{job="${props.settings.integrationsMetricsKubeletJob}", namespace="${props.namespace}", pod=~"${props.name}"}[$__rate_interval]))`,
                format: 'time_series',
                legendFormat: 'Transmit',
              },
            ],
          ).build(),
        }),
        new SceneFlexItem({
          height: '400px',
          body: PanelTimeseries(props.settings, 'Storage IO - IOPS', 'short', [
            {
              refId: 'A',
              expr: `ceil(sum by(container) (rate(container_fs_reads_total{job="${props.settings.integrationsMetricsKubeletJob}", namespace="${props.namespace}", pod=~"${props.name}", container!=""}[$__rate_interval])))`,
              format: 'time_series',
              legendFormat: 'Reads {{container}}',
            },
            {
              refId: 'B',
              expr: `ceil(sum by(container) (rate(container_fs_writes_total{job="${props.settings.integrationsMetricsKubeletJob}", namespace="${props.namespace}", pod=~"${props.name}", container!=""}[$__rate_interval])))`,
              format: 'time_series',
              legendFormat: 'Writes {{container}}',
            },
          ]).build(),
        }),
        new SceneFlexItem({
          height: '400px',
          body: PanelTimeseries(
            props.settings,
            'Storage IO - ThroughPut',
            'Bps',
            [
              {
                refId: 'A',
                expr: `sum by(container) (rate(container_fs_reads_bytes_total{job="${props.settings.integrationsMetricsKubeletJob}", namespace="${props.namespace}", pod=~"${props.name}", container!=""}[$__rate_interval]))`,
                format: 'time_series',
                legendFormat: 'Reads {{container}}',
              },
              {
                refId: 'B',
                expr: `sum by(container) (rate(container_fs_writes_bytes_total{job="${props.settings.integrationsMetricsKubeletJob}", namespace="${props.namespace}", pod=~"${props.name}", container!=""}[$__rate_interval]))`,
                format: 'time_series',
                legendFormat: 'Writes {{container}}',
              },
            ],
          ).build(),
        }),
      ],
    }),
  });

  return <scene.Component model={scene} />;
}
