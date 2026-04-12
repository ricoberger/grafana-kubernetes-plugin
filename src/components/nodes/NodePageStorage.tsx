import { VariableControl } from '@grafana/scenes-react';
import { Stack, useStyles2 } from '@grafana/ui';
import React from 'react';

import { getStyles } from '../../utils/utils.styles';
import { queries } from '../../utils/utils.queries';
import { TimeSeriesIO } from '../shared/TimeSeriesIO';
import { TimeSeriesMemoryOrCPUDistribution } from '../shared/TimeSeriesMemoryOrCPUDistribution';

export function NodePageStorage() {
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
        <TimeSeriesIO
          title="Throughput"
          unit="Bps"
          color="purple"
          inExpr={queries.nodes.throughputRead}
          outExpr={queries.nodes.throughputWrite}
          inLegend="read"
          outLegend="write"
        />
        <TimeSeriesIO
          title="IOPS"
          unit="iops"
          color="blue"
          inExpr={queries.nodes.iopsRead}
          outExpr={queries.nodes.iopsWrite}
          inLegend="read"
          outLegend="write"
        />
      </div>
      <div className={styles.dashboard.row.height400px}>
        <TimeSeriesIO
          title="Throughput by Pod"
          unit="Bps"
          color="purple"
          inExpr={queries.pods.throughputRead}
          outExpr={queries.pods.throughputWrite}
          inLegend="read ({{namespace}}/{{pod}})"
          outLegend="write ({{namespace}}/{{pod}})"
        />
        <TimeSeriesIO
          title="IOPS by Pod"
          unit="iops"
          color="blue"
          inExpr={queries.pods.iopsRead}
          outExpr={queries.pods.iopsWrite}
          inLegend="read ({{namespace}}/{{pod}})"
          outLegend="write ({{namespace}}/{{pod}})"
        />
      </div>
      <div className={styles.dashboard.row.height400px}>
        <TimeSeriesMemoryOrCPUDistribution
          title="Pressure: Pod Waiting"
          unit="s"
          expr={queries.pods.ioPressureWaiting}
          legend="{{ namespace }}/{{ pod }}"
        />
        <TimeSeriesMemoryOrCPUDistribution
          title="Pressure: Pod Stalled"
          unit="s"
          expr={queries.pods.ioPressureStalled}
          legend="{{ namespace }}/{{ pod }}"
        />
      </div>
    </Stack>
  );
}
