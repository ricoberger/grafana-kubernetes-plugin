import { VariableControl } from '@grafana/scenes-react';
import { Stack, useStyles2 } from '@grafana/ui';
import React from 'react';

import { queries } from '../../utils/utils.queries';
import { getStyles } from '../../utils/utils.styles';
import { TableMemoryOrCPUUsage } from '../shared/TableMemoryOrCPUUsage';
import { TimeSeriesMemoryOrCPU } from '../shared/TimeSeriesMemoryOrCPU';
import { TimeSeriesMemoryOrCPUDistribution } from '../shared/TimeSeriesMemoryOrCPUDistribution';
import { TimeSeriesMemoryOrCPUEfficiency } from '../shared/TimeSeriesMemoryOrCPUEfficiency';

export function NamespacePageMemory() {
  const styles = useStyles2(getStyles);

  return (
    <Stack direction="column" gap={2}>
      <div className={styles.dashboard.header.container}>
        <VariableControl name="datasource" />
        <VariableControl name="prometheus" />
        <VariableControl name="cluster" />
        <VariableControl name="namespace" />
        <VariableControl name="workload" />
        <div className={styles.dashboard.header.spacer} />
      </div>

      <div className={styles.dashboard.row.height400px}>
        <TimeSeriesMemoryOrCPU
          title="Overview: Usage"
          unit="bytes"
          allocationExpr={queries.namespaces.memoryAllocation}
          limitsExpr={queries.namespaces.memoryLimits}
          requestsExpr={queries.namespaces.memoryRequests}
          usageExpr={queries.namespaces.memoryUsage}
        />
        <TimeSeriesMemoryOrCPUDistribution
          title="Distribution: Workload Usage"
          unit="bytes"
          expr={queries.workloads.memoryDistribution}
          legend="{{ workload_type }}/{{ workload }}"
        />
        <TimeSeriesMemoryOrCPUEfficiency
          title="Efficiency: Workload Usage / Requests"
          unit="percentunit"
          expr={queries.workloads.memoryEfficiency}
          legend="{{ workload_type }}/{{ workload }}"
        />
      </div>
      <div className={styles.dashboard.row.height400px}>
        <TimeSeriesMemoryOrCPUDistribution
          title="Pressure: Workload Waiting"
          unit="s"
          expr={queries.workloads.memoryPressureWaiting}
          legend="{{ workload_type }}/{{ workload }}"
        />
        <TimeSeriesMemoryOrCPUDistribution
          title="Pressure: Workload Stalled"
          unit="s"
          expr={queries.workloads.memoryPressureStalled}
          legend="{{ workload_type }}/{{ workload }}"
        />
      </div>
      <div className={styles.dashboard.row.height400px}>
        <TableMemoryOrCPUUsage
          title="Workloads"
          unit="bytes"
          infoExpr={queries.workloads.infoJoinKey}
          usageExpr={queries.workloads.memoryUsageJoinKey}
          requestsExpr={queries.workloads.memoryRequestsJoinKey}
          requestsPercentExpr={queries.workloads.memoryRequestsPercentJoinKey}
          limitsExpr={queries.workloads.memoryLimitsJoinKey}
          limitsPercentExpr={queries.workloads.memoryLimitsPercentJoinKey}
        />
      </div>
    </Stack>
  );
}
