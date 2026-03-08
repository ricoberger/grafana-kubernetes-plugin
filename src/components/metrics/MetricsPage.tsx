import React from 'react';
import { VariableHide, VariableSort } from '@grafana/data';
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

import pluginJson from '../../plugin.json';
import { ROUTES } from '../../constants';
import resourcesImg from '../../img/logo.svg';
import { getStyles } from '../../utils/utils.styles';
import datasourcePluginJson from '../../datasource/plugin.json';
import { StatWithFixedColorAndLink } from './shared/StatWithFixedColorAndLink';
import { queries, variableQuery } from './queries';

export function MetricsPage() {
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
                <Stack direction="column" gap={2}>
                  <div className={styles.dashboard.header.container}>
                    <VariableControl name="datasource" />
                    <VariableControl name="prometheus" />
                    <VariableControl name="cluster" />
                    <VariableControl name="namespace" />
                    <div className={styles.dashboard.header.spacer} />
                  </div>
                  <Stack direction="column" gap={2}>
                    <div className={styles.dashboard.row.height100px}>
                      <StatWithFixedColorAndLink
                        title="Nodes"
                        expr={queries.nodes.count}
                        route={ROUTES.MetricsNodes}
                      />
                      <StatWithFixedColorAndLink
                        title="Namespaces"
                        expr={queries.namespaces.count}
                        route={ROUTES.MetricsNamespaces}
                      />
                      <StatWithFixedColorAndLink
                        title="Workloads"
                        expr={queries.workloads.count}
                        route={ROUTES.MetricsWorkloads}
                      />
                      <StatWithFixedColorAndLink
                        title="Pods"
                        expr={queries.pods.count}
                        route={ROUTES.MetricsPods}
                      />
                      <StatWithFixedColorAndLink
                        title="PersistentVolumeClaims"
                        expr={queries.persistentVolumeClaims.count}
                        route={ROUTES.MetricsPersistentVolumeClaims}
                      />
                    </div>
                  </Stack>
                </Stack>
              </PluginPage>
            </QueryVariable>
          </QueryVariable>
        </QueryVariable>
      </DataSourceVariable>
    </SceneContextProvider>
  );
}
