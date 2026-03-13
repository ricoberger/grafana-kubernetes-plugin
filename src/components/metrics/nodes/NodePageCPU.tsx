import React from 'react';
import { Stack, useStyles2 } from '@grafana/ui';
import { VariableControl } from '@grafana/scenes-react';

import { getStyles } from '../../../utils/utils.styles';
import { queries } from '../queries';
import { TimeSeriesMemoryOrCPU } from '../shared/TimeSeriesMemoryOrCPU';
import { TimeSeriesMemoryOrCPUDistribution } from '../shared/TimeSeriesMemoryOrCPUDistribution';
import { TimeSeriesMemoryOrCPUEfficiency } from '../shared/TimeSeriesMemoryOrCPUEfficiency';
import { TableMemoryOrCPUUsage } from '../shared/TableMemoryOrCPUUsage';

export function NodePageCPU() {
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
          unit="cores"
          capacityExpr={queries.nodes.cpuCapacity}
          limitsExpr={queries.nodes.cpuLimits}
          requestsExpr={queries.nodes.cpuRequests}
          usageExpr={queries.nodes.cpuUsage}
        />
        <TimeSeriesMemoryOrCPUDistribution
          title="Distribution: Pod Usage / Node Capacity"
          unit="percentunit"
          expr={queries.nodes.cpuDistribution}
          legend="{{ namespace }}/{{ pod }}"
        />
        <TimeSeriesMemoryOrCPUEfficiency
          title="Efficiency: Pod Usage / Requests"
          unit="percentunit"
          expr={queries.nodes.cpuEfficiency}
          legend="{{ namespace }}/{{ pod }}"
        />
      </div>
      <div className={styles.dashboard.row.height400px}>
        <TimeSeriesMemoryOrCPUDistribution
          title="Pressure: Pod Waiting"
          unit="s"
          expr={queries.pods.cpuPressureWaiting}
          legend="{{ namespace }}/{{ pod }}"
        />
        <TimeSeriesMemoryOrCPUDistribution
          title="Pressure: Pod Stalled"
          unit="s"
          expr={queries.pods.cpuPressureStalled}
          legend="{{ namespace }}/{{ pod }}"
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
