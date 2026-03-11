import React from 'react';
import { VariableHide, VariableRefresh, VariableSort } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Stack, useStyles2 } from '@grafana/ui';
import {
  SceneContextProvider,
  DataSourceVariable,
  QueryVariable,
  VariableControl,
  TimeRangePicker,
  RefreshPicker,
} from '@grafana/scenes-react';

import pluginJson from '../../../plugin.json';
import datasourcePluginJson from '../../../datasource/plugin.json';
import resourcesImg from '../../../img/logo.svg';
import { getStyles } from '../../../utils/utils.styles';
import { LegendResourceUsage } from '../shared/LegendResourceUsage';
import { TableResourceUsage } from '../shared/TableResourceUsage';
import { queries, variableQuery } from '../queries';

export function NamespacesPage() {
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
                  <Stack gap={0}>
                    <img
                      className={styles.pluginPage.title.image}
                      alt="Namespaces"
                      src={resourcesImg}
                    />
                    <h1>Namespaces</h1>
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
                    <div className={styles.dashboard.header.spacer} />
                    <LegendResourceUsage />
                  </div>
                  <div className={styles.dashboard.row.height100percent}>
                    <TableResourceUsage
                      title="Namespaces"
                      infoNamespaceExpr={queries.namespaces.info}
                      cpuUsageAvgExpr={queries.namespaces.cpuUsageAvgOverTime}
                      cpuUsageAvgPercentExpr={
                        queries.namespaces.cpuUsageAvgPercentOverTime
                      }
                      cpuUsageMaxExpr={queries.namespaces.cpuUsageMaxOverTime}
                      cpuUsageMaxPercentExpr={
                        queries.namespaces.cpuUsageMaxPercentOverTime
                      }
                      memoryUsageAvgExpr={
                        queries.namespaces.memoryUsageAvgOverTime
                      }
                      memoryUsageAvgPercentExpr={
                        queries.namespaces.memoryUsageAvgPercentOverTime
                      }
                      memoryUsageMaxExpr={
                        queries.namespaces.memoryUsageMaxOverTime
                      }
                      memoryUsageMaxPercentExpr={
                        queries.namespaces.memoryUsageMaxPercentOverTime
                      }
                      alertsExpr={queries.namespaces.alertsCount}
                    />
                  </div>
                </Stack>
              </PluginPage>
            </QueryVariable>
          </QueryVariable>
        </QueryVariable>
      </DataSourceVariable>
    </SceneContextProvider>
  );
}
