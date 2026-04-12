import { DataLayerControl, VariableControl } from '@grafana/scenes-react';
import { Stack, useStyles2 } from '@grafana/ui';
import React from 'react';

import { getStyles } from '../../../utils/utils.styles';
import { queries } from '../queries';
import { TimeSeriesIO } from '../shared/TimeSeriesIO';

export function WorkloadPageNetwork() {
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
        <DataLayerControl name="Restarts" />
        <div className={styles.dashboard.header.spacer} />
      </div>

      <div className={styles.dashboard.row.height400px}>
        <TimeSeriesIO
          title="Network Bandwidth"
          unit="binBps"
          color="blue"
          inExpr={queries.workloads.networkBandwidthRx}
          outExpr={queries.workloads.networkBandwidthTx}
          inLegend="Rx"
          outLegend="Tx"
        />
        <TimeSeriesIO
          title="Network Saturation"
          unit="pps"
          color="red"
          inExpr={queries.workloads.networkSaturationRx}
          outExpr={queries.workloads.networkSaturationTx}
          inLegend="Rx dropped packets"
          outLegend="Tx dropped packets"
        />
      </div>
      <div className={styles.dashboard.row.height400px}>
        <TimeSeriesIO
          title="Network Bandwidth by Pod"
          unit="binBps"
          color="blue"
          inExpr={queries.workloads.networkBandwidthByPodRx}
          outExpr={queries.workloads.networkBandwidthByPodTx}
          inLegend="Rx ({{pod}})"
          outLegend="Tx ({{pod}})"
        />
        <TimeSeriesIO
          title="Network Saturation by Pod"
          unit="pps"
          color="red"
          inExpr={queries.workloads.networkSaturationByPodRx}
          outExpr={queries.workloads.networkSaturationByPodTx}
          inLegend="Rx dropped packets ({{pod}})"
          outLegend="Tx dropped packets ({{pod}})"
        />
      </div>
    </Stack>
  );
}
