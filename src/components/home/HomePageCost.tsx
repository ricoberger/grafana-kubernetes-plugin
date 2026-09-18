import { VariableControl } from '@grafana/scenes-react';
import { Stack, useStyles2 } from '@grafana/ui';
import React from 'react';

import { queries } from '../../utils/utils.queries';
import { getStyles } from '../../utils/utils.styles';
import { StatCosts } from '../shared/StatCosts';
import { TableCosts } from '../shared/TableCosts';
import { TimeSeriesCosts } from '../shared/TimeSeriesCosts';

export function HomePageCost() {
  const styles = useStyles2(getStyles);

  return (
    <Stack direction="column" gap={2}>
      <div className={styles.dashboard.header.container}>
        <VariableControl name="datasource" />
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
          <TimeSeriesCosts
            title="Node Infrastructure Cost Rate"
            description="Estimated node cost in USD per hour over the selected time range, not cumulative spend. CPU and memory price the node capacity. Total uses OpenCost's node total hourly cost and can include costs beyond CPU and memory; it does not include all cluster expenses, such as persistent volumes or network charges. Requires OpenCost pricing and Kubernetes capacity metrics."
            cpuExpr={queries.cluster.costsCPUAllocationRate}
            memoryExpr={queries.cluster.costsMemoryAllocationRate}
            totalExpr={queries.cluster.costsTotalRate}
          />
          <TimeSeriesCosts
            title="Idle CPU / Memory Cost Rate"
            description="Estimated cost of idle node CPU and available memory in USD per hour over the selected time range. These costs are part of infrastructure cost, not additional spend or guaranteed savings. Requires OpenCost pricing and node utilization metrics. Missing data is not treated as zero."
            cpuExpr={queries.cluster.costsCPUIdleRate}
            memoryExpr={queries.cluster.costsMemoryIdleRate}
          />
        </div>

        <div className={styles.pluginPage.section}>
          <h4>Nodes</h4>
          <div className={styles.dashboard.row.height400px}>
            <TableCosts
              title="Nodes"
              description="CPU, memory, and combined capacity and idle costs per node for the selected time range. Allocation prices physical capacity; idle prices unused capacity. These are an infrastructure view of costs, not amounts to add to the namespace allocation costs below."
              sortBy={[{ displayName: 'TOTAL ALLOCATION', desc: true }]}
              cpuAllocationExpr={queries.nodes.costsCPUAllocation}
              memoryAllocationExpr={queries.nodes.costsMemoryAllocation}
              cpuIdleExpr={queries.nodes.costsCPUIdle}
              memoryIdleExpr={queries.nodes.costsMemoryIdle}
            />
          </div>
        </div>

        <div className={styles.pluginPage.section}>
          <h4>Namespaces</h4>
          <div className={styles.dashboard.row.height400px}>
            <TableCosts
              title="Namespaces"
              description="CPU, memory, and combined allocation and idle costs per namespace for the selected time range. Allocation prices the greater of requests and usage; idle prices requests minus usage. These are attributed costs, not additional charges on top of node capacity costs."
              sortBy={[{ displayName: 'TOTAL ALLOCATION', desc: true }]}
              cpuAllocationExpr={queries.namespaces.costsCPUAllocation}
              memoryAllocationExpr={queries.namespaces.costsMemoryAllocation}
              cpuIdleExpr={queries.namespaces.costsCPUIdle}
              memoryIdleExpr={queries.namespaces.costsMemoryIdle}
            />
          </div>
        </div>
      </Stack>
    </Stack>
  );
}
