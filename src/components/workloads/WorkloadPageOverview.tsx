import { VizConfigBuilders } from '@grafana/scenes';
import {
  DataLayerControl,
  useQueryRunner,
  VariableControl,
  VizPanel,
} from '@grafana/scenes-react';
import { RadioButtonGroup, Stack, useStyles2 } from '@grafana/ui';
import React, { useState } from 'react';

import datasourcePluginJson from '../../datasource/plugin.json';
import { useVizPanelMenu } from '../../hooks/useVizPanelMenu';
import { queries } from '../../utils/utils.queries';
import { getStyles } from '../../utils/utils.styles';
import { LegendResourceUsage } from '../shared/LegendResourceUsage';
import { RowCosts } from '../shared/RowCosts';
import { TableCosts } from '../shared/TableCosts';
import { TableKubernetesResource } from '../shared/TableKubernetesResource';
import { TableResourceUsage } from '../shared/TableResourceUsage';
import { TimeSeriesImages } from '../shared/TimeSeriesImages';
import { TimeSeriesMemoryOrCPU } from '../shared/TimeSeriesMemoryOrCPU';
import { TimeSeriesWorkloadStatus } from '../shared/TimeSeriesWorkloadStatus';

interface Props {
  workloadType: string;
}

export function WorkloadPageOverview({ workloadType }: Props) {
  const styles = useStyles2(getStyles);

  return (
    <Stack direction="column" gap={2}>
      <div className={styles.dashboard.header.container}>
        <VariableControl name="pod" />
        <DataLayerControl name="Restarts" />
        <div className={styles.dashboard.header.spacer} />
      </div>

      <TableKubernetesResource resource={workloadType} />

      <div className={styles.dashboard.row.height400px}>
        <TimeSeriesMemoryOrCPU
          title="Workload CPU"
          unit="cores"
          allocationExpr={queries.workloads.cpuAllocation}
          limitsExpr={queries.workloads.cpuLimits}
          requestsExpr={queries.workloads.cpuRequests}
          usageExpr={queries.workloads.cpuUsage}
        />
        <TimeSeriesMemoryOrCPU
          title="Workload Memory"
          unit="bytes"
          allocationExpr={queries.workloads.memoryAllocation}
          limitsExpr={queries.workloads.memoryLimits}
          requestsExpr={queries.workloads.memoryRequests}
          usageExpr={queries.workloads.memoryUsage}
        />
      </div>

      <div className={styles.dashboard.row.height400px}>
        <TimeSeriesWorkloadStatus
          title="Pods"
          queries={[
            {
              refId: 'pods',
              format: 'time_series',
              expr: queries.workloads.podsCount,
              legendFormat: 'Pods',
            },
          ]}
        />
        <TimeSeriesImages
          expr={queries.workloads.images}
          legendFormat="{{image_spec}}"
        />
        {workloadType === 'deployment' && (
          <TimeSeriesWorkloadStatus
            title="Status"
            queries={[
              {
                refId: 'replicas',
                format: 'time_series',
                expr: queries.workloads.deploymentReplicas,
                legendFormat: 'Replicas',
              },
              {
                refId: 'available',
                format: 'time_series',
                expr: queries.workloads.deploymentAvailable,
                legendFormat: 'Available',
              },
              {
                refId: 'ready',
                format: 'time_series',
                expr: queries.workloads.deploymentReady,
                legendFormat: 'Ready',
              },
              {
                refId: 'updated',
                format: 'time_series',
                expr: queries.workloads.deploymentUpdated,
                legendFormat: 'Updated',
              },
              {
                refId: 'unavailable',
                format: 'time_series',
                expr: queries.workloads.deploymentUnavailable,
                legendFormat: 'Unavailable',
              },
            ]}
          />
        )}
        {workloadType === 'statefulset' && (
          <TimeSeriesWorkloadStatus
            title="Status"
            queries={[
              {
                refId: 'replicas',
                format: 'time_series',
                expr: queries.workloads.statefulsetReplicas,
                legendFormat: 'Replicas',
              },
              {
                refId: 'available',
                format: 'time_series',
                expr: queries.workloads.statefulsetAvailable,
                legendFormat: 'Available',
              },
              {
                refId: 'ready',
                format: 'time_series',
                expr: queries.workloads.statefulsetReady,
                legendFormat: 'Ready',
              },
              {
                refId: 'updated',
                format: 'time_series',
                expr: queries.workloads.statefulsetUpdated,
                legendFormat: 'Updated',
              },
            ]}
          />
        )}
        {workloadType === 'daemonset' && (
          <TimeSeriesWorkloadStatus
            title="Status"
            queries={[
              {
                refId: 'desired',
                format: 'time_series',
                expr: queries.workloads.daemonsetDesired,
                legendFormat: 'Desired',
              },
              {
                refId: 'scheduled',
                format: 'time_series',
                expr: queries.workloads.daemonsetScheduled,
                legendFormat: 'Scheduled',
              },
              {
                refId: 'available',
                format: 'time_series',
                expr: queries.workloads.daemonsetAvailable,
                legendFormat: 'Available',
              },
              {
                refId: 'ready',
                format: 'time_series',
                expr: queries.workloads.daemonsetReady,
                legendFormat: 'Ready',
              },
              {
                refId: 'updated',
                format: 'time_series',
                expr: queries.workloads.daemonsetUpdated,
                legendFormat: 'Updated',
              },
              {
                refId: 'unavailable',
                format: 'time_series',
                expr: queries.workloads.daemonsetUnavailable,
                legendFormat: 'Unavailable',
              },
              {
                refId: 'misscheduled',
                format: 'time_series',
                expr: queries.workloads.daemonsetMisscheduled,
                legendFormat: 'Misscheduled',
              },
            ]}
          />
        )}
        {workloadType === 'cronjob' && (
          <TimeSeriesWorkloadStatus
            title="Status"
            queries={[
              {
                refId: 'active',
                format: 'time_series',
                expr: queries.workloads.cronjobActive,
                legendFormat: 'Active',
              },
            ]}
          />
        )}
        {workloadType === 'job' && (
          <TimeSeriesWorkloadStatus
            title="Status"
            queries={[
              {
                refId: 'active',
                format: 'time_series',
                expr: queries.workloads.jobActive,
                legendFormat: 'Active',
              },
              {
                refId: 'succeeded',
                format: 'time_series',
                expr: queries.workloads.jobSucceeded,
                legendFormat: 'Succeeded',
              },
              {
                refId: 'failed',
                format: 'time_series',
                expr: queries.workloads.jobFailed,
                legendFormat: 'Failed',
              },
            ]}
          />
        )}
      </div>

      <RowCosts
        costsCPUAllocation={queries.workloads.costsCPUAllocation}
        costsMemoryAllocation={queries.workloads.costsMemoryAllocation}
        costsCPUIdle={queries.workloads.costsCPUIdle}
        costsMemoryIdle={queries.workloads.costsMemoryIdle}
      />

      <Pods />

      {workloadType === 'cronjob' && <Jobs />}
    </Stack>
  );
}

function Pods() {
  const styles = useStyles2(getStyles);
  const [selected, setSelected] = useState('usage');

  return (
    <div className={styles.pluginPage.section}>
      <h4>Pods</h4>
      <Stack direction="column" gap={2}>
        <div className={styles.dashboard.header.container}>
          <RadioButtonGroup
            options={[
              { label: 'Usage', value: 'usage' },
              { label: 'Cost', value: 'cost' },
              { label: 'Info', value: 'info' },
            ]}
            value={selected}
            onChange={(value) => setSelected(value)}
          />
          {selected === 'usage' && <VariableControl name="workload" />}
          <div className={styles.dashboard.header.spacer} />
          {selected === 'usage' && <LegendResourceUsage />}
        </div>
        <div className={styles.dashboard.row.height400px}>
          {selected === 'usage' && (
            <TableResourceUsage
              title="Pods"
              infoPodExpr={queries.pods.info}
              cpuUsageAvgExpr={queries.pods.cpuUsageAvgOverTime}
              cpuUsageAvgPercentExpr={queries.pods.cpuUsageAvgPercentOverTime}
              cpuUsageMaxExpr={queries.pods.cpuUsageMaxOverTime}
              cpuUsageMaxPercentExpr={queries.pods.cpuUsageMaxPercentOverTime}
              memoryUsageAvgExpr={queries.pods.memoryUsageAvgOverTime}
              memoryUsageAvgPercentExpr={
                queries.pods.memoryUsageAvgPercentOverTime
              }
              memoryUsageMaxExpr={queries.pods.memoryUsageMaxOverTime}
              memoryUsageMaxPercentExpr={
                queries.pods.memoryUsageMaxPercentOverTime
              }
            />
          )}
          {selected === 'cost' && (
            <TableCosts
              title="Pods"
              cpuAllocationExpr={queries.pods.costsCPUAllocation}
              memoryAllocationExpr={queries.pods.costsMemoryAllocation}
              cpuIdleExpr={queries.pods.costsCPUIdle}
              memoryIdleExpr={queries.pods.costsMemoryIdle}
            />
          )}
          {selected === 'info' && <TableKubernetesPods />}
        </div>
      </Stack>
    </div>
  );
}

function Jobs() {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.pluginPage.section}>
      <h4>Jobs</h4>
      <Stack direction="column" gap={2}>
        <div className={styles.dashboard.row.height400px}>
          <TableKubernetesJobs />
        </div>
      </Stack>
    </div>
  );
}

function TableKubernetesPods() {
  const dataProvider = useQueryRunner({
    datasource: {
      type: datasourcePluginJson.id,
      uid: '$datasource',
    },
    queries: [
      {
        refId: 'A',
        queryType: 'kubernetes-resources',
        resourceId: 'pod',
        namespace: '$namespace',
        parameterName: 'regex',
        parameterValue: '${pod:regex}',
      },
    ],
  });

  const viz = VizConfigBuilders.table().build();

  const menu = useVizPanelMenu({
    data: dataProvider.useState(),
    viz,
  });

  return (
    <VizPanel title="Pods" menu={menu} viz={viz} dataProvider={dataProvider} />
  );
}

function TableKubernetesJobs() {
  const dataProvider = useQueryRunner({
    datasource: {
      type: datasourcePluginJson.id,
      uid: '$datasource',
    },
    queries: [
      {
        refId: 'A',
        queryType: 'kubernetes-resources',
        resourceId: 'job.batch',
        namespace: '$namespace',
        parameterName: 'jsonPath',
        parameterValue: `{.items[?(@.metadata.ownerReferences[0].name=='$workload')]}`,
      },
    ],
  });

  const viz = VizConfigBuilders.table().build();

  const menu = useVizPanelMenu({
    data: dataProvider.useState(),
    viz,
  });

  return (
    <VizPanel title="Jobs" menu={menu} viz={viz} dataProvider={dataProvider} />
  );
}
