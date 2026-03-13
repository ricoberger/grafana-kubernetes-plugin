import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { VariableHide, VariableRefresh, VariableSort } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Alert, Badge, Stack, Tab, TabsBar, useStyles2 } from '@grafana/ui';
import {
  SceneContextProvider,
  DataSourceVariable,
  QueryVariable,
  TimeRangePicker,
  RefreshPicker,
  CustomVariable,
} from '@grafana/scenes-react';

import pluginJson from '../../../plugin.json';
import resourcesImg from '../../../img/logo.svg';
import { getStyles } from '../../../utils/utils.styles';
import datasourcePluginJson from '../../../datasource/plugin.json';
import { queries, variableQuery } from '../queries';
import { NamespacePageOverview } from './NamespacePageOverview';
import { NamespacePageCPU } from './NamespacePageCPU';
import { NamespacePageMemory } from './NamespacePageMemory';

export function NamespacePage() {
  const styles = useStyles2(getStyles);
  const { namespace } = useParams<{ namespace: string }>();
  const [activeTab, setActiveTab] = useState('overview');

  if (!namespace) {
    return <Alert title="Namespace not found" severity="error" />;
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
              name="namespace"
              label="Namespace"
              query={namespace}
              initialValue={namespace}
              hide={VariableHide.hideVariable}
            >
              <QueryVariable
                name="workload"
                label="Workload"
                datasource={{
                  type: 'prometheus',
                  uid: '$prometheus',
                }}
                query={{
                  refId: 'workloads',
                  query: variableQuery(
                    queries.workloads.labelsByClusterNamespace,
                  ),
                }}
                refresh={VariableRefresh.onTimeRangeChanged}
                isMulti={true}
                includeAll={true}
                initialValue={'$__all'}
                allValue=".+"
                regex={`/workload="(?<value>[^"]+)/`}
                sort={VariableSort.alphabeticalCaseInsensitiveAsc}
              >
                <PluginPage
                  renderTitle={() => (
                    <Stack gap={0} alignItems="center" direction="row">
                      <img
                        className={styles.pluginPage.title.image}
                        alt={namespace}
                        src={resourcesImg}
                      />
                      <h1>{namespace}</h1>
                      <Badge
                        className={styles.pluginPage.title.badge}
                        color="blue"
                        text="namespace"
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
                  </TabsBar>
                  {activeTab === 'overview' && <NamespacePageOverview />}
                  {activeTab === 'cpu' && <NamespacePageCPU />}
                  {activeTab === 'memory' && <NamespacePageMemory />}
                </PluginPage>
              </QueryVariable>
            </CustomVariable>
          </QueryVariable>
        </QueryVariable>
      </DataSourceVariable>
    </SceneContextProvider>
  );
}
