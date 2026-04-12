import { VariableControl } from '@grafana/scenes-react';
import { Stack, useStyles2 } from '@grafana/ui';
import React from 'react';

import { getStyles } from '../../../utils/utils.styles';
import { queries } from '../queries';
import { StatCosts } from '../shared/StatCosts';
import { TableCostsTop } from '../shared/TableCostsTop';

export function MetricsPageCost() {
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
      <Stack direction="column" gap={2}>
        <div className={styles.dashboard.row.height100px}>
          <StatCosts
            title="Total Cost Prior 30-day"
            description="Total spend for the 30 days prior the current 30-day window."
            refId="totalPrior30d"
            expr={queries.cluster.costsTotalPrior30d}
          />
          <StatCosts
            title="Total Cost Current 30-day"
            description="Total spend for the previous 30-day window."
            refId="totalCurrent30d"
            expr={queries.cluster.costsTotalCurrent30d}
          />
          <StatCosts
            title="Avg. Cost per Pod"
            description="Average spend per pod for the previous 30-day window."
            refId="perPodCurrent30d"
            expr={queries.cluster.costsPerPodCurrent30d}
          />
          <StatCosts
            title="Potential Savings"
            description="The potential savings for 30 days after the current date, if CPU, memory, GPU and storage are optimized."
            refId="potentialSavingsUsage"
            expr={queries.cluster.costsPotentialSavings}
          />
        </div>
        <div className={styles.dashboard.row.height400px}>
          <TableCostsTop
            title="Top Namespaces"
            cpuAllocationExpr={queries.namespaces.costsCPUAllocation}
            memoryAllocationExpr={queries.namespaces.costsMemoryAllocation}
          />
          <TableCostsTop
            title="Top Workloads"
            cpuAllocationExpr={queries.workloads.costsCPUAllocation}
            memoryAllocationExpr={queries.workloads.costsMemoryAllocation}
          />
        </div>
      </Stack>
    </Stack>
  );
}
