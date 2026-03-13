import React from 'react';
import { Stack, useStyles2 } from '@grafana/ui';
import { VariableControl } from '@grafana/scenes-react';

import { getStyles } from '../../../utils/utils.styles';
import { queries } from '../queries';
import { TimeSeriesNetwork } from '../shared/TimeSeriesNetwork';

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
        <TimeSeriesNetwork
          title="Network Bandwidth"
          unit="binBps"
          color="blue"
          rxExpr={queries.nodes.networkBandwidthRx}
          txExpr={queries.nodes.networkBandwidthTx}
          rxLegend="Rx"
          txLegend="Tx"
        />
        <TimeSeriesNetwork
          title="Network Saturation"
          unit="pps"
          color="red"
          rxExpr={queries.nodes.networkSaturationRx}
          txExpr={queries.nodes.networkSaturationTx}
          rxLegend="Rx dropped packets"
          txLegend="Tx dropped packets"
        />
      </div>
      <div className={styles.dashboard.row.height400px}>
        <TimeSeriesNetwork
          title="Network Bandwidth by Pod"
          unit="binBps"
          color="blue"
          rxExpr={queries.nodes.networkBandwidthByPodRx}
          txExpr={queries.nodes.networkBandwidthByPodTx}
          rxLegend="Rx ({{namespace}}/{{pod}})"
          txLegend="Tx ({{namespace}}/{{pod}})"
        />
        <TimeSeriesNetwork
          title="Network Saturation by Pod"
          unit="pps"
          color="red"
          rxExpr={queries.nodes.networkSaturationByPodRx}
          txExpr={queries.nodes.networkSaturationByPodTx}
          rxLegend="Rx dropped packets ({{namespace}}/{{pod}})"
          txLegend="Tx dropped packets ({{namespace}}/{{pod}})"
        />
      </div>
    </Stack>
  );
}
