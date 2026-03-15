import React from 'react';
import { Stack, useStyles2 } from '@grafana/ui';
import { DataLayerControl, VariableControl } from '@grafana/scenes-react';

import { getStyles } from '../../../utils/utils.styles';
import { queries } from '../queries';
import { TimeSeriesMemoryOrCPU } from '../shared/TimeSeriesMemoryOrCPU';
import { TimeSeriesMemoryOrCPUDistribution } from '../shared/TimeSeriesMemoryOrCPUDistribution';
import { TimeSeriesMemoryOrCPUEfficiency } from '../shared/TimeSeriesMemoryOrCPUEfficiency';
import { TableMemoryOrCPUUsage } from '../shared/TableMemoryOrCPUUsage';

export function PodPageMemory() {
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

      <div className={styles.dashboard.row.height400px}>
        <TimeSeriesMemoryOrCPU
          title="Overview: Usage"
          unit="bytes"
          allocationExpr={queries.pods.memoryAllocation}
          limitsExpr={queries.pods.memoryLimits}
          requestsExpr={queries.pods.memoryRequests}
          usageExpr={queries.pods.memoryUsage}
        />
        <TimeSeriesMemoryOrCPUDistribution
          title="Distribution: Container Usage"
          unit="bytes"
          expr={queries.containers.memoryDistribution}
          legend="{{ container }}"
        />
        <TimeSeriesMemoryOrCPUEfficiency
          title="Efficiency: Container Usage / Requests"
          unit="percentunit"
          expr={queries.containers.memoryEfficiency}
          legend="{{ container }}"
        />
      </div>
      <div className={styles.dashboard.row.height400px}>
        <TimeSeriesMemoryOrCPUDistribution
          title="Pressure: Container Waiting"
          unit="s"
          expr={queries.containers.memoryPressureWaiting}
          legend="{{ container }}"
        />
        <TimeSeriesMemoryOrCPUDistribution
          title="Pressure: Container Stalled"
          unit="s"
          expr={queries.containers.memoryPressureStalled}
          legend="{{ container }}"
        />
      </div>
      <div className={styles.dashboard.row.height400px}>
        <TableMemoryOrCPUUsage
          title="Containers"
          unit="bytes"
          infoContainerExpr={queries.containers.infoJoinKey}
          usageExpr={queries.containers.memoryUsageJoinKey}
          requestsExpr={queries.containers.memoryRequestsJoinKey}
          requestsPercentExpr={queries.containers.memoryRequestsPercentJoinKey}
          limitsExpr={queries.containers.memoryLimitsJoinKey}
          limitsPercentExpr={queries.containers.memoryLimitsPercentJoinKey}
        />
      </div>
    </Stack>
  );
}
