import React from 'react';
import { Stack, useStyles2 } from '@grafana/ui';
import { VariableControl } from '@grafana/scenes-react';

import { getStyles } from '../../../utils/utils.styles';
import { queries } from '../queries';
import { TimeSeriesIO } from '../shared/TimeSeriesIO';

export function NodePageNetwork() {
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
          title="Network Bandwidth"
          unit="binBps"
          color="blue"
          inExpr={queries.nodes.networkBandwidthRx}
          outExpr={queries.nodes.networkBandwidthTx}
          inLegend="Rx"
          outLegend="Tx"
        />
        <TimeSeriesIO
          title="Network Saturation"
          unit="pps"
          color="red"
          inExpr={queries.nodes.networkSaturationRx}
          outExpr={queries.nodes.networkSaturationTx}
          inLegend="Rx dropped packets"
          outLegend="Tx dropped packets"
        />
      </div>
      <div className={styles.dashboard.row.height400px}>
        <TimeSeriesIO
          title="Network Bandwidth by Pod"
          unit="binBps"
          color="blue"
          inExpr={queries.nodes.networkBandwidthByPodRx}
          outExpr={queries.nodes.networkBandwidthByPodTx}
          inLegend="Rx ({{namespace}}/{{pod}})"
          outLegend="Tx ({{namespace}}/{{pod}})"
        />
        <TimeSeriesIO
          title="Network Saturation by Pod"
          unit="pps"
          color="red"
          inExpr={queries.nodes.networkSaturationByPodRx}
          outExpr={queries.nodes.networkSaturationByPodTx}
          inLegend="Rx dropped packets ({{namespace}}/{{pod}})"
          outLegend="Tx dropped packets ({{namespace}}/{{pod}})"
        />
      </div>
    </Stack>
  );
}
