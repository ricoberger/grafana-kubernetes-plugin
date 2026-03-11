import React from 'react';
import { VariableHide, VariableRefresh, VariableSort } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Card, Stack, useStyles2 } from '@grafana/ui';
import {
  SceneContextProvider,
  DataSourceVariable,
  QueryVariable,
  VariableControl,
  TimeRangePicker,
  RefreshPicker,
} from '@grafana/scenes-react';

import { ROUTES } from '../../constants';
import resourcesImg from '../../img/logo.svg';
import helmImg from '../../img/helm.svg';
import fluxImg from '../../img/flux.svg';
import certmanagerImg from '../../img/cert-manager.svg';
import { prefixRoute } from '../../utils/utils.routing';
import { getStyles } from '../../utils/utils.styles';
import datasourcePluginJson from '../../datasource/plugin.json';
import { StatWithFixedColorAndLink } from '../metrics/shared/StatWithFixedColorAndLink';
import { TimeSeriesMemoryOrCPU } from '../metrics/shared/TimeSeriesMemoryOrCPU';
import { queries, variableQuery } from '../metrics/queries';

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
    route: ROUTES.Flux,
    title: 'Flux',
    image: fluxImg,
    description: 'Manage your Flux resources.',
    link: 'https://fluxcd.io',
  },
  {
    route: ROUTES.CertManager,
    title: 'cert-manager',
    image: certmanagerImg,
    description: 'Manage your cert-manager resources.',
    link: 'https://cert-manager.io',
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
            </QueryVariable>
          </QueryVariable>
        </QueryVariable>
      </DataSourceVariable>
    </SceneContextProvider>
  );
}
