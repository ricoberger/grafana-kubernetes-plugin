import React from 'react';
import { Stack, useStyles2 } from '@grafana/ui';
import { VariableControl } from '@grafana/scenes-react';

import { getStyles } from '../../../utils/utils.styles';
import { queries } from '../queries';
import { TimeSeriesNetwork } from '../shared/TimeSeriesNetwork';

export function PodPageNetwork() {
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
        <TimeSeriesNetwork
          title="Network Bandwidth"
          unit="binBps"
          color="blue"
          rxExpr={queries.pods.networkBandwidthRx}
          txExpr={queries.pods.networkBandwidthTx}
          rxLegend="Rx"
          txLegend="Tx"
        />
        <TimeSeriesNetwork
          title="Network Saturation"
          unit="pps"
          color="red"
          rxExpr={queries.pods.networkSaturationRx}
          txExpr={queries.pods.networkSaturationTx}
          rxLegend="Rx dropped packets"
          txLegend="Tx dropped packets"
        />
      </div>
      <div className={styles.dashboard.row.height400px}>
        <TimeSeriesNetwork
          title="Network Bandwidth by Interface"
          unit="binBps"
          color="blue"
          rxExpr={queries.pods.networkBandwidthByInterfaceRx}
          txExpr={queries.pods.networkBandwidthByInterfaceTx}
          rxLegend="Rx ({{interface}})"
          txLegend="Tx ({{interface}})"
        />
        <TimeSeriesNetwork
          title="Network Saturation by Interface"
          unit="pps"
          color="red"
          rxExpr={queries.pods.networkSaturationByInterfaceRx}
          txExpr={queries.pods.networkSaturationByInterfaceTx}
          rxLegend="Rx dropped packets ({{interface}})"
          txLegend="Tx dropped packets ({{interface}})"
        />
      </div>
    </Stack>
  );
}
