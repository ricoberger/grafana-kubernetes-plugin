import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { VariableHide, VariableRefresh } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Alert, Badge, RadioButtonGroup, Stack, useStyles2 } from '@grafana/ui';
import {
  SceneContextProvider,
  DataSourceVariable,
  QueryVariable,
  VariableControl,
  TimeRangePicker,
  RefreshPicker,
  CustomVariable,
  useQueryRunner,
  VizPanel,
} from '@grafana/scenes-react';
import { VizConfigBuilders } from '@grafana/scenes';

import pluginJson from '../../../plugin.json';
import datasourcePluginJson from '../../../datasource/plugin.json';
import resourcesImg from '../../../img/logo.svg';
import { getStyles } from '../../../utils/utils.styles';
import { queries, variableQuery } from '../queries';
import { prefixRoute } from '../../../utils/utils.routing';
import { ROUTES } from '../../../constants';
import { TimeSeriesMemoryOrCPU } from '../shared/TimeSeriesMemoryOrCPU';
import { TimeSeriesMemoryOrCPUDistribution } from '../shared/TimeSeriesMemoryOrCPUDistribution';
import { TableKubernetesResource } from '../shared/TableKubernetesResource';
import { TableResourceUsage } from '../shared/TableResourceUsage';
import { useVizPanelMenu } from '../../../hooks/useVizPanelMenu';

export function PersistentVolumeClaimPage() {
  const styles = useStyles2(getStyles);
  const { namespace, pvc } = useParams<{
    namespace: string;
    pvc: string;
  }>();

  if (!namespace) {
    return <Alert title="Namespace not found" severity="error" />;
  }

  if (!pvc) {
    return <Alert title="PersistentVolumeClaim not found" severity="error" />;
  }

  return (
    <SceneContextProvider
      timeRange={{ from: `now-1h`, to: 'now' }}
      withQueryController
    >
      <DataSourceVariable
        name="datasource"
        label="Cluster"
        pluginId={datasourcePluginJson.id}
        refresh={VariableRefresh.onDashboardLoad}
        hide={VariableHide.hideVariable}
      >
        <QueryVariable
          name="prometheus"
          label="Prometheus"
          datasource={{ type: datasourcePluginJson.id, uid: '$datasource' }}
          query={{
            refId: 'settings',
            queryType: 'settings',
            setting: 'integrationsMetricsDatasourceUid',
            variableField: 'values',
          }}
          refresh={VariableRefresh.onDashboardLoad}
          hide={VariableHide.hideVariable}
        >
          <QueryVariable
            name="cluster"
            label="Cluster Label"
            datasource={{ type: datasourcePluginJson.id, uid: '$datasource' }}
            query={{
              refId: 'settings',
              queryType: 'settings',
              setting: 'integrationsMetricsClusterLabel',
              variableField: 'values',
            }}
            refresh={VariableRefresh.onDashboardLoad}
            hide={VariableHide.hideVariable}
          >
            <CustomVariable
              name="node"
              label="Node"
              query=".+"
              initialValue=".+"
              hide={VariableHide.hideVariable}
            >
              <CustomVariable
                name="namespace"
                label="Namespace"
                query={namespace}
                initialValue={namespace}
                hide={VariableHide.hideVariable}
              >
                <CustomVariable
                  name="pvc"
                  label="PersistentVolumeClaim"
                  query={pvc}
                  initialValue={pvc}
                  hide={VariableHide.hideVariable}
                >
                  <QueryVariable
                    name="pod"
                    label="Pod"
                    datasource={{
                      type: 'prometheus',
                      uid: '$prometheus',
                    }}
                    query={{
                      refId: 'pods',
                      query: variableQuery(
                        queries.persistentVolumeClaims
                          .labelsPodsByClusterNamespacePersistentVolumeClaim,
                      ),
                    }}
                    refresh={VariableRefresh.onTimeRangeChanged}
                    isMulti={true}
                    includeAll={true}
                    initialValue={'$__all'}
                    hide={VariableHide.hideVariable}
                  >
                    <PluginPage
                      pageNav={{
                        text: pvc,
                        parentItem: {
                          text: namespace,
                          url: prefixRoute(ROUTES.MetricsNamespaces),
                          parentItem: {
                            text: 'PersistentVolumeClaims',
                            url: prefixRoute(
                              ROUTES.MetricsPersistentVolumeClaims,
                            ),
                          },
                        },
                      }}
                      renderTitle={() => (
                        <Stack gap={0} alignItems="center" direction="row">
                          <img
                            className={styles.pluginPage.title.image}
                            alt={pvc}
                            src={resourcesImg}
                          />
                          <h1>{pvc}</h1>
                          <Badge
                            className={styles.pluginPage.title.badge}
                            color="blue"
                            text="persistentvolumeclaim"
                          />
                        </Stack>
                      )}
                      subTitle={pluginJson.info.description}
                      actions={
                        <>
                          <TimeRangePicker />
                          <RefreshPicker />
                        </>
                      }
                    >
                      <Stack direction="column" gap={2}>
                        <div className={styles.dashboard.header.container}>
                          <VariableControl name="datasource" />
                          <VariableControl name="prometheus" />
                          <VariableControl name="cluster" />
                          <VariableControl name="namespace" />
                          <VariableControl name="pvc" />
                          <div className={styles.dashboard.header.spacer} />
                        </div>

                        <TableKubernetesResource resource="persistentvolumeclaim" />

                        <div className={styles.dashboard.row.height400px}>
                          <TimeSeriesMemoryOrCPU
                            title="Volume Bytes"
                            unit="bytes"
                            capacityExpr={
                              queries.persistentVolumeClaims.capacity
                            }
                            requestsExpr={
                              queries.persistentVolumeClaims.requested
                            }
                            usageExpr={queries.persistentVolumeClaims.used}
                          />
                          <TimeSeriesMemoryOrCPU
                            title="Volume inodes"
                            unit="short"
                            capacityExpr={
                              queries.persistentVolumeClaims.inodesCapacity
                            }
                            usageExpr={
                              queries.persistentVolumeClaims.inodesUsed
                            }
                          />
                        </div>

                        <div className={styles.dashboard.row.height400px}>
                          <TimeSeriesMemoryOrCPUDistribution
                            title="Hourly Volume Usage Rate"
                            unit="binBps"
                            expr={
                              queries.persistentVolumeClaims.hourlyUsageRage
                            }
                            legend="{{ persistentvolumeclaim }}"
                          />
                          <TimeSeriesMemoryOrCPUDistribution
                            title="Daily Volume Usage Rate"
                            unit="binBps"
                            expr={queries.persistentVolumeClaims.dailyUsageRage}
                            legend="{{ persistentvolumeclaim }}"
                          />
                          <TimeSeriesMemoryOrCPUDistribution
                            title="Weekly Volume Usage Rate"
                            unit="binBps"
                            expr={
                              queries.persistentVolumeClaims.weeklyUsageRage
                            }
                            legend="{{ persistentvolumeclaim }}"
                          />
                        </div>

                        <Pods />
                      </Stack>
                    </PluginPage>
                  </QueryVariable>
                </CustomVariable>
              </CustomVariable>
            </CustomVariable>
          </QueryVariable>
        </QueryVariable>
      </DataSourceVariable>
    </SceneContextProvider>
  );
}

function Pods() {
  const styles = useStyles2(getStyles);
  const [selected, setSelected] = useState('usage');

  return (
    <div className={styles.pluginPage.section}>
      <h4>Pods</h4>
      <Stack direction="column" gap={2}>
        <div className={styles.dashboard.header.container}>
          <RadioButtonGroup
            options={[
              { label: 'Usage', value: 'usage' },
              { label: 'Info', value: 'info' },
            ]}
            value={selected}
            onChange={(value) => setSelected(value)}
          />
          <div className={styles.dashboard.header.spacer} />
        </div>
        <div className={styles.dashboard.row.height400px}>
          {selected === 'usage' && (
            <TableResourceUsage
              title="Pods"
              infoPodExpr={queries.pods.info}
              cpuUsageAvgExpr={queries.pods.cpuUsageAvgOverTime}
              cpuUsageAvgPercentExpr={queries.pods.cpuUsageAvgPercentOverTime}
              cpuUsageMaxExpr={queries.pods.cpuUsageMaxOverTime}
              cpuUsageMaxPercentExpr={queries.pods.cpuUsageMaxPercentOverTime}
              memoryUsageAvgExpr={queries.pods.memoryUsageAvgOverTime}
              memoryUsageAvgPercentExpr={
                queries.pods.memoryUsageAvgPercentOverTime
              }
              memoryUsageMaxExpr={queries.pods.memoryUsageMaxOverTime}
              memoryUsageMaxPercentExpr={
                queries.pods.memoryUsageMaxPercentOverTime
              }
              alertsExpr={queries.pods.alertsCount}
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
        resourceId: 'pod',
        namespace: '$namespace',
        parameterName: 'regex',
        parameterValue: '${pod:regex}',
      },
    ],
  });

  const viz = VizConfigBuilders.table().build();

  const menu = useVizPanelMenu({
    data: dataProvider.useState(),
    viz,
  });

  return (
    <VizPanel title="Pods" menu={menu} viz={viz} dataProvider={dataProvider} />
  );
}
