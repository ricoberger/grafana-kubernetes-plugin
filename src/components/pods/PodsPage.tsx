import { VariableHide, VariableRefresh, VariableSort } from '@grafana/data';
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

import datasourcePluginJson from '../../datasource/plugin.json';
import resourcesImg from '../../img/logo.svg';
import pluginJson from '../../plugin.json';
import { queries, variableQuery } from '../../utils/utils.queries';
import { getStyles } from '../../utils/utils.styles';
import { LegendResourceUsage } from '../shared/LegendResourceUsage';
import { TableResourceUsage } from '../shared/TableResourceUsage';

export function PodsPage() {
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
              skipUrlSync={true}
              name="node"
              label="Node"
              query=".+"
              initialValue=".+"
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
                <QueryVariable
                  name="pod"
                  label="Pod"
                  datasource={{
                    type: 'prometheus',
                    uid: '$prometheus',
                  }}
                  query={{
                    refId: 'pods',
                    query: variableQuery(queries.pods.labelsByClusterNamespace),
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
                          alt="Pods"
                          src={resourcesImg}
                        />
                        <h1>Pods</h1>
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
                    <Stack direction="column" gap={2} height="100%">
                      <div className={styles.dashboard.header.container}>
                        <VariableControl name="datasource" />
                        <VariableControl name="prometheus" />
                        <VariableControl name="cluster" />
                        <VariableControl name="namespace" />
                        <VariableControl name="pod" />
                        <div className={styles.dashboard.header.spacer} />
                        <LegendResourceUsage />
                      </div>
                      <div className={styles.dashboard.row.height100percent}>
                        <TableResourceUsage
                          title="Pods"
                          infoPodExpr={queries.pods.info}
                          cpuUsageAvgExpr={queries.pods.cpuUsageAvgOverTime}
                          cpuUsageAvgPercentExpr={
                            queries.pods.cpuUsageAvgPercentOverTime
                          }
                          cpuUsageMaxExpr={queries.pods.cpuUsageMaxOverTime}
                          cpuUsageMaxPercentExpr={
                            queries.pods.cpuUsageMaxPercentOverTime
                          }
                          memoryUsageAvgExpr={
                            queries.pods.memoryUsageAvgOverTime
                          }
                          memoryUsageAvgPercentExpr={
                            queries.pods.memoryUsageAvgPercentOverTime
                          }
                          memoryUsageMaxExpr={
                            queries.pods.memoryUsageMaxOverTime
                          }
                          memoryUsageMaxPercentExpr={
                            queries.pods.memoryUsageMaxPercentOverTime
                          }
                        />
                      </div>
                    </Stack>
                  </PluginPage>
                </QueryVariable>
              </QueryVariable>
            </CustomVariable>
          </QueryVariable>
        </QueryVariable>
      </DataSourceVariable>
    </SceneContextProvider>
  );
}
