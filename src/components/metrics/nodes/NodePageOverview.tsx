import { VizConfigBuilders } from '@grafana/scenes';
import {
  useQueryRunner,
  VariableControl,
  VizPanel,
} from '@grafana/scenes-react';
import { RadioButtonGroup, Stack, useStyles2 } from '@grafana/ui';
import React, { useState } from 'react';

import datasourcePluginJson from '../../../datasource/plugin.json';
import { useVizPanelMenu } from '../../../hooks/useVizPanelMenu';
import { getStyles } from '../../../utils/utils.styles';
import { queries } from '../queries';
import { LegendResourceUsage } from '../shared/LegendResourceUsage';
import { RowCosts } from '../shared/RowCosts';
import { TableCosts } from '../shared/TableCosts';
import { TableKubernetesResource } from '../shared/TableKubernetesResource';
import { TableResourceUsage } from '../shared/TableResourceUsage';
import { TimeSeriesMemoryOrCPU } from '../shared/TimeSeriesMemoryOrCPU';

export function NodePageOverview() {
  const styles = useStyles2(getStyles);

  return (
    <Stack direction="column" gap={2}>
      <div className={styles.dashboard.header.container}>
        <VariableControl name="datasource" />
        <VariableControl name="prometheus" />
        <VariableControl name="cluster" />
        <VariableControl name="node" />
        <VariableControl name="namespace" />
        <div className={styles.dashboard.header.spacer} />
      </div>

      <TableKubernetesResource resource="node" />

      <div className={styles.dashboard.row.height400px}>
        <TimeSeriesMemoryOrCPU
          title="Node CPU"
          unit="cores"
          capacityExpr={queries.nodes.cpuCapacity}
          limitsExpr={queries.nodes.cpuLimits}
          requestsExpr={queries.nodes.cpuRequests}
          usageExpr={queries.nodes.cpuUsage}
        />
        <TimeSeriesMemoryOrCPU
          title="Node Memory"
          unit="bytes"
          capacityExpr={queries.nodes.memoryCapacity}
          limitsExpr={queries.nodes.memoryLimits}
          requestsExpr={queries.nodes.memoryRequests}
          usageExpr={queries.nodes.memoryUsage}
        />
      </div>

      <RowCosts
        costsCPUAllocation={queries.nodes.costsCPUAllocation}
        costsMemoryAllocation={queries.nodes.costsMemoryAllocation}
        costsCPUIdle={queries.nodes.costsCPUIdle}
        costsMemoryIdle={queries.nodes.costsMemoryIdle}
      />

      <Pods />
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
          {selected === 'usage' && <VariableControl name="pod" />}
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
              alertsExpr={queries.pods.alertsCount}
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
        namespace: '*',
        parameterName: 'fieldSelector',
        parameterValue: `spec.nodeName=$node`,
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
