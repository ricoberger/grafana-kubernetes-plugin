import { DataLayerControl, VariableControl } from '@grafana/scenes-react';
import { Stack, useStyles2 } from '@grafana/ui';
import React from 'react';

import { getStyles } from '../../../utils/utils.styles';
import { queries } from '../queries';
import { TableMemoryOrCPUUsage } from '../shared/TableMemoryOrCPUUsage';
import { TimeSeriesMemoryOrCPU } from '../shared/TimeSeriesMemoryOrCPU';
import { TimeSeriesMemoryOrCPUDistribution } from '../shared/TimeSeriesMemoryOrCPUDistribution';
import { TimeSeriesMemoryOrCPUEfficiency } from '../shared/TimeSeriesMemoryOrCPUEfficiency';

export function WorkloadPageCPU() {
  const styles = useStyles2(getStyles);

  return (
    <Stack direction="column" gap={2}>
      <div className={styles.dashboard.header.container}>
        <VariableControl name="datasource" />
        <VariableControl name="prometheus" />
        <VariableControl name="cluster" />
        <VariableControl name="node" />
        <VariableControl name="namespace" />
        <VariableControl name="pod" />
        <DataLayerControl name="Restarts" />
        <div className={styles.dashboard.header.spacer} />
      </div>

      <div className={styles.dashboard.row.height400px}>
        <TimeSeriesMemoryOrCPU
          title="Overview: Usage"
          unit="cores"
          allocationExpr={queries.workloads.cpuAllocation}
          limitsExpr={queries.workloads.cpuLimits}
          requestsExpr={queries.workloads.cpuRequests}
          usageExpr={queries.workloads.cpuUsage}
        />
        <TimeSeriesMemoryOrCPUDistribution
          title="Distribution: Pod Usage / Node Capacity"
          unit="cores"
          expr={queries.pods.cpuUsage}
          legend="{{ pod }}"
        />
        <TimeSeriesMemoryOrCPUEfficiency
          title="Efficiency: Pod Usage"
          unit="percentunit"
          expr={queries.nodes.cpuEfficiency}
          legend="{{ pod }}"
        />
      </div>
      <div className={styles.dashboard.row.height400px}>
        <TimeSeriesMemoryOrCPUDistribution
          title="Pressure: Pod Waiting"
          unit="s"
          expr={queries.pods.cpuPressureWaiting}
          legend="{{ pod }}"
        />
        <TimeSeriesMemoryOrCPUDistribution
          title="Pressure: Pod Stalled"
          unit="s"
          expr={queries.pods.cpuPressureStalled}
          legend="{{ pod }}"
        />
      </div>
      <div className={styles.dashboard.row.height400px}>
        <TableMemoryOrCPUUsage
          title="Pods"
          unit="cores"
          infoExpr={queries.pods.infoJoinKey}
          usageExpr={queries.pods.cpuUsageJoinKey}
          requestsExpr={queries.pods.cpuRequestsJoinKey}
          requestsPercentExpr={queries.pods.cpuRequestsPercentJoinKey}
          limitsExpr={queries.pods.cpuLimitsJoinKey}
          limitsPercentExpr={queries.pods.cpuLimitsPercentJoinKey}
        />
      </div>
    </Stack>
  );
}
