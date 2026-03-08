import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { VariableHide, VariableSort } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Alert, Stack, Tab, TabsBar, useStyles2 } from '@grafana/ui';
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
import { WorkloadPageOverview } from './WorkloadPageOverview';
import { queries, variableQuery } from '../queries';

export function WorkloadPage() {
  const styles = useStyles2(getStyles);
  const { namespace, workloadType, workload } = useParams<{
    namespace: string;
    workloadType: string;
    workload: string;
  }>();
  const [activeTab, setActiveTab] = useState('overview');

  if (!namespace) {
    return <Alert title="Namespace not found" severity="error" />;
  }

  if (!workloadType) {
    return <Alert title="Workload type not found" severity="error" />;
  }

  if (!workload) {
    return <Alert title="Workload not found" severity="error" />;
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
                query={namespace}
                initialValue={namespace}
                hide={VariableHide.hideVariable}
              >
                <CustomVariable
                  name="workloadtype"
                  label="Workload Type"
                  query={workloadType}
                  initialValue={workloadType}
                  hide={VariableHide.hideVariable}
                >
                  <CustomVariable
                    name="workload"
                    label="Workload"
                    query={workload.toLowerCase()}
                    initialValue={workload.toLowerCase()}
                    hide={VariableHide.hideVariable}
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
                        query: variableQuery(
                          queries.pods.labelsByClusterNamespaceWorkload,
                        ),
                      }}
                      isMulti={true}
                      includeAll={true}
                      initialValue={'$__all'}
                      sort={VariableSort.alphabeticalCaseInsensitiveAsc}
                    >
                      <PluginPage
                        renderTitle={() => (
                          <Stack gap={0}>
                            <img
                              className={styles.pluginPage.title.image}
                              alt={workload}
                              src={resourcesImg}
                            />
                            <h1>{workload}</h1>
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
                        {activeTab === 'overview' && (
                          <WorkloadPageOverview
                            workloadType={workloadType.toLowerCase()}
                          />
                        )}
                      </PluginPage>
                    </QueryVariable>
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
