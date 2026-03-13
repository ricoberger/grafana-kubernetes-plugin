import React from 'react';
import { Stack, useStyles2 } from '@grafana/ui';
import { VariableControl } from '@grafana/scenes-react';

import { getStyles } from '../../../utils/utils.styles';
import { queries } from '../queries';
import { TimeSeriesNetwork } from '../shared/TimeSeriesNetwork';

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
        <TimeSeriesNetwork
          title="Network Bandwidth"
          unit="binBps"
          color="blue"
          rxExpr={queries.namespaces.networkBandwidthRx}
          txExpr={queries.namespaces.networkBandwidthTx}
          rxLegend="Rx"
          txLegend="Tx"
        />
        <TimeSeriesNetwork
          title="Network Saturation"
          unit="pps"
          color="red"
          rxExpr={queries.namespaces.networkSaturationRx}
          txExpr={queries.namespaces.networkSaturationTx}
          rxLegend="Rx dropped packets"
          txLegend="Tx dropped packets"
        />
      </div>
      <div className={styles.dashboard.row.height400px}>
        <TimeSeriesNetwork
          title="Network Bandwidth by Workload"
          unit="binBps"
          color="blue"
          rxExpr={queries.namespaces.networkBandwidthByWorkloadRx}
          txExpr={queries.namespaces.networkBandwidthByWorkloadTx}
          rxLegend="Rx ({{workload_type}}/{{workload}})"
          txLegend="Tx ({{workload_type}}/{{workload}})"
        />
        <TimeSeriesNetwork
          title="Network Saturation by Workload"
          unit="pps"
          color="red"
          rxExpr={queries.namespaces.networkSaturationByWorkloadRx}
          txExpr={queries.namespaces.networkSaturationByWorkloadTx}
          rxLegend="Rx dropped packets ({{workload_type}}/{{workload}})"
          txLegend="Tx dropped packets ({{workload_type}}/{{workload}})"
        />
      </div>
    </Stack>
  );
}
