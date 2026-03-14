import React from 'react';
import { Stack, useStyles2 } from '@grafana/ui';
import { VariableControl } from '@grafana/scenes-react';

import { getStyles } from '../../../utils/utils.styles';
import { queries } from '../queries';
import { TimeSeriesIO } from '../shared/TimeSeriesIO';
import { TimeSeriesMemoryOrCPUDistribution } from '../shared/TimeSeriesMemoryOrCPUDistribution';
import { SectionPersistentVolumeClaimsForPods } from '../shared/SectionPersistenVolumeClaimsForPods';

export function PodPageStorage() {
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
        <TimeSeriesIO
          title="Throughput"
          unit="Bps"
          color="purple"
          inExpr={queries.pods.throughputRead}
          outExpr={queries.pods.throughputWrite}
          inLegend="read"
          outLegend="write"
        />
        <TimeSeriesIO
          title="IOPS"
          unit="iops"
          color="blue"
          inExpr={queries.pods.iopsRead}
          outExpr={queries.pods.iopsWrite}
          inLegend="read"
          outLegend="write"
        />
      </div>
      <div className={styles.dashboard.row.height400px}>
        <TimeSeriesIO
          title="Throughput by Container"
          unit="Bps"
          color="purple"
          inExpr={queries.containers.throughputRead}
          outExpr={queries.containers.throughputWrite}
          inLegend="read ({{container}})"
          outLegend="write ({{container}})"
        />
        <TimeSeriesIO
          title="IOPS by Container"
          unit="iops"
          color="blue"
          inExpr={queries.containers.iopsRead}
          outExpr={queries.containers.iopsWrite}
          inLegend="read ({{container}})"
          outLegend="write ({{container}})"
        />
      </div>
      <div className={styles.dashboard.row.height400px}>
        <TimeSeriesMemoryOrCPUDistribution
          title="Pressure: Container Waiting"
          unit="s"
          expr={queries.containers.ioPressureWaiting}
          legend="{{ container }}"
        />
        <TimeSeriesMemoryOrCPUDistribution
          title="Pressure: Container Stalled"
          unit="s"
          expr={queries.containers.ioPressureStalled}
          legend="{{ container }}"
        />
      </div>

      <SectionPersistentVolumeClaimsForPods />
    </Stack>
  );
}
