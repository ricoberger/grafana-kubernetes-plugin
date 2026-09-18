import { DataLayerControl } from '@grafana/scenes-react';
import { Stack, useStyles2 } from '@grafana/ui';
import React from 'react';

import { queries } from '../../utils/utils.queries';
import { getStyles } from '../../utils/utils.styles';
import { RowCosts } from '../shared/RowCosts';
import { TimeSeriesCosts } from '../shared/TimeSeriesCosts';

export function PodPageCost() {
  const styles = useStyles2(getStyles);

  return (
    <Stack direction="column" gap={2}>
      <div className={styles.dashboard.header.container}>
        <DataLayerControl name="Restarts" />
        <div className={styles.dashboard.header.spacer} />
      </div>
      <RowCosts
        costsCPUAllocation={queries.pods.costsCPUAllocation}
        costsMemoryAllocation={queries.pods.costsMemoryAllocation}
        costsCPUIdle={queries.pods.costsCPUIdle}
        costsMemoryIdle={queries.pods.costsMemoryIdle}
      />
      <div className={styles.dashboard.row.height400px}>
        <TimeSeriesCosts
          title="Pod Allocation Cost Rate"
          description="Estimated CPU, memory, and combined allocation cost in USD per hour over the selected time range for the entire pod. Allocation uses the greater of requests and usage, priced using OpenCost. Total covers CPU and memory only, not storage or network charges. Missing data is not treated as zero."
          cpuExpr={queries.pods.costsCPUAllocationRate}
          memoryExpr={queries.pods.costsMemoryAllocationRate}
          totalExpr={`(${queries.pods.costsCPUAllocationRate}) + (${queries.pods.costsMemoryAllocationRate})`}
        />
        <TimeSeriesCosts
          title="Pod Idle Cost Rate"
          description="Estimated cost of requested but unused CPU and memory in USD per hour over the selected time range for the entire pod. Calculated as requests minus usage, priced using OpenCost. Negative values mean usage exceeds requests, not negative spend or savings. Idle costs are not additional charges or guaranteed savings."
          cpuExpr={queries.pods.costsCPUIdleRate}
          memoryExpr={queries.pods.costsMemoryIdleRate}
        />
      </div>
    </Stack>
  );
}
