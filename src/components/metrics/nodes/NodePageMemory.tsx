import { VariableControl } from '@grafana/scenes-react';
import { Stack, useStyles2 } from '@grafana/ui';
import React from 'react';

import { getStyles } from '../../../utils/utils.styles';
import { queries } from '../queries';
import { TableMemoryOrCPUUsage } from '../shared/TableMemoryOrCPUUsage';
import { TimeSeriesMemoryOrCPU } from '../shared/TimeSeriesMemoryOrCPU';
import { TimeSeriesMemoryOrCPUDistribution } from '../shared/TimeSeriesMemoryOrCPUDistribution';
import { TimeSeriesMemoryOrCPUEfficiency } from '../shared/TimeSeriesMemoryOrCPUEfficiency';

export function NodePageMemory() {
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
        <div className={styles.dashboard.header.spacer} />
      </div>

      <div className={styles.dashboard.row.height400px}>
        <TimeSeriesMemoryOrCPU
          title="Overview: Usage"
          unit="bytes"
          capacityExpr={queries.nodes.memoryCapacity}
          limitsExpr={queries.nodes.memoryLimits}
          requestsExpr={queries.nodes.memoryRequests}
          usageExpr={queries.nodes.memoryUsage}
        />
        <TimeSeriesMemoryOrCPUDistribution
          title="Distribution: Pod Usage / Node Capacity"
          unit="percentunit"
          expr={queries.nodes.memoryDistribution}
          legend="{{ namespace }}/{{ pod }}"
        />
        <TimeSeriesMemoryOrCPUEfficiency
          title="Efficiency: Pod Usage / Requests"
          unit="percentunit"
          expr={queries.nodes.memoryEfficiency}
          legend="{{ namespace }}/{{ pod }}"
        />
      </div>
      <div className={styles.dashboard.row.height400px}>
        <TimeSeriesMemoryOrCPUDistribution
          title="Pressure: Pod Waiting"
          unit="s"
          expr={queries.pods.memoryPressureWaiting}
          legend="{{ namespace }}/{{ pod }}"
        />
        <TimeSeriesMemoryOrCPUDistribution
          title="Pressure: Pod Stalled"
          unit="s"
          expr={queries.pods.memoryPressureStalled}
          legend="{{ namespace }}/{{ pod }}"
        />
      </div>
      <div className={styles.dashboard.row.height400px}>
        <TableMemoryOrCPUUsage
          title="Pods"
          unit="bytes"
          infoExpr={queries.pods.infoJoinKey}
          usageExpr={queries.pods.memoryUsageJoinKey}
          requestsExpr={queries.pods.memoryRequestsJoinKey}
          requestsPercentExpr={queries.pods.memoryRequestsPercentJoinKey}
          limitsExpr={queries.pods.memoryLimitsJoinKey}
          limitsPercentExpr={queries.pods.memoryLimitsPercentJoinKey}
        />
      </div>
    </Stack>
  );
}
