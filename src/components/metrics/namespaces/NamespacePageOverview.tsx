import React, { useState } from 'react';
import { RadioButtonGroup, Stack, useStyles2 } from '@grafana/ui';
import {
  VariableControl,
  useQueryRunner,
  VizPanel,
} from '@grafana/scenes-react';
import { VizConfigBuilders } from '@grafana/scenes';

import { getStyles } from '../../../utils/utils.styles';
import { queries } from '../queries';
import { TableResourceUsage } from '../shared/TableResourceUsage';
import { LegendResourceUsage } from '../shared/LegendResourceUsage';
import { TableKubernetesResource } from '../shared/TableKubernetesResource';
import { TimeSeriesMemoryOrCPU } from '../shared/TimeSeriesMemoryOrCPU';
import datasourcePluginJson from '../../../datasource/plugin.json';
import { useVizPanelMenu } from '../../../hooks/useVizPanelMenu';
import { RowCosts } from '../shared/RowCosts';

export function NamespacePageOverview() {
  const styles = useStyles2(getStyles);

  return (
    <Stack direction="column" gap={2}>
      <div className={styles.dashboard.header.container}>
        <VariableControl name="datasource" />
        <VariableControl name="prometheus" />
        <VariableControl name="cluster" />
        <VariableControl name="namespace" />
        <div className={styles.dashboard.header.spacer} />
      </div>

      <TableKubernetesResource resource="namespace" />

      <div className={styles.dashboard.row.height400px}>
        <TimeSeriesMemoryOrCPU
          title="Namespace CPU"
          unit="cores"
          allocationExpr={queries.namespaces.cpuAllocation}
          limitsExpr={queries.namespaces.cpuLimits}
          requestsExpr={queries.namespaces.cpuRequests}
          usageExpr={queries.namespaces.cpuUsage}
        />
        <TimeSeriesMemoryOrCPU
          title="Namespace Memory"
          unit="bytes"
          allocationExpr={queries.namespaces.memoryAllocation}
          limitsExpr={queries.namespaces.memoryLimits}
          requestsExpr={queries.namespaces.memoryRequests}
          usageExpr={queries.namespaces.memoryUsage}
        />
      </div>

      <RowCosts
        costsCPUAllocation={queries.namespaces.costsCPUAllocation}
        costsMemoryAllocation={queries.namespaces.costsMemoryAllocation}
        costsCPUIdle={queries.namespaces.costsCPUIdle}
        costsMemoryIdle={queries.namespaces.costsMemoryIdle}
      />

      <Workloads />
    </Stack>
  );
}

function Workloads() {
  const styles = useStyles2(getStyles);
  const [selected, setSelected] = useState('usage');

  return (
    <div className={styles.pluginPage.section}>
      <h4>Workloads</h4>
      <Stack direction="column" gap={2}>
        <div className={styles.dashboard.header.container}>
          <RadioButtonGroup
            options={[
              { label: 'Usage', value: 'usage' },
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
              title="Workloads"
              cpuUsageAvgExpr={queries.workloads.cpuUsageAvgOverTime}
              cpuUsageAvgPercentExpr={
                queries.workloads.cpuUsageAvgPercentOverTime
              }
              cpuUsageMaxExpr={queries.workloads.cpuUsageMaxOverTime}
              cpuUsageMaxPercentExpr={
                queries.workloads.cpuUsageMaxPercentOverTime
              }
              memoryUsageAvgExpr={queries.workloads.memoryUsageAvgOverTime}
              memoryUsageAvgPercentExpr={
                queries.workloads.memoryUsageAvgPercentOverTime
              }
              memoryUsageMaxExpr={queries.workloads.memoryUsageMaxOverTime}
              memoryUsageMaxPercentExpr={
                queries.workloads.memoryUsageMaxPercentOverTime
              }
              desiredPodsExpr={queries.workloads.desiredPods}
              readyPodsExpr={queries.workloads.readyPods}
              alertsExpr={queries.workloads.alertsCount}
            />
          )}
          {selected === 'info' && <TableKubernetesWorkloads />}
        </div>
      </Stack>
    </div>
  );
}

function TableKubernetesWorkloads() {
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
      },
      {
        refId: 'B',
        queryType: 'kubernetes-resources',
        resourceId: 'deployment.apps',
        namespace: '$namespace',
      },
      {
        refId: 'C',
        queryType: 'kubernetes-resources',
        resourceId: 'statefulset.apps',
        namespace: '$namespace',
      },
      {
        refId: 'D',
        queryType: 'kubernetes-resources',
        resourceId: 'daemonset.apps',
        namespace: '$namespace',
      },
      {
        refId: 'E',
        queryType: 'kubernetes-resources',
        resourceId: 'replicaset.apps',
        namespace: '$namespace',
      },
      {
        refId: 'F',
        queryType: 'kubernetes-resources',
        resourceId: 'cronjob.batch',
        namespace: '$namespace',
      },
      {
        refId: 'G',
        queryType: 'kubernetes-resources',
        resourceId: 'job.batch',
        namespace: '$namespace',
      },
    ],
  });

  const viz = VizConfigBuilders.table().build();

  const menu = useVizPanelMenu({
    data: dataProvider.useState(),
    viz,
  });

  return (
    <VizPanel
      title="Workloads"
      menu={menu}
      viz={viz}
      dataProvider={dataProvider}
    />
  );
}
