import React from 'react';
import { Stack, useStyles2 } from '@grafana/ui';
import { VariableControl } from '@grafana/scenes-react';

import { getStyles } from '../../../utils/utils.styles';
import { queries } from '../queries';
import { TimeSeriesMemoryOrCPU } from '../shared/TimeSeriesMemoryOrCPU';
import { TimeSeriesMemoryOrCPUDistribution } from '../shared/TimeSeriesMemoryOrCPUDistribution';
import { TimeSeriesMemoryOrCPUEfficiency } from '../shared/TimeSeriesMemoryOrCPUEfficiency';
import { TableMemoryOrCPUUsage } from '../shared/TableMemoryOrCPUUsage';

export function NamespacePageCPU() {
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
          unit="cores"
          allocationExpr={queries.namespaces.cpuAllocation}
          limitsExpr={queries.namespaces.cpuLimits}
          requestsExpr={queries.namespaces.cpuRequests}
          usageExpr={queries.namespaces.cpuUsage}
        />
        <TimeSeriesMemoryOrCPUDistribution
          title="Distribution: Workload Usage"
          unit="cores"
          expr={queries.workloads.cpuDistribution}
          legend="{{ workload_type }}/{{ workload }}"
        />
        <TimeSeriesMemoryOrCPUEfficiency
          title="Efficiency: Workload Usage / Requests"
          unit="percentunit"
          expr={queries.workloads.cpuEfficiency}
          legend="{{ workload_type }}/{{ workload }}"
        />
      </div>
      <div className={styles.dashboard.row.height400px}>
        <TimeSeriesMemoryOrCPUDistribution
          title="Pressure: Workload Waiting"
          unit="s"
          expr={queries.workloads.cpuPressureWaiting}
          legend="{{ workload_type }}/{{ workload }}"
        />
        <TimeSeriesMemoryOrCPUDistribution
          title="Pressure: Workload Stalled"
          unit="s"
          expr={queries.workloads.cpuPressureStalled}
          legend="{{ workload_type }}/{{ workload }}"
        />
      </div>
      <div className={styles.dashboard.row.height400px}>
        <TableMemoryOrCPUUsage
          title="Workloads"
          unit="cores"
          infoExpr={queries.workloads.infoJoinKey}
          usageExpr={queries.workloads.cpuUsageJoinKey}
          requestsExpr={queries.workloads.cpuRequestsJoinKey}
          requestsPercentExpr={queries.workloads.cpuRequestsPercentJoinKey}
          limitsExpr={queries.workloads.cpuLimitsJoinKey}
          limitsPercentExpr={queries.workloads.cpuLimitsPercentJoinKey}
        />
      </div>
    </Stack>
  );
}
