import { VariableControl } from '@grafana/scenes-react';
import { Stack, useStyles2 } from '@grafana/ui';
import React from 'react';

import { getStyles } from '../../../utils/utils.styles';
import { queries } from '../queries';
import { SectionPersistentVolumeClaimsForPods } from '../shared/SectionPersistenVolumeClaimsForPods';
import { TimeSeriesIO } from '../shared/TimeSeriesIO';
import { TimeSeriesMemoryOrCPUDistribution } from '../shared/TimeSeriesMemoryOrCPUDistribution';

export function NamespacePageStorage() {
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
        <TimeSeriesIO
          title="Throughput"
          unit="Bps"
          color="purple"
          inExpr={queries.namespaces.throughputRead}
          outExpr={queries.namespaces.throughputWrite}
          inLegend="read"
          outLegend="write"
        />
        <TimeSeriesIO
          title="IOPS"
          unit="iops"
          color="blue"
          inExpr={queries.namespaces.iopsRead}
          outExpr={queries.namespaces.iopsWrite}
          inLegend="read"
          outLegend="write"
        />
      </div>
      <div className={styles.dashboard.row.height400px}>
        <TimeSeriesIO
          title="Throughput by Workload"
          unit="Bps"
          color="purple"
          inExpr={queries.workloads.throughputRead}
          outExpr={queries.workloads.throughputWrite}
          inLegend="read ({{workload_type}}/{{workload}})"
          outLegend="write ({{workload_type}}/{{workload}})"
        />
        <TimeSeriesIO
          title="IOPS by Workload"
          unit="iops"
          color="blue"
          inExpr={queries.workloads.iopsRead}
          outExpr={queries.workloads.iopsWrite}
          inLegend="read ({{workload_type}}/{{workload}})"
          outLegend="write ({{workload_type}}/{{workload}})"
        />
      </div>
      <div className={styles.dashboard.row.height400px}>
        <TimeSeriesMemoryOrCPUDistribution
          title="Pressure: Pod Waiting"
          unit="s"
          expr={queries.workloads.ioPressureWaiting}
          legend="{{ workload_type }}/{{ workload }}"
        />
        <TimeSeriesMemoryOrCPUDistribution
          title="Pressure: Pod Stalled"
          unit="s"
          expr={queries.workloads.ioPressureStalled}
          legend="{{ workload_type }}/{{ workload }}"
        />
      </div>

      <SectionPersistentVolumeClaimsForPods />
    </Stack>
  );
}
