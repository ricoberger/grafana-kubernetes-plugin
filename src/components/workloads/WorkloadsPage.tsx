import { VariableHide, VariableRefresh, VariableSort } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import {
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

export function WorkloadsPage() {
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
                        alt="Workloads"
                        src={resourcesImg}
                      />
                      <h1>Workloads</h1>
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
                      <VariableControl name="workload" />
                      <div className={styles.dashboard.header.spacer} />
                      <LegendResourceUsage />
                    </div>
                    <div className={styles.dashboard.row.height100percent}>
                      <TableResourceUsage
                        title="Workloads"
                        cpuUsageAvgExpr={queries.workloads.cpuUsageAvgOverTime}
                        cpuUsageAvgPercentExpr={
                          queries.workloads.cpuUsageAvgPercentOverTime
                        }
                        cpuUsageMaxExpr={queries.workloads.cpuUsageMaxOverTime}
                        cpuUsageMaxPercentExpr={
                          queries.workloads.cpuUsageMaxPercentOverTime
                        }
                        memoryUsageAvgExpr={
                          queries.workloads.memoryUsageAvgOverTime
                        }
                        memoryUsageAvgPercentExpr={
                          queries.workloads.memoryUsageAvgPercentOverTime
                        }
                        memoryUsageMaxExpr={
                          queries.workloads.memoryUsageMaxOverTime
                        }
                        memoryUsageMaxPercentExpr={
                          queries.workloads.memoryUsageMaxPercentOverTime
                        }
                        desiredPodsExpr={queries.workloads.desiredPods}
                        readyPodsExpr={queries.workloads.readyPods}
                        alertsExpr={queries.workloads.alertsCount}
                      />
                    </div>
                  </Stack>
                </PluginPage>
              </QueryVariable>
            </QueryVariable>
          </QueryVariable>
        </QueryVariable>
      </DataSourceVariable>
    </SceneContextProvider>
  );
}
