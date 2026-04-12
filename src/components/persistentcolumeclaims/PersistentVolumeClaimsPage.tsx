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
import { TablePersistentVolumeClaimsUsage } from '../shared/TablePersistentVolumeClaimsUsage';
import { PersistentVolumeClaimsStat } from './PersistentVolumeClaimsStat';

export function PersistentVolumeClaimsPage() {
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
                name="pvc"
                label="PersistentVolumeClaim"
                datasource={{
                  type: 'prometheus',
                  uid: '$prometheus',
                }}
                query={{
                  refId: 'pvcs',
                  query: variableQuery(
                    queries.persistentVolumeClaims.labelsByClusterNamespace,
                  ),
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
                        alt="PersistentVolumeClaims"
                        src={resourcesImg}
                      />
                      <h1>PersistentVolumeClaims</h1>
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
                      <VariableControl name="pvc" />
                      <div className={styles.dashboard.header.spacer} />
                    </div>
                    <div className={styles.dashboard.row.height100px}>
                      <PersistentVolumeClaimsStat
                        title="PVCs Above Warning Threshold"
                        expr={
                          queries.persistentVolumeClaims.aboveWarningThreshold
                        }
                      />
                      <PersistentVolumeClaimsStat
                        title="PVCs Full in 5 Days"
                        expr={queries.persistentVolumeClaims.fullIn5Days}
                      />
                      <PersistentVolumeClaimsStat
                        title="PVCs Full in 2 Days"
                        expr={queries.persistentVolumeClaims.fullIn2Days}
                      />
                      <PersistentVolumeClaimsStat
                        title="PVCs Unused"
                        expr={queries.persistentVolumeClaims.unused}
                      />
                      <PersistentVolumeClaimsStat
                        title="PVCs in Lost State"
                        expr={queries.persistentVolumeClaims.lostState}
                      />
                      <PersistentVolumeClaimsStat
                        title="PVCs in Pending State"
                        expr={queries.persistentVolumeClaims.pendingState}
                      />
                    </div>
                    <div className={styles.dashboard.row.height100percent}>
                      <TablePersistentVolumeClaimsUsage />
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
