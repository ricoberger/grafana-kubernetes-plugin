import { DataLayerControl, VariableControl } from '@grafana/scenes-react';
import { Stack, useStyles2 } from '@grafana/ui';
import React from 'react';

import { queries } from '../../utils/utils.queries';
import { getStyles } from '../../utils/utils.styles';
import { RowCosts } from '../shared/RowCosts';
import { TableCosts } from '../shared/TableCosts';
import { TimeSeriesCosts } from '../shared/TimeSeriesCosts';

export function WorkloadPageCost() {
  const styles = useStyles2(getStyles);

  return (
    <Stack direction="column" gap={2}>
      <div className={styles.dashboard.header.container}>
        <DataLayerControl name="Restarts" />
        <div className={styles.dashboard.header.spacer} />
      </div>
      <RowCosts
        costsCPUAllocation={queries.workloads.costsCPUAllocation}
        costsMemoryAllocation={queries.workloads.costsMemoryAllocation}
        costsCPUIdle={queries.workloads.costsCPUIdle}
        costsMemoryIdle={queries.workloads.costsMemoryIdle}
      />
      <div className={styles.dashboard.row.height400px}>
        <TimeSeriesCosts
          title="Workload Allocation Cost Rate"
          description="Estimated CPU, memory, and combined allocation cost in USD per hour over the selected time range for the entire workload. Allocation uses the greater of requests and usage per pod and node, priced using OpenCost and attributed using pod ownership at each point in time. Total covers CPU and memory only. Missing data is not treated as zero."
          cpuExpr={queries.workloads.costsCPUAllocationRate}
          memoryExpr={queries.workloads.costsMemoryAllocationRate}
          totalExpr={`(${queries.workloads.costsCPUAllocationRate}) + (${queries.workloads.costsMemoryAllocationRate})`}
        />
        <TimeSeriesCosts
          title="Workload Idle Cost Rate"
          description="Estimated cost of requested but unused CPU and memory in USD per hour over the selected time range for the entire workload. Calculated as requests minus usage, priced using OpenCost. Negative values mean usage exceeds requests, not negative spend or savings. Idle costs are not additional charges or guaranteed savings."
          cpuExpr={queries.workloads.costsCPUIdleRate}
          memoryExpr={queries.workloads.costsMemoryIdleRate}
        />
      </div>
      <div className={styles.pluginPage.section}>
        <h4>Pods</h4>
        <Stack direction="column" gap={2}>
          <div className={styles.dashboard.header.container}>
            <VariableControl name="pod" />
            <div className={styles.dashboard.header.spacer} />
          </div>
          <div className={styles.dashboard.row.height400px}>
            <TableCosts
              title="Pods"
              cpuAllocationExpr={queries.pods.costsCPUAllocation}
              memoryAllocationExpr={queries.pods.costsMemoryAllocation}
              cpuIdleExpr={queries.pods.costsCPUIdle}
              memoryIdleExpr={queries.pods.costsMemoryIdle}
            />
          </div>
        </Stack>
      </div>
    </Stack>
  );
}
