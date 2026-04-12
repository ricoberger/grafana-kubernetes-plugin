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
import { Card, LinkButton, Stack, useStyles2 } from '@grafana/ui';
import React from 'react';

import { ROUTES } from '../../constants';
import datasourcePluginJson from '../../datasource/plugin.json';
import helmImg from '../../img/helm.svg';
import resourcesImg from '../../img/logo.svg';
import { prefixRoute } from '../../utils/utils.routing';
import { getStyles } from '../../utils/utils.styles';
import { queries } from '../metrics/queries';
import { StatWithFixedColorAndLink } from '../metrics/shared/StatWithFixedColorAndLink';
import { TimeSeriesMemoryOrCPU } from '../metrics/shared/TimeSeriesMemoryOrCPU';

interface Item {
  route: ROUTES;
  title: string;
  image: string;
  description: string;
  link: string;
}

const items: Item[] = [
  {
    route: ROUTES.Resources,
    title: 'Resources',
    image: resourcesImg,
    description: 'Manage your Kubernetes resources.',
    link: 'https://kubernetes.io',
  },
  {
    route: ROUTES.Helm,
    title: 'Helm',
    image: helmImg,
    description: 'Manage your Helm releases.',
    link: 'https://helm.sh',
  },
  {
    route: ROUTES.Kubeconfig,
    title: 'Kubeconfig',
    image: resourcesImg,
    description: 'Generate a Kubeconfig file.',
    link: 'https://kubernetes.io',
  },
];

export function HomePage() {
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
            <CustomVariable
              name="namespace"
              label="Namespace"
              query=".+"
              initialValue=".+"
              hide={VariableHide.hideVariable}
            >
              <PluginPage
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
                    <LinkButton
                      href={prefixRoute(ROUTES.Metrics)}
                      size="md"
                      variant="secondary"
                      fill="outline"
                      icon="apps"
                    >
                      Details
                    </LinkButton>
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
                    <div className={styles.dashboard.row.height400px}>
                      <TimeSeriesMemoryOrCPU
                        title="Cluster CPU"
                        unit="cores"
                        capacityExpr={queries.cluster.cpuCapacity}
                        limitsExpr={queries.cluster.cpuLimits}
                        requestsExpr={queries.cluster.cpuRequests}
                        usageExpr={queries.cluster.cpuUsage}
                      />
                      <TimeSeriesMemoryOrCPU
                        title="Cluster Memory"
                        unit="bytes"
                        capacityExpr={queries.cluster.memoryCapacity}
                        limitsExpr={queries.cluster.memoryLimits}
                        requestsExpr={queries.cluster.memoryRequests}
                        usageExpr={queries.cluster.memoryUsage}
                      />
                    </div>
                  </Stack>
                </Stack>

                <div className={styles.pluginPage.section}>
                  <h4>Integrations</h4>
                  <ul className={styles.list}>
                    {items.map((item) => (
                      <li
                        key={item.route}
                        data-testid={`integration-${item.route}`}
                      >
                        <Card noMargin href={prefixRoute(item.route)}>
                          <Card.Heading>{item.title}</Card.Heading>
                          <Card.Figure>
                            <img
                              src={item.image}
                              alt={`${item.title} logo`}
                              width="40"
                              height="40"
                            />
                          </Card.Figure>
                          <Card.Meta>
                            <span>{item.description}</span>
                            <a href={item.link}>{item.link}</a>
                          </Card.Meta>
                        </Card>
                      </li>
                    ))}
                  </ul>
                </div>
              </PluginPage>
            </CustomVariable>
          </QueryVariable>
        </QueryVariable>
      </DataSourceVariable>
    </SceneContextProvider>
  );
}
