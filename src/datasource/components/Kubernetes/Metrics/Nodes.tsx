import React from 'react';
import { EmbeddedScene, SceneFlexItem, SceneFlexLayout } from '@grafana/scenes';
import { GraphDrawStyle, StackingMode } from '@grafana/schema';

import { DataSourceOptions } from '../../../types/settings';
import { PanelTimeseries } from './PanelTimeseries';
import { PanelGauge } from './PanelGauge';

/**
 * The MetricsNodes component displays the Nodes metrics.
 */
export function MetricsNodes(props: {
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
              expr: `sum(rate(container_cpu_usage_seconds_total{job="${props.settings.integrationsMetricsKubeletJob}", node=~"${props.name}", container != "", container != "POD"}[$__rate_interval]))`,
              format: 'time_series',
              legendFormat: 'Usage',
            },
            {
              refId: 'B',
              expr: `sum(kube_pod_container_resource_requests{job="${props.settings.integrationsMetricsKubeStateMetricsJob}", resource="cpu", node=~"${props.name}", container != "", container != "POD"})`,
              format: 'time_series',
              legendFormat: 'Requests',
            },
            {
              refId: 'C',
              expr: `sum(kube_pod_container_resource_limits{job="${props.settings.integrationsMetricsKubeStateMetricsJob}", resource="cpu", node=~"${props.name}", container != "", container != "POD"})`,
              format: 'time_series',
              legendFormat: 'Limits',
            },
            {
              refId: 'D',
              expr: `sum(kube_node_status_capacity{job="${props.settings.integrationsMetricsKubeStateMetricsJob}", resource="cpu", node=~"${props.name}"})`,
              format: 'time_series',
              legendFormat: 'Capacity',
            },
            {
              refId: 'E',
              expr: `sum(kube_node_status_allocatable{job="${props.settings.integrationsMetricsKubeStateMetricsJob}", resource="cpu", node=~"${props.name}"})`,
              format: 'time_series',
              legendFormat: 'Allocatable',
            },
          ]).build(),
        }),
        new SceneFlexItem({
          height: '400px',
          body: PanelTimeseries(props.settings, 'Memory', 'bytes', [
            {
              refId: 'A',
              expr: `sum(container_memory_working_set_bytes{job="${props.settings.integrationsMetricsKubeletJob}", node=~"${props.name}", container != "", container != "POD"})`,
              format: 'time_series',
              legendFormat: 'Usage',
            },
            {
              refId: 'B',
              expr: `sum(kube_pod_container_resource_requests{job="${props.settings.integrationsMetricsKubeStateMetricsJob}", resource="memory", node=~"${props.name}", container != "", container != "POD"})`,
              format: 'time_series',
              legendFormat: 'Requests',
            },
            {
              refId: 'C',
              expr: `sum(kube_pod_container_resource_limits{job="${props.settings.integrationsMetricsKubeStateMetricsJob}", resource="memory", node=~"${props.name}", container != "", container != "POD"})`,
              format: 'time_series',
              legendFormat: 'Limits',
            },
            {
              refId: 'D',
              expr: `sum(kube_node_status_capacity{job="${props.settings.integrationsMetricsKubeStateMetricsJob}", resource="memory", node=~"${props.name}"})`,
              format: 'time_series',
              legendFormat: 'Capacity',
            },
            {
              refId: 'E',
              expr: `sum(kube_node_status_allocatable{job="${props.settings.integrationsMetricsKubeStateMetricsJob}", resource="memory", node=~"${props.name}"})`,
              format: 'time_series',
              legendFormat: 'Allocatable',
            },
          ]).build(),
        }),
        new SceneFlexItem({
          height: '400px',
          body: PanelTimeseries(props.settings, 'Pods', 'short', [
            {
              refId: 'A',
              expr: `count(kube_pod_info{job="${props.settings.integrationsMetricsKubeStateMetricsJob}", node=~"${props.name}"})`,
              format: 'time_series',
              legendFormat: 'Usage',
            },
            {
              refId: 'D',
              expr: `sum(kube_node_status_capacity{job="${props.settings.integrationsMetricsKubeStateMetricsJob}", resource="pods", node=~"${props.name}"})`,
              format: 'time_series',
              legendFormat: 'Capacity',
            },
            {
              refId: 'E',
              expr: `sum(kube_node_status_allocatable{job="${props.settings.integrationsMetricsKubeStateMetricsJob}", resource="pods", node=~"${props.name}"})`,
              format: 'time_series',
              legendFormat: 'Allocatable',
            },
          ]).build(),
        }),
        new SceneFlexItem({
          body: new SceneFlexLayout({
            direction: 'row',
            children: [
              new SceneFlexItem({
                height: '200px',
                body: PanelGauge(
                  props.settings,
                  'CPU Busy',
                  [0, 85, 95],
                  [
                    {
                      refId: 'A',
                      expr: `(((count(count(node_cpu_seconds_total{job=~"${props.settings.integrationsMetricsNodeExporterJob}", instance=~"${props.name}"}) by (cpu))) - avg(sum by (mode)(irate(node_cpu_seconds_total{mode='idle',job=~"${props.settings.integrationsMetricsNodeExporterJob}", instance=~"${props.name}"}[5m])))) * 100) / count(count(node_cpu_seconds_total{job=~"${props.settings.integrationsMetricsNodeExporterJob}", instance=~"${props.name}"}) by (cpu))`,
                      format: 'time_series',
                    },
                  ],
                ).build(),
              }),
              new SceneFlexItem({
                height: '200px',
                body: PanelGauge(
                  props.settings,
                  'Sys Load (5m avg)',
                  [0, 85, 95],
                  [
                    {
                      refId: 'A',
                      expr: `avg(node_load5{job=~"${props.settings.integrationsMetricsNodeExporterJob}", instance=~"${props.name}"}) /  count(count(node_cpu_seconds_total{job=~"${props.settings.integrationsMetricsNodeExporterJob}", instance=~"${props.name}"}) by (cpu)) * 100`,
                      format: 'time_series',
                    },
                  ],
                ).build(),
              }),
              new SceneFlexItem({
                height: '200px',
                body: PanelGauge(
                  props.settings,
                  'Sys Load (15m avg)',
                  [0, 85, 95],
                  [
                    {
                      refId: 'A',
                      expr: `avg(node_load15{job=~"${props.settings.integrationsMetricsNodeExporterJob}", instance=~"${props.name}"}) /  count(count(node_cpu_seconds_total{job=~"${props.settings.integrationsMetricsNodeExporterJob}", instance=~"${props.name}"}) by (cpu)) * 100`,
                      format: 'time_series',
                    },
                  ],
                ).build(),
              }),
            ],
          }),
        }),
        new SceneFlexItem({
          body: new SceneFlexLayout({
            direction: 'row',
            children: [
              new SceneFlexItem({
                height: '200px',
                body: PanelGauge(
                  props.settings,
                  'RAM Used',
                  [0, 80, 90],
                  [
                    {
                      refId: 'A',
                      expr: `100 - ((node_memory_MemAvailable_bytes{job=~"${props.settings.integrationsMetricsNodeExporterJob}", instance=~"${props.name}"} * 100) / node_memory_MemTotal_bytes{job=~"${props.settings.integrationsMetricsNodeExporterJob}", instance=~"${props.name}"})`,
                      format: 'time_series',
                    },
                  ],
                ).build(),
              }),
              new SceneFlexItem({
                height: '200px',
                body: PanelGauge(
                  props.settings,
                  'SWAP Used',
                  [0, 10, 25],
                  [
                    {
                      refId: 'A',
                      expr: `((node_memory_SwapTotal_bytes{job=~"${props.settings.integrationsMetricsNodeExporterJob}", instance=~"${props.name}"} - node_memory_SwapFree_bytes{job=~"${props.settings.integrationsMetricsNodeExporterJob}", instance=~"${props.name}"}) / (node_memory_SwapTotal_bytes{job=~"${props.settings.integrationsMetricsNodeExporterJob}", instance=~"${props.name}"} )) * 100`,
                      format: 'time_series',
                    },
                  ],
                ).build(),
              }),
              new SceneFlexItem({
                height: '200px',
                body: PanelGauge(
                  props.settings,
                  'Root FS Used',
                  [0, 80, 90],
                  [
                    {
                      refId: 'A',
                      expr: `100 - ((node_filesystem_avail_bytes{job=~"${props.settings.integrationsMetricsNodeExporterJob}", instance=~"${props.name}",mountpoint="/",fstype!="rootfs"} * 100) / node_filesystem_size_bytes{job=~"${props.settings.integrationsMetricsNodeExporterJob}", instance=~"${props.name}",mountpoint="/",fstype!="rootfs"})`,
                      format: 'time_series',
                    },
                  ],
                ).build(),
              }),
            ],
          }),
        }),
        new SceneFlexItem({
          height: '400px',
          body: PanelTimeseries(props.settings, 'CPU Basic', 'short', [
            {
              refId: 'B',
              expr: `sum by (instance) (irate(node_cpu_seconds_total{job=~"${props.settings.integrationsMetricsNodeExporterJob}", instance=~"${props.name}", mode="system"}[5m])) * 100`,
              format: 'time_series',
              legendFormat: 'Busy System',
            },
            {
              refId: 'D',
              expr: `sum by (instance) (irate(node_cpu_seconds_total{job=~"${props.settings.integrationsMetricsNodeExporterJob}", instance=~"${props.name}", mode="user"}[5m])) * 100`,
              format: 'time_series',
              legendFormat: 'Busy User',
            },
            {
              refId: 'C',
              expr: `sum by (instance) (irate(node_cpu_seconds_total{job=~"${props.settings.integrationsMetricsNodeExporterJob}", instance=~"${props.name}", mode="iowait"}[5m])) * 100`,
              format: 'time_series',
              legendFormat: 'Busy iowait',
            },
            {
              refId: 'E',
              expr: `sum by (instance) (irate(node_cpu_seconds_total{job=~"${props.settings.integrationsMetricsNodeExporterJob}", instance=~"${props.name}", mode=~".*irq"}[5m])) * 100`,
              format: 'time_series',
              legendFormat: 'Busy IRQs',
            },
            {
              refId: 'F',
              expr: `sum by (instance) (irate(node_cpu_seconds_total{job=~"${props.settings.integrationsMetricsNodeExporterJob}", instance=~"${props.name}", mode!="idle", mode!="user", mode!="system", mode!="iowait", mode!="irq", mode!="softirq"}[5m])) * 100`,
              format: 'time_series',
              legendFormat: 'Busy Other',
            },
            {
              refId: 'A',
              expr: `sum by (instance) (irate(node_cpu_seconds_total{job=~"${props.settings.integrationsMetricsNodeExporterJob}", instance=~"${props.name}", mode="idle"}[5m])) * 100`,
              format: 'time_series',
              legendFormat: 'Idle',
            },
          ])
            .setCustomFieldConfig('fillOpacity', 10)
            .setCustomFieldConfig('drawStyle', GraphDrawStyle.Line)
            .setCustomFieldConfig('stacking', {
              mode: StackingMode.Percent,
              group: 'A',
            })
            .build(),
        }),
        new SceneFlexItem({
          height: '400px',
          body: PanelTimeseries(props.settings, 'Memory Basic', 'bytes', [
            {
              refId: 'C',
              expr: `node_memory_MemTotal_bytes{job=~"${props.settings.integrationsMetricsNodeExporterJob}", instance=~"${props.name}"}`,
              format: 'time_series',
              legendFormat: 'RAM Total',
            },
            {
              refId: 'B',
              expr: `node_memory_MemTotal_bytes{job=~"${props.settings.integrationsMetricsNodeExporterJob}", instance=~"${props.name}"} - node_memory_MemFree_bytes{job=~"${props.settings.integrationsMetricsNodeExporterJob}", instance=~"${props.name}"} - (node_memory_Cached_bytes{job=~"${props.settings.integrationsMetricsNodeExporterJob}", instance=~"${props.name}"} + node_memory_Buffers_bytes{job=~"${props.settings.integrationsMetricsNodeExporterJob}", instance=~"${props.name}"})`,
              format: 'time_series',
              legendFormat: 'RAM Used',
            },
            {
              refId: 'D',
              expr: `node_memory_Cached_bytes{job=~"${props.settings.integrationsMetricsNodeExporterJob}", instance=~"${props.name}"} + node_memory_Buffers_bytes{job=~"${props.settings.integrationsMetricsNodeExporterJob}", instance=~"${props.name}"}`,
              format: 'time_series',
              legendFormat: 'RAM Cache + Buffer',
            },
            {
              refId: 'A',
              expr: `node_memory_MemFree_bytes{job=~"${props.settings.integrationsMetricsNodeExporterJob}", instance=~"${props.name}"}`,
              format: 'time_series',
              legendFormat: 'RAM Free',
            },
            {
              refId: 'E',
              expr: `(node_memory_SwapTotal_bytes{job=~"${props.settings.integrationsMetricsNodeExporterJob}", instance=~"${props.name}"} - node_memory_SwapFree_bytes{job=~"${props.settings.integrationsMetricsNodeExporterJob}", instance=~"${props.name}"})`,
              format: 'time_series',
              legendFormat: 'SWAP Used',
            },
          ])
            .setCustomFieldConfig('fillOpacity', 10)
            .setCustomFieldConfig('drawStyle', GraphDrawStyle.Line)
            .setCustomFieldConfig('stacking', {
              mode: StackingMode.Normal,
              group: 'A',
            })
            .setOverrides((b) =>
              b.matchFieldsByQuery('C').overrideCustomFieldConfig('stacking', {
                mode: StackingMode.None,
              }),
            )
            .build(),
        }),
        new SceneFlexItem({
          height: '400px',
          body: PanelTimeseries(
            props.settings,
            'Network Traffic Basic',
            'bytes',
            [
              {
                refId: 'G',
                expr: `irate(node_network_receive_bytes_total{job=~"${props.settings.integrationsMetricsNodeExporterJob}", instance=~"${props.name}"}[5m])*8`,
                format: 'time_series',
                legendFormat: 'recv {{device}}',
              },
              {
                refId: 'H',
                expr: `-irate(node_network_transmit_bytes_total{job=~"${props.settings.integrationsMetricsNodeExporterJob}", instance=~"${props.name}"}[5m])*8`,
                format: 'time_series',
                legendFormat: 'trans {{device}}',
              },
            ],
          )
            .setMin(null)
            .setCustomFieldConfig('fillOpacity', 10)
            .setCustomFieldConfig('drawStyle', GraphDrawStyle.Line)
            .build(),
        }),
        new SceneFlexItem({
          height: '400px',
          body: PanelTimeseries(
            props.settings,
            'Disk Space Used Basic',
            'percent',
            [
              {
                refId: 'G',
                expr: `100 - ((node_filesystem_avail_bytes{job=~"${props.settings.integrationsMetricsNodeExporterJob}", instance=~"${props.name}",device!~'rootfs'} * 100) / node_filesystem_size_bytes{job=~"${props.settings.integrationsMetricsNodeExporterJob}", instance=~"${props.name}",device!~'rootfs'})`,
                format: 'time_series',
                legendFormat: '{{mountpoint}}',
              },
            ],
          )
            .setMin(0)
            .setMax(100)
            .setCustomFieldConfig('fillOpacity', 10)
            .setCustomFieldConfig('drawStyle', GraphDrawStyle.Line)
            .build(),
        }),
      ],
    }),
  });

  return <scene.Component model={scene} />;
}
