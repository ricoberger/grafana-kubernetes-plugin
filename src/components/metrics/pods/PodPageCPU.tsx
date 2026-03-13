import React from 'react';
import { Stack, useStyles2 } from '@grafana/ui';
import { VariableControl } from '@grafana/scenes-react';

import { getStyles } from '../../../utils/utils.styles';
import { queries } from '../queries';
import { TimeSeriesMemoryOrCPU } from '../shared/TimeSeriesMemoryOrCPU';
import { TimeSeriesMemoryOrCPUDistribution } from '../shared/TimeSeriesMemoryOrCPUDistribution';
import { TimeSeriesMemoryOrCPUEfficiency } from '../shared/TimeSeriesMemoryOrCPUEfficiency';
import { TableMemoryOrCPUUsage } from '../shared/TableMemoryOrCPUUsage';

export function PodPageCPU() {
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

      <div className={styles.dashboard.row.height400px}>
        <TimeSeriesMemoryOrCPU
          title="Overview Usage"
          unit="cores"
          allocationExpr={queries.pods.cpuAllocation}
          limitsExpr={queries.pods.cpuLimits}
          requestsExpr={queries.pods.cpuRequests}
          usageExpr={queries.pods.cpuUsage}
        />
        <TimeSeriesMemoryOrCPUDistribution
          title="Distribution: Container Usage"
          unit="cores"
          expr={queries.containers.cpuDistribution}
          legend="{{ container }}"
        />
        <TimeSeriesMemoryOrCPUEfficiency
          title="Efficiency: Container Usage / Requests"
          unit="percentunit"
          expr={queries.containers.cpuEfficiency}
          legend="{{ container }}"
        />
      </div>
      <div className={styles.dashboard.row.height400px}>
        <TimeSeriesMemoryOrCPUDistribution
          title="Pressure: Container Waiting"
          unit="s"
          expr={queries.containers.cpuPressureWaiting}
          legend="{{ container }}"
        />
        <TimeSeriesMemoryOrCPUDistribution
          title="Pressure: Container Stalled"
          unit="s"
          expr={queries.containers.cpuPressureStalled}
          legend="{{ container }}"
        />
      </div>
      <div className={styles.dashboard.row.height400px}>
        <TableMemoryOrCPUUsage
          title="Containers"
          unit="cores"
          infoContainerExpr={queries.containers.infoJoinKey}
          usageExpr={queries.containers.cpuUsageJoinKey}
          requestsExpr={queries.containers.cpuRequestsJoinKey}
          requestsPercentExpr={queries.containers.cpuRequestsPercentJoinKey}
          limitsExpr={queries.containers.cpuLimitsJoinKey}
          limitsPercentExpr={queries.containers.cpuLimitsPercentJoinKey}
        />
      </div>
    </Stack>
  );
}
