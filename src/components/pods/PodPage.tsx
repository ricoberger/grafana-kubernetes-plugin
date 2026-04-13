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

import { ROUTES } from '../../constants';
import datasourcePluginJson from '../../datasource/plugin.json';
import resourcesImg from '../../img/logo.svg';
import pluginJson from '../../plugin.json';
import { queries, variableQuery } from '../../utils/utils.queries';
import { prefixRoute } from '../../utils/utils.routing';
import { getStyles } from '../../utils/utils.styles';
import { TabLogs } from '../shared/TabLogs';
import { TabLogsContent } from '../shared/TabLogsContent';
import { PodPageCPU } from './PodPageCPU';
import { PodPageMemory } from './PodPageMemory';
import { PodPageNetwork } from './PodPageNetwork';
import { PodPageOverview } from './PodPageOverview';
import { PodPageStorage } from './PodPageStorage';

export function PodPage() {
  const styles = useStyles2(getStyles);
  const { namespace, pod } = useParams<{ namespace: string; pod: string }>();
  const [activeTab, setActiveTab] = useState('overview');

  if (!namespace) {
    return <Alert title="Namespace not found" severity="error" />;
  }

  if (!pod) {
    return <Alert title="Pod not found" severity="error" />;
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
          skipUrlSync={true}
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
            skipUrlSync={true}
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
              skipUrlSync={true}
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
                skipUrlSync={true}
                name="node"
                label="Node"
                query=".+"
                initialValue=".+"
                hide={VariableHide.hideVariable}
              >
                <CustomVariable
                  skipUrlSync={true}
                  name="namespace"
                  label="Namespace"
                  query={namespace}
                  initialValue={namespace}
                  hide={VariableHide.hideVariable}
                >
                  <CustomVariable
                    skipUrlSync={true}
                    name="pod"
                    label="Pod"
                    query={pod}
                    initialValue={pod}
                    hide={VariableHide.hideVariable}
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
                            text: pod,
                            parentItem: {
                              text: namespace,
                              url: `${prefixRoute(ROUTES.MetricsNamespaces)}/${namespace}`,
                              parentItem: {
                                text: 'Pods',
                                url: prefixRoute(ROUTES.MetricsPods),
                              },
                            },
                          }}
                          renderTitle={() => (
                            <Stack gap={0} alignItems="center" direction="row">
                              <img
                                className={styles.pluginPage.title.image}
                                alt={pod}
                                src={resourcesImg}
                              />
                              <h1>{pod}</h1>
                              <Badge
                                className={styles.pluginPage.title.badge}
                                color="blue"
                                text="pod"
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
                              resource="pod"
                              active={activeTab === 'logs'}
                              onChangeTab={(ev) => {
                                ev?.preventDefault();
                                setActiveTab('logs');
                              }}
                            />
                          </TabsBar>
                          {activeTab === 'overview' && <PodPageOverview />}
                          {activeTab === 'cpu' && <PodPageCPU />}
                          {activeTab === 'memory' && <PodPageMemory />}
                          {activeTab === 'network' && <PodPageNetwork />}
                          {activeTab === 'storage' && <PodPageStorage />}
                          {activeTab === 'logs' && (
                            <TabLogsContent page="pod" resource="pod" />
                          )}
                        </PluginPage>
                      </AnnotationLayer>
                    </QueryVariable>
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
