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
import { Tab, TabsBar, useStyles2 } from '@grafana/ui';
import React, { useState } from 'react';

import datasourcePluginJson from '../../datasource/plugin.json';
import pluginJson from '../../plugin.json';
import { getStyles } from '../../utils/utils.styles';
import { HomePageCost } from './HomePageCost';
import { HomePageOverview } from './HomePageOverview';

export function HomePage() {
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
                query=".+"
                initialValue=".+"
                hide={VariableHide.hideVariable}
              >
                <CustomVariable
                  skipUrlSync={true}
                  name="workloadtype"
                  label="Workload Type"
                  query=".+"
                  initialValue=".+"
                  hide={VariableHide.hideVariable}
                >
                  <CustomVariable
                    skipUrlSync={true}
                    name="workload"
                    label="Workload"
                    query=".+"
                    initialValue=".+"
                    hide={VariableHide.hideVariable}
                  >
                    <PluginPage
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

                      {activeTab === 'overview' && <HomePageOverview />}
                      {activeTab === 'cost' && <HomePageCost />}
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
