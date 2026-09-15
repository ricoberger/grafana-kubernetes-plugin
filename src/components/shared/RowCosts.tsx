import { useStyles2 } from '@grafana/ui';
import React from 'react';

import { getStyles } from '../../utils/utils.styles';
import { StatCosts } from './StatCosts';

interface Props {
  costsCPUAllocation: string;
  costsMemoryAllocation: string;
  costsCPUIdle: string;
  costsMemoryIdle: string;
}

export function RowCosts({
  costsCPUAllocation,
  costsMemoryAllocation,
  costsCPUIdle,
  costsMemoryIdle,
}: Props) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.dashboard.row.height100px}>
      <StatCosts
        title="CPU Allocation Costs"
        description="Allocation is the greater amount of either the actual CPU usage or the requested amount. CPU allocation is multiplied by the hourly CPU cost estimated by OpenCost, sampled every five minutes, and summed with each sample weighted by 1/12 hour."
        refId="cpu"
        expr={costsCPUAllocation}
      />
      <StatCosts
        title="Memory Allocation Costs"
        description="Allocation is the greater amount of either the actual memory usage or the requested amount. Memory allocation is multiplied by the hourly memory cost estimated by OpenCost, sampled every five minutes, and summed with each sample weighted by 1/12 hour."
        refId="memory"
        expr={costsMemoryAllocation}
      />
      <StatCosts
        title="Total Allocation Costs"
        description="Allocation is the greater amount of either the actual CPU and memory usage or the requested amount. CPU and memory allocation are multiplied by their hourly costs estimated by OpenCost, sampled every five minutes, and summed with each sample weighted by 1/12 hour."
        refId="total"
        expr={`(${costsCPUAllocation}) + (${costsMemoryAllocation})`}
      />
      <StatCosts
        title="CPU Idle Costs"
        description={`For Nodes and Clusters, idle cost is the difference between usage and physical capacity. For resources not at the Node or Cluster level, idle cost is the difference between usage and requests. Requests act as reserved resources, so unused requests can't be used by other objects in Kubernetes.

"Undersized" means that usage is greater than requests, so it is not possible to calculate the idle cost.`}
        refId="cpu"
        expr={costsCPUIdle}
      />
      <StatCosts
        title="Memory Idle Costs"
        description={`For Nodes and Clusters, idle cost is the difference between usage and physical capacity. For resources not at the Node or Cluster level, idle cost is the difference between usage and requests. Requests act as reserved resources, so unused requests can't be used by other objects in Kubernetes.

"Undersized" means that usage is greater than requests, so it is not possible to calculate the idle cost.`}
        refId="memory"
        expr={costsMemoryIdle}
      />
      <StatCosts
        title="Total Idle Costs"
        description={`For Nodes and Clusters, idle cost is the difference between usage and physical capacity. For resources not at the Node or Cluster level, idle cost is the difference between usage and requests. Requests act as reserved resources, so unused requests can't be used by other objects in Kubernetes.

"Undersized" means that usage is greater than requests, so it is not possible to calculate the idle cost.`}
        refId="total"
        expr={`(${costsCPUIdle}) + (${costsMemoryIdle})`}
      />
    </div>
  );
}
