import { VariableControl } from '@grafana/scenes-react';
import { Stack, useStyles2 } from '@grafana/ui';
import React from 'react';

import { queries } from '../../utils/utils.queries';
import { getStyles } from '../../utils/utils.styles';
import { RowCosts } from '../shared/RowCosts';
import { TableCosts } from '../shared/TableCosts';
import { TimeSeriesCosts } from '../shared/TimeSeriesCosts';

export function NodePageCost() {
  const styles = useStyles2(getStyles);

  return (
    <Stack direction="column" gap={2}>
      <RowCosts
        costsCPUAllocation={queries.nodes.costsCPUAllocation}
        costsMemoryAllocation={queries.nodes.costsMemoryAllocation}
        costsCPUIdle={queries.nodes.costsCPUIdle}
        costsMemoryIdle={queries.nodes.costsMemoryIdle}
      />
      <div className={styles.dashboard.row.height400px}>
        <TimeSeriesCosts
          title="Node Capacity Cost Rate"
          description="Estimated CPU, memory, and combined capacity cost in USD per hour over the selected time range for the entire node, priced using OpenCost. Total covers CPU and memory only, not GPU, storage, or network charges. Missing data is not treated as zero."
          cpuExpr={queries.nodes.costsCPUAllocationRate}
          memoryExpr={queries.nodes.costsMemoryAllocationRate}
          totalExpr={`(${queries.nodes.costsCPUAllocationRate}) + (${queries.nodes.costsMemoryAllocationRate})`}
        />
        <TimeSeriesCosts
          title="Node Idle Cost Rate"
          description="Estimated cost of idle CPU and available memory in USD per hour over the selected time range for the entire node. Unlike workload and pod idle costs, this prices unused physical capacity, not unused requests. Idle costs are part of capacity costs, not additional charges or guaranteed savings."
          cpuExpr={queries.nodes.costsCPUIdleRate}
          memoryExpr={queries.nodes.costsMemoryIdleRate}
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
