import React from 'react';
import { Stack, useStyles2 } from '@grafana/ui';
import { DataLayerControl, VariableControl } from '@grafana/scenes-react';

import { getStyles } from '../../../utils/utils.styles';
import { queries } from '../queries';
import { TimeSeriesIO } from '../shared/TimeSeriesIO';

export function PodPageNetwork() {
  const styles = useStyles2(getStyles);

  return (
    <Stack direction="column" gap={2}>
      <div className={styles.dashboard.header.container}>
        <VariableControl name="datasource" />
        <VariableControl name="prometheus" />
        <VariableControl name="cluster" />
        <VariableControl name="namespace" />
        <DataLayerControl name="Restarts" />
        <div className={styles.dashboard.header.spacer} />
      </div>

      <div className={styles.dashboard.row.height400px}>
        <TimeSeriesIO
          title="Network Bandwidth"
          unit="binBps"
          color="blue"
          inExpr={queries.pods.networkBandwidthRx}
          outExpr={queries.pods.networkBandwidthTx}
          inLegend="Rx"
          outLegend="Tx"
        />
        <TimeSeriesIO
          title="Network Saturation"
          unit="pps"
          color="red"
          inExpr={queries.pods.networkSaturationRx}
          outExpr={queries.pods.networkSaturationTx}
          inLegend="Rx dropped packets"
          outLegend="Tx dropped packets"
        />
      </div>
      <div className={styles.dashboard.row.height400px}>
        <TimeSeriesIO
          title="Network Bandwidth by Interface"
          unit="binBps"
          color="blue"
          inExpr={queries.pods.networkBandwidthByInterfaceRx}
          outExpr={queries.pods.networkBandwidthByInterfaceTx}
          inLegend="Rx ({{interface}})"
          outLegend="Tx ({{interface}})"
        />
        <TimeSeriesIO
          title="Network Saturation by Interface"
          unit="pps"
          color="red"
          inExpr={queries.pods.networkSaturationByInterfaceRx}
          outExpr={queries.pods.networkSaturationByInterfaceTx}
          inLegend="Rx dropped packets ({{interface}})"
          outLegend="Tx dropped packets ({{interface}})"
        />
      </div>
    </Stack>
  );
}
