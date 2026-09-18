import { VariableControl } from '@grafana/scenes-react';
import { Stack, useStyles2 } from '@grafana/ui';
import React from 'react';

import { queries } from '../../utils/utils.queries';
import { getStyles } from '../../utils/utils.styles';
import { RowCosts } from '../shared/RowCosts';
import { TableCosts } from '../shared/TableCosts';
import { TimeSeriesCosts } from '../shared/TimeSeriesCosts';

export function NamespacePageCost() {
  const styles = useStyles2(getStyles);

  return (
    <Stack direction="column" gap={2}>
      <RowCosts
        costsCPUAllocation={queries.namespaces.costsCPUAllocation}
        costsMemoryAllocation={queries.namespaces.costsMemoryAllocation}
        costsCPUIdle={queries.namespaces.costsCPUIdle}
        costsMemoryIdle={queries.namespaces.costsMemoryIdle}
      />
      <div className={styles.dashboard.row.height400px}>
        <TimeSeriesCosts
          title="Namespace Allocation Cost Rate"
          description="Estimated CPU, memory, and combined allocation cost in USD per hour over the selected time range for the entire namespace. Allocation uses the greater of requests and usage per node, priced using OpenCost. This is attributed CPU and memory cost, not a complete bill including storage or network. Missing data is not treated as zero."
          cpuExpr={queries.namespaces.costsCPUAllocationRate}
          memoryExpr={queries.namespaces.costsMemoryAllocationRate}
          totalExpr={`(${queries.namespaces.costsCPUAllocationRate}) + (${queries.namespaces.costsMemoryAllocationRate})`}
        />
        <TimeSeriesCosts
          title="Namespace Idle Cost Rate"
          description="Estimated cost of requested but unused CPU and memory in USD per hour over the selected time range for the entire namespace. Calculated as requests minus usage, priced using OpenCost. Negative values mean usage exceeds requests, not negative spend or savings. Idle costs are not additional charges or guaranteed savings."
          cpuExpr={queries.namespaces.costsCPUIdleRate}
          memoryExpr={queries.namespaces.costsMemoryIdleRate}
        />
      </div>
      <div className={styles.pluginPage.section}>
        <h4>Workloads</h4>
        <Stack direction="column" gap={2}>
          <div className={styles.dashboard.header.container}>
            <VariableControl name="workload" />
            <div className={styles.dashboard.header.spacer} />
          </div>
          <div className={styles.dashboard.row.height400px}>
            <TableCosts
              title="Workloads"
              cpuAllocationExpr={queries.workloads.costsCPUAllocation}
              memoryAllocationExpr={queries.workloads.costsMemoryAllocation}
              cpuIdleExpr={queries.workloads.costsCPUIdle}
              memoryIdleExpr={queries.workloads.costsMemoryIdle}
            />
          </div>
        </Stack>
      </div>
    </Stack>
  );
}
