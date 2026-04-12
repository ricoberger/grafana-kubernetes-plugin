import { VariableHide, VariableRefresh, VariableSort } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import {
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
import { NodePageCPU } from './NodePageCPU';
import { NodePageMemory } from './NodePageMemory';
import { NodePageNetwork } from './NodePageNetwork';
import { NodePageOverview } from './NodePageOverview';
import { NodePageStorage } from './NodePageStorage';

export function NodePage() {
  const styles = useStyles2(getStyles);
  const { node } = useParams<{ node: string }>();
  const [activeTab, setActiveTab] = useState('overview');

  if (!node) {
    return <Alert title="Node not found" severity="error" />;
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
                query={node}
                initialValue={node}
                hide={VariableHide.hideVariable}
              >
                <CustomVariable
                  name="namespace"
                  label="Namespace"
                  query=".+"
                  initialValue=".+"
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
                      query: variableQuery(queries.pods.labelsByClusterNode),
                    }}
                    refresh={VariableRefresh.onTimeRangeChanged}
                    isMulti={true}
                    includeAll={true}
                    initialValue={'$__all'}
                    sort={VariableSort.alphabeticalCaseInsensitiveAsc}
                  >
                    <PluginPage
                      pageNav={{
                        text: node,
                        parentItem: {
                          text: 'Nodes',
                          url: prefixRoute(ROUTES.MetricsNodes),
                        },
                      }}
                      renderTitle={() => (
                        <Stack gap={0} alignItems="center" direction="row">
                          <img
                            className={styles.pluginPage.title.image}
                            alt={node}
                            src={resourcesImg}
                          />
                          <h1>{node}</h1>
                          <Badge
                            className={styles.pluginPage.title.badge}
                            color="blue"
                            text="node"
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
                          resource="node"
                          active={activeTab === 'logs'}
                          onChangeTab={(ev) => {
                            ev?.preventDefault();
                            setActiveTab('logs');
                          }}
                        />
                      </TabsBar>
                      {activeTab === 'overview' && <NodePageOverview />}
                      {activeTab === 'cpu' && <NodePageCPU />}
                      {activeTab === 'memory' && <NodePageMemory />}
                      {activeTab === 'network' && <NodePageNetwork />}
                      {activeTab === 'storage' && <NodePageStorage />}
                      {activeTab === 'logs' && (
                        <TabLogsContent page="node" resource="node" />
                      )}
                    </PluginPage>
                  </QueryVariable>
                </CustomVariable>
              </CustomVariable>
            </QueryVariable>
          </QueryVariable>
        </QueryVariable>
      </DataSourceVariable>
    </SceneContextProvider>
  );
}
