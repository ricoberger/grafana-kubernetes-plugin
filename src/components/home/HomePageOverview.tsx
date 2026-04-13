import { VizConfigBuilders } from '@grafana/scenes';
import {
  useQueryRunner,
  VariableControl,
  VizPanel,
} from '@grafana/scenes-react';
import { LinkButton, RadioButtonGroup, Stack, useStyles2 } from '@grafana/ui';
import React, { useState } from 'react';

import { ROUTES } from '../../constants';
import datasourcePluginJson from '../../datasource/plugin.json';
import { useVizPanelMenu } from '../../hooks/useVizPanelMenu';
import { queries } from '../../utils/utils.queries';
import { prefixRoute } from '../../utils/utils.routing';
import { getStyles } from '../../utils/utils.styles';
import { LegendResourceUsage } from '../shared/LegendResourceUsage';
import { RowCosts } from '../shared/RowCosts';
import { StatWithFixedColorAndLink } from '../shared/StatWithFixedColorAndLink';
import { TableCosts } from '../shared/TableCosts';
import { TableResourceUsage } from '../shared/TableResourceUsage';
import { TimeSeriesMemoryOrCPU } from '../shared/TimeSeriesMemoryOrCPU';

export function HomePageOverview() {
  const styles = useStyles2(getStyles);

  return (
    <Stack direction="column" gap={2}>
      <div className={styles.dashboard.header.container}>
        <VariableControl name="datasource" />
        <div className={styles.dashboard.header.spacer} />
        <LinkButton
          href={prefixRoute(ROUTES.Kubeconfig)}
          size="md"
          variant="secondary"
          fill="outline"
          icon="apps"
        >
          Kubeconfig
        </LinkButton>
      </div>
      <Stack direction="column" gap={2}>
        <div className={styles.dashboard.row.height100px}>
          <StatWithFixedColorAndLink
            title="Nodes"
            expr={queries.nodes.count}
            route={ROUTES.MetricsNodes}
          />
          <StatWithFixedColorAndLink
            title="Namespaces"
            expr={queries.namespaces.count}
            route={ROUTES.MetricsNamespaces}
          />
          <StatWithFixedColorAndLink
            title="Workloads"
            expr={queries.workloads.count}
            route={ROUTES.MetricsWorkloads}
          />
          <StatWithFixedColorAndLink
            title="Pods"
            expr={queries.pods.count}
            route={ROUTES.MetricsPods}
          />
          <StatWithFixedColorAndLink
            title="PersistentVolumeClaims"
            expr={queries.persistentVolumeClaims.count}
            route={ROUTES.MetricsPersistentVolumeClaims}
          />
        </div>
        <div className={styles.dashboard.row.height400px}>
          <TimeSeriesMemoryOrCPU
            title="Cluster CPU"
            unit="cores"
            capacityExpr={queries.cluster.cpuCapacity}
            limitsExpr={queries.cluster.cpuLimits}
            requestsExpr={queries.cluster.cpuRequests}
            usageExpr={queries.cluster.cpuUsage}
          />
          <TimeSeriesMemoryOrCPU
            title="Cluster Memory"
            unit="bytes"
            capacityExpr={queries.cluster.memoryCapacity}
            limitsExpr={queries.cluster.memoryLimits}
            requestsExpr={queries.cluster.memoryRequests}
            usageExpr={queries.cluster.memoryUsage}
          />
        </div>

        <RowCosts
          costsCPUAllocation={queries.cluster.costsCPUAllocation}
          costsMemoryAllocation={queries.cluster.costsMemoryAllocation}
          costsCPUIdle={queries.cluster.costsCPUIdle}
          costsMemoryIdle={queries.cluster.costsMemoryIdle}
        />

        <Nodes />
      </Stack>
    </Stack>
  );
}

function Nodes() {
  const styles = useStyles2(getStyles);
  const [selected, setSelected] = useState('usage');

  return (
    <div className={styles.pluginPage.section}>
      <h4>Nodes</h4>
      <Stack direction="column" gap={2}>
        <div className={styles.dashboard.header.container}>
          <RadioButtonGroup
            options={[
              { label: 'Usage', value: 'usage' },
              { label: 'Cost', value: 'cost' },
              { label: 'Info', value: 'info' },
            ]}
            value={selected}
            onChange={(value) => setSelected(value)}
          />
          <div className={styles.dashboard.header.spacer} />
          {selected === 'usage' && <LegendResourceUsage />}
        </div>
        <div className={styles.dashboard.row.height400px}>
          {selected === 'usage' && (
            <TableResourceUsage
              title="Nodes"
              infoNodeExpr={queries.nodes.info}
              cpuUsageAvgExpr={queries.nodes.cpuUsageAvgOverTime}
              cpuUsageAvgPercentExpr={queries.nodes.cpuUsageAvgPercentOverTime}
              cpuUsageMaxExpr={queries.nodes.cpuUsageMaxOverTime}
              cpuUsageMaxPercentExpr={queries.nodes.cpuUsageMaxPercentOverTime}
              memoryUsageAvgExpr={queries.nodes.memoryUsageAvgOverTime}
              memoryUsageAvgPercentExpr={
                queries.nodes.memoryUsageAvgPercentOverTime
              }
              memoryUsageMaxExpr={queries.nodes.memoryUsageMaxOverTime}
              memoryUsageMaxPercentExpr={
                queries.nodes.memoryUsageMaxPercentOverTime
              }
            />
          )}
          {selected === 'cost' && (
            <TableCosts
              title="Nodes"
              cpuAllocationExpr={queries.nodes.costsCPUAllocation}
              memoryAllocationExpr={queries.nodes.costsMemoryAllocation}
              cpuIdleExpr={queries.nodes.costsCPUIdle}
              memoryIdleExpr={queries.nodes.costsMemoryIdle}
            />
          )}
          {selected === 'info' && <TableKubernetesPods />}
        </div>
      </Stack>
    </div>
  );
}

function TableKubernetesPods() {
  const dataProvider = useQueryRunner({
    datasource: {
      type: datasourcePluginJson.id,
      uid: '$datasource',
    },
    queries: [
      {
        refId: 'A',
        queryType: 'kubernetes-resources',
        resourceId: 'node',
        namespace: '*',
      },
    ],
  });

  const viz = VizConfigBuilders.table().build();

  const menu = useVizPanelMenu({
    data: dataProvider.useState(),
    viz,
  });

  return (
    <VizPanel title="Nodes" menu={menu} viz={viz} dataProvider={dataProvider} />
  );
}
