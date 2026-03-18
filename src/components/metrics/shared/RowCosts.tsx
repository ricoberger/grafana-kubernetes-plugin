import React from 'react';
import { useStyles2 } from '@grafana/ui';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import { FieldColorModeId, MappingType } from '@grafana/schema';

import { getStyles } from '../../../utils/utils.styles';
import { useVizPanelMenu } from '../../../hooks/useVizPanelMenu';

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
      <SingleStat
        title="CPU Allocation Costs"
        description="Allocation is the greater amount of either the actual CPU usage or the requested amount. The sum of the CPU allocation in each hour is multiplied by the hourly CPU cost, which is estimated by OpenCost."
        refId="cpu"
        expr={costsCPUAllocation}
      />
      <SingleStat
        title="Memory Allocation Costs"
        description="Allocation is the greater amount of either the actual memory usage or the requested amount. The sum of the memory allocation in each hour is multiplied by the hourly memory cost, which is estimated by OpenCost."
        refId="memory"
        expr={costsMemoryAllocation}
      />
      <SingleStat
        title="Total Allocation Costs"
        description="Allocation is the greater amount of either the actual CPU and memory usage or the requested amount. The sum of the CPU and memory allocation in each hour is multiplied by the hourly CPU and memory cost, which is estimated by OpenCost."
        refId="total"
        expr={`(${costsCPUAllocation}) + (${costsMemoryAllocation})`}
      />
      <SingleStat
        title="CPU Idle Costs"
        description={`For Nodes and Clusters, idle cost is the difference between usage and physical capacity. For resources not at the Node or Cluster level, idle cost is the difference between usage and requests. Requests act as reserved resources, so unused requests can't be used by other objects in Kubernetes.

"Undersized" means that usage is greater than requests, so it is not possible to calculate the idle cost.`}
        refId="cpu"
        expr={costsCPUIdle}
      />
      <SingleStat
        title="Memory Idle Costs"
        description={`For Nodes and Clusters, idle cost is the difference between usage and physical capacity. For resources not at the Node or Cluster level, idle cost is the difference between usage and requests. Requests act as reserved resources, so unused requests can't be used by other objects in Kubernetes.

"Undersized" means that usage is greater than requests, so it is not possible to calculate the idle cost.`}
        refId="memory"
        expr={costsMemoryIdle}
      />
      <SingleStat
        title="Total Idle Costs"
        description={`For Nodes and Clusters, idle cost is the difference between usage and physical capacity. For resources not at the Node or Cluster level, idle cost is the difference between usage and requests. Requests act as reserved resources, so unused requests can't be used by other objects in Kubernetes.

"Undersized" means that usage is greater than requests, so it is not possible to calculate the idle cost.`}
        refId="total"
        expr={`(${costsCPUIdle}) + (${costsMemoryIdle})`}
      />
    </div>
  );
}

function SingleStat({
  title,
  description,
  refId,
  expr,
}: {
  title: string;
  description: string;
  refId: string;
  expr: string;
}) {
  const dataProvider = useQueryRunner({
    datasource: {
      type: 'prometheus',
      uid: '$prometheus',
    },
    queries: [
      {
        refId: refId,
        format: 'time_series',
        instant: true,
        expr: expr,
      },
    ],
  });

  const viz = VizConfigBuilders.stat()
    .setUnit('currencyUSD')
    .setColor({
      mode: FieldColorModeId.Fixed,
      fixedColor: 'text',
    })
    .setMappings([
      {
        options: {
          from: null,
          to: 0,
          result: {
            text: 'Undersized',
            index: 0,
          },
        },
        type: MappingType.RangeToText,
      },
    ])

    .build();

  const menu = useVizPanelMenu({
    data: dataProvider.useState(),
    viz,
  });

  return (
    <VizPanel
      title={title}
      description={description}
      menu={menu}
      viz={viz}
      dataProvider={dataProvider}
    />
  );
}
