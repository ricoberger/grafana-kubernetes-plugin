import React, { useState } from 'react';
import { VariableHide, VariableRefresh, VariableSort } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Stack, Tab, TabsBar, useStyles2 } from '@grafana/ui';
import {
  SceneContextProvider,
  DataSourceVariable,
  QueryVariable,
  TimeRangePicker,
  RefreshPicker,
} from '@grafana/scenes-react';

import pluginJson from '../../../plugin.json';
import resourcesImg from '../../../img/logo.svg';
import { getStyles } from '../../../utils/utils.styles';
import datasourcePluginJson from '../../../datasource/plugin.json';
import { queries, variableQuery } from '../queries';
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
            <QueryVariable
              name="namespace"
              label="Namespace"
              datasource={{
                type: 'prometheus',
                uid: '$prometheus',
              }}
              query={{
                refId: 'namespaces',
                query: variableQuery(queries.namespaces.labelsByCluster),
              }}
              refresh={VariableRefresh.onTimeRangeChanged}
              isMulti={true}
              includeAll={true}
              initialValue={'$__all'}
              allValue=".+"
              sort={VariableSort.alphabeticalCaseInsensitiveAsc}
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
                </TabsBar>

                {activeTab === 'overview' && <MetricsPageOverview />}
              </PluginPage>
            </QueryVariable>
          </QueryVariable>
        </QueryVariable>
      </DataSourceVariable>
    </SceneContextProvider>
  );
}
