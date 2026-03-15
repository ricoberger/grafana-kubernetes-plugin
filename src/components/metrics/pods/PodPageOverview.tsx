import React, { useState } from 'react';
import { RadioButtonGroup, Stack, useStyles2 } from '@grafana/ui';
import { DataLayerControl, VariableControl } from '@grafana/scenes-react';

import { getStyles } from '../../../utils/utils.styles';
import { queries } from '../queries';
import { TableResourceUsage } from '../shared/TableResourceUsage';
import { LegendResourceUsage } from '../shared/LegendResourceUsage';
import { TableKubernetesResource } from '../shared/TableKubernetesResource';
import { TimeSeriesMemoryOrCPU } from '../shared/TimeSeriesMemoryOrCPU';

export function PodPageOverview() {
  const styles = useStyles2(getStyles);

  return (
    <Stack direction="column" gap={2}>
      <div className={styles.dashboard.header.container}>
        <VariableControl name="datasource" />
        <VariableControl name="prometheus" />
        <VariableControl name="cluster" />
        <VariableControl name="namespace" />
        <DataLayerControl name="Restarts" />
        <div className={styles.dashboard.header.spacer} />
      </div>

      <TableKubernetesResource resource="pod" />

      <div className={styles.dashboard.row.height400px}>
        <TimeSeriesMemoryOrCPU
          title="Pod CPU"
          unit="cores"
          allocationExpr={queries.pods.cpuAllocation}
          limitsExpr={queries.pods.cpuLimits}
          requestsExpr={queries.pods.cpuRequests}
          usageExpr={queries.pods.cpuUsage}
        />
        <TimeSeriesMemoryOrCPU
          title="Pod Memory"
          unit="bytes"
          allocationExpr={queries.pods.memoryAllocation}
          limitsExpr={queries.pods.memoryLimits}
          requestsExpr={queries.pods.memoryRequests}
          usageExpr={queries.pods.memoryUsage}
        />
      </div>

      <Containers />
    </Stack>
  );
}

function Containers() {
  const styles = useStyles2(getStyles);
  const [selected, setSelected] = useState('usage');

  return (
    <div className={styles.pluginPage.section}>
      <h4>Containers</h4>
      <Stack direction="column" gap={2}>
        <div className={styles.dashboard.header.container}>
          <RadioButtonGroup
            options={[{ label: 'Usage', value: 'usage' }]}
            value={selected}
            onChange={(value) => setSelected(value)}
          />
          <div className={styles.dashboard.header.spacer} />
          {selected === 'usage' && <LegendResourceUsage />}
        </div>
        <div className={styles.dashboard.row.height400px}>
          {selected === 'usage' && (
            <TableResourceUsage
              title="Containers"
              infoContainerExpr={queries.containers.info}
              cpuUsageAvgExpr={queries.containers.cpuUsageAvgOverTime}
              cpuUsageAvgPercentExpr={
                queries.containers.cpuUsageAvgPercentOverTime
              }
              cpuUsageMaxExpr={queries.containers.cpuUsageMaxOverTime}
              cpuUsageMaxPercentExpr={
                queries.containers.cpuUsageMaxPercentOverTime
              }
              memoryUsageAvgExpr={queries.containers.memoryUsageAvgOverTime}
              memoryUsageAvgPercentExpr={
                queries.containers.memoryUsageAvgPercentOverTime
              }
              memoryUsageMaxExpr={queries.containers.memoryUsageMaxOverTime}
              memoryUsageMaxPercentExpr={
                queries.containers.memoryUsageMaxPercentOverTime
              }
            />
          )}
        </div>
      </Stack>
    </div>
  );
}
