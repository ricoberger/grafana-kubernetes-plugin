import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { VariableHide, VariableRefresh } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Alert, Badge, Stack, Tab, TabsBar, useStyles2 } from '@grafana/ui';
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
import { PodPageOverview } from './PodPageOverview';
import { PodPageCPU } from './PodPageCPU';
import { PodPageMemory } from './PodPageMemory';
import { PodPageNetwork } from './PodPageNetwork';
import { PodPageStorage } from './PodPageStorage';
import { ROUTES } from '../../../constants';
import { prefixRoute } from '../../../utils/utils.routing';

export function PodPage() {
  const styles = useStyles2(getStyles);
  const { namespace, pod } = useParams<{ namespace: string; pod: string }>();
  const [activeTab, setActiveTab] = useState('overview');

  if (!namespace) {
    return <Alert title="Namespace not found" severity="error" />;
  }

  if (!pod) {
    return <Alert title="Pod not found" severity="error" />;
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
        refresh={VariableRefresh.onDashboardLoad}
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
                query={namespace}
                initialValue={namespace}
                hide={VariableHide.hideVariable}
              >
                <CustomVariable
                  name="pod"
                  label="Pod"
                  query={pod}
                  initialValue={pod}
                  hide={VariableHide.hideVariable}
                >
                  <PluginPage
                    pageNav={{
                      text: pod,
                      parentItem: {
                        text: namespace,
                        url: prefixRoute(ROUTES.MetricsNamespaces),
                        parentItem: {
                          text: 'Pods',
                          url: prefixRoute(ROUTES.MetricsPods),
                        },
                      },
                    }}
                    renderTitle={() => (
                      <Stack gap={0} alignItems="center" direction="row">
                        <img
                          className={styles.pluginPage.title.image}
                          alt={pod}
                          src={resourcesImg}
                        />
                        <h1>{pod}</h1>
                        <Badge
                          className={styles.pluginPage.title.badge}
                          color="blue"
                          text="pod"
                        />
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
                    {activeTab === 'overview' && <PodPageOverview />}
                    {activeTab === 'cpu' && <PodPageCPU />}
                    {activeTab === 'memory' && <PodPageMemory />}
                    {activeTab === 'network' && <PodPageNetwork />}
                    {activeTab === 'storage' && <PodPageStorage />}
                  </PluginPage>
                </CustomVariable>
              </CustomVariable>
            </CustomVariable>
          </QueryVariable>
        </QueryVariable>
      </DataSourceVariable>
    </SceneContextProvider>
  );
}
