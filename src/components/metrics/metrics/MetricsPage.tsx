import { VariableHide, VariableRefresh } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import {
  CustomVariable,
  DataSourceVariable,
  QueryVariable,
  RefreshPicker,
  SceneContextProvider,
  TimeRangePicker,
} from '@grafana/scenes-react';
import { Stack, Tab, TabsBar, useStyles2 } from '@grafana/ui';
import React, { useState } from 'react';

import datasourcePluginJson from '../../../datasource/plugin.json';
import resourcesImg from '../../../img/logo.svg';
import pluginJson from '../../../plugin.json';
import { getStyles } from '../../../utils/utils.styles';
import { MetricsPageCost } from './MetricsPageCost';
import { MetricsPageOverview } from './MetricsPageOverview';

export function MetricsPage() {
  const styles = useStyles2(getStyles);
  const [activeTab, setActiveTab] = useState('overview');

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
                query=".+"
                initialValue=".+"
                hide={VariableHide.hideVariable}
              >
                <CustomVariable
                  name="workloadtype"
                  label="Workload Type"
                  query=".+"
                  initialValue=".+"
                  hide={VariableHide.hideVariable}
                >
                  <CustomVariable
                    name="workload"
                    label="Workload"
                    query=".+"
                    initialValue=".+"
                    hide={VariableHide.hideVariable}
                  >
                    <PluginPage
                      renderTitle={() => (
                        <Stack gap={0} alignItems="center" direction="row">
                          <img
                            className={styles.pluginPage.title.image}
                            alt="Metrics"
                            src={resourcesImg}
                          />
                          <h1>Metrics</h1>
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
                          label="Cost"
                          active={activeTab === 'cost'}
                          onChangeTab={(ev) => {
                            ev?.preventDefault();
                            setActiveTab('cost');
                          }}
                        />
                      </TabsBar>

                      {activeTab === 'overview' && <MetricsPageOverview />}
                      {activeTab === 'cost' && <MetricsPageCost />}
                    </PluginPage>
                  </CustomVariable>
                </CustomVariable>
              </CustomVariable>
            </CustomVariable>
          </QueryVariable>
        </QueryVariable>
      </DataSourceVariable>
    </SceneContextProvider>
  );
}
