import { VariableHide, VariableRefresh } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import {
  CustomVariable,
  DataSourceVariable,
  QueryVariable,
  RefreshPicker,
  SceneContextProvider,
  TimeRangePicker,
  VariableControl,
} from '@grafana/scenes-react';
import { Stack, useStyles2 } from '@grafana/ui';
import React from 'react';

import { ROUTES } from '../../constants';
import datasourcePluginJson from '../../datasource/plugin.json';
import resourcesImg from '../../img/logo.svg';
import pluginJson from '../../plugin.json';
import { prefixRoute } from '../../utils/utils.routing';
import { getStyles } from '../../utils/utils.styles';
import { SearchPagePods } from './SearchPagePods';
import { SearchPageWorkloads } from './SearchPageWorkloads';

export function SearchPage() {
  const styles = useStyles2(getStyles);

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
              name="searchterm"
              label="Search Term"
              query=".+"
              initialValue=".+"
            >
              <PluginPage
                pageNav={{
                  text: 'Search',
                  parentItem: {
                    text: 'Kubernetes',
                    url: prefixRoute(ROUTES.Home),
                  },
                }}
                renderTitle={() => (
                  <Stack gap={0} alignItems="center" direction="row">
                    <img
                      className={styles.pluginPage.title.image}
                      alt="Search"
                      src={resourcesImg}
                    />
                    <h1>Search</h1>
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
                    <VariableControl name="searchterm" />
                    <div className={styles.dashboard.header.spacer} />
                  </div>
                  <div className={styles.dashboard.row.height400px}>
                    <SearchPageWorkloads />
                  </div>
                  <div className={styles.dashboard.row.height400px}>
                    <SearchPagePods />
                  </div>
                </Stack>
              </PluginPage>
            </CustomVariable>
          </QueryVariable>
        </QueryVariable>
      </DataSourceVariable>
    </SceneContextProvider>
  );
}
