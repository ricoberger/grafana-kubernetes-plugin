import { VariableHide, VariableRefresh, VariableSort } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import {
  AnnotationLayer,
  CustomVariable,
  DataSourceVariable,
  QueryVariable,
  RefreshPicker,
  SceneContextProvider,
  TimeRangePicker,
} from '@grafana/scenes-react';
import { Alert, Badge, Stack, Tab, TabsBar, useStyles2 } from '@grafana/ui';
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

import { ROUTES } from '../../../constants';
import datasourcePluginJson from '../../../datasource/plugin.json';
import resourcesImg from '../../../img/logo.svg';
import pluginJson from '../../../plugin.json';
import { prefixRoute } from '../../../utils/utils.routing';
import { getStyles } from '../../../utils/utils.styles';
import { queries, variableQuery } from '../queries';
import { TabLogs } from '../shared/TabLogs';
import { TabLogsContent } from '../shared/TabLogsContent';
import { WorkloadPageCPU } from './WorkloadPageCPU';
import { WorkloadPageMemory } from './WorkloadPageMemory';
import { WorkloadPageNetwork } from './WorkloadPageNetwork';
import { WorkloadPageOverview } from './WorkloadPageOverview';
import { WorkloadPageStorage } from './WorkloadPageStorage';

export function WorkloadPage() {
  const styles = useStyles2(getStyles);
  const { namespace, workloadType, workload } = useParams<{
    namespace: string;
    workloadType: string;
    workload: string;
  }>();
  const [activeTab, setActiveTab] = useState('overview');

  if (!namespace) {
    return <Alert title="Namespace not found" severity="error" />;
  }

  if (!workloadType) {
    return <Alert title="Workload type not found" severity="error" />;
  }

  if (!workload) {
    return <Alert title="Workload not found" severity="error" />;
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
        hide={VariableHide.hideVariable}
        refresh={VariableRefresh.onDashboardLoad}
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
            <QueryVariable
              name="logs"
              label="Logs"
              datasource={{ type: datasourcePluginJson.id, uid: '$datasource' }}
              query={{
                refId: 'settings',
                queryType: 'settings',
                setting: 'integrationsMetricsLogs',
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
                    name="workloadtype"
                    label="Workload Type"
                    query={workloadType}
                    initialValue={workloadType}
                    hide={VariableHide.hideVariable}
                  >
                    <CustomVariable
                      name="workload"
                      label="Workload"
                      query={workload.toLowerCase()}
                      initialValue={workload.toLowerCase()}
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
                            queries.pods.labelsByClusterNamespaceWorkload,
                          ),
                        }}
                        refresh={VariableRefresh.onTimeRangeChanged}
                        isMulti={true}
                        includeAll={true}
                        initialValue={'$__all'}
                        sort={VariableSort.alphabeticalCaseInsensitiveAsc}
                      >
                        <QueryVariable
                          name="pvc"
                          label="PersistentVolumeClaim"
                          datasource={{
                            type: 'prometheus',
                            uid: '$prometheus',
                          }}
                          query={{
                            refId: 'pvcs',
                            query: variableQuery(
                              queries.persistentVolumeClaims
                                .labelsByClusterNamespacePod,
                            ),
                          }}
                          refresh={VariableRefresh.onTimeRangeChanged}
                          isMulti={true}
                          includeAll={true}
                          initialValue={'$__all'}
                          sort={VariableSort.alphabeticalCaseInsensitiveAsc}
                        >
                          <AnnotationLayer
                            name="Restarts"
                            query={{
                              datasource: {
                                type: 'prometheus',
                                uid: '$prometheus',
                              },
                              enable: true,
                              iconColor: 'orange',
                              name: 'Restarts',
                              textFormat: '{{pod}} restarted',
                              target: {
                                // @ts-ignore
                                expr: queries.pods.restarts,
                                limit: 100,
                                matchAny: false,
                                refId: 'Anno',
                                type: 'dashboard',
                              },
                            }}
                          >
                            <PluginPage
                              pageNav={{
                                text: workload,
                                parentItem: {
                                  text: namespace,
                                  url: `${prefixRoute(ROUTES.MetricsNamespaces)}/${namespace}`,
                                  parentItem: {
                                    text: 'Workloads',
                                    url: prefixRoute(ROUTES.MetricsWorkloads),
                                  },
                                },
                              }}
                              renderTitle={() => (
                                <Stack
                                  gap={0}
                                  alignItems="center"
                                  direction="row"
                                >
                                  <img
                                    className={styles.pluginPage.title.image}
                                    alt={workload}
                                    src={resourcesImg}
                                  />
                                  <h1>{workload}</h1>
                                  <Badge
                                    className={styles.pluginPage.title.badge}
                                    color="blue"
                                    text={workloadType.toLowerCase()}
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
                              <TabsBar className={styles.dashboard.tabsBar}>
                                <Tab
                                  label="Overview"
                                  active={activeTab === 'overview'}
                                  onChangeTab={(ev) => {
                                    ev?.preventDefault();
                                    setActiveTab('overview');
                                  }}
                                />
                                <Tab
                                  label="CPU"
                                  active={activeTab === 'cpu'}
                                  onChangeTab={(ev) => {
                                    ev?.preventDefault();
                                    setActiveTab('cpu');
                                  }}
                                />
                                <Tab
                                  label="Memory"
                                  active={activeTab === 'memory'}
                                  onChangeTab={(ev) => {
                                    ev?.preventDefault();
                                    setActiveTab('memory');
                                  }}
                                />
                                <Tab
                                  label="Network"
                                  active={activeTab === 'network'}
                                  onChangeTab={(ev) => {
                                    ev?.preventDefault();
                                    setActiveTab('network');
                                  }}
                                />
                                <Tab
                                  label="Storage"
                                  active={activeTab === 'storage'}
                                  onChangeTab={(ev) => {
                                    ev?.preventDefault();
                                    setActiveTab('storage');
                                  }}
                                />
                                <TabLogs
                                  resource={workloadType}
                                  active={activeTab === 'logs'}
                                  onChangeTab={(ev) => {
                                    ev?.preventDefault();
                                    setActiveTab('logs');
                                  }}
                                />
                              </TabsBar>
                              {activeTab === 'overview' && (
                                <WorkloadPageOverview
                                  workloadType={workloadType.toLowerCase()}
                                />
                              )}
                              {activeTab === 'cpu' && <WorkloadPageCPU />}
                              {activeTab === 'memory' && <WorkloadPageMemory />}
                              {activeTab === 'network' && (
                                <WorkloadPageNetwork />
                              )}
                              {activeTab === 'storage' && (
                                <WorkloadPageStorage />
                              )}
                              {activeTab === 'logs' && (
                                <TabLogsContent
                                  page="workload"
                                  resource={workloadType}
                                />
                              )}
                            </PluginPage>
                          </AnnotationLayer>
                        </QueryVariable>
                      </QueryVariable>
                    </CustomVariable>
                  </CustomVariable>
                </CustomVariable>
              </CustomVariable>
            </QueryVariable>
          </QueryVariable>
        </QueryVariable>
      </DataSourceVariable>
    </SceneContextProvider>
  );
}
