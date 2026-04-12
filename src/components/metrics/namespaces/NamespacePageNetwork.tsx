import { VariableControl } from '@grafana/scenes-react';
import { Stack, useStyles2 } from '@grafana/ui';
import React from 'react';

import { getStyles } from '../../../utils/utils.styles';
import { queries } from '../queries';
import { TimeSeriesIO } from '../shared/TimeSeriesIO';

export function NamespacePageNetwork() {
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
          title="Network Bandwidth"
          unit="binBps"
          color="blue"
          inExpr={queries.namespaces.networkBandwidthRx}
          outExpr={queries.namespaces.networkBandwidthTx}
          inLegend="Rx"
          outLegend="Tx"
        />
        <TimeSeriesIO
          title="Network Saturation"
          unit="pps"
          color="red"
          inExpr={queries.namespaces.networkSaturationRx}
          outExpr={queries.namespaces.networkSaturationTx}
          inLegend="Rx dropped packets"
          outLegend="Tx dropped packets"
        />
      </div>
      <div className={styles.dashboard.row.height400px}>
        <TimeSeriesIO
          title="Network Bandwidth by Workload"
          unit="binBps"
          color="blue"
          inExpr={queries.namespaces.networkBandwidthByWorkloadRx}
          outExpr={queries.namespaces.networkBandwidthByWorkloadTx}
          inLegend="Rx ({{workload_type}}/{{workload}})"
          outLegend="Tx ({{workload_type}}/{{workload}})"
        />
        <TimeSeriesIO
          title="Network Saturation by Workload"
          unit="pps"
          color="red"
          inExpr={queries.namespaces.networkSaturationByWorkloadRx}
          outExpr={queries.namespaces.networkSaturationByWorkloadTx}
          inLegend="Rx dropped packets ({{workload_type}}/{{workload}})"
          outLegend="Tx dropped packets ({{workload_type}}/{{workload}})"
        />
      </div>
    </Stack>
  );
}
