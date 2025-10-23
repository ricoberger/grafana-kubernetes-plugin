import { DataSourceJsonData } from '@grafana/data';

/**
 * Provider defines the options for how to authenticate against the Kubernetes
 * API. It is possible to use the in-cluster authentication, to provide the path
 * to a Kubeconfig file or to upload a Kubeconfig file.
 */
export type ClusterProvider = 'incluster' | 'path' | 'kubeconfig';

/**
 * These are options configured for each DataSource instance. A user must select
 * a provider and depending on the selected provider a user must provide the
 * path to a Kubeconfig or upload a Kubeconfig.
 */
export interface DataSourceOptions extends DataSourceJsonData {
  clusterProvider?: ClusterProvider;
  clusterPath?: string;
  clusterContext?: string;
  grafanaUsername?: string;
  impersonateUser?: boolean;
  impersonateGroups?: boolean;
  generateKubeconfig?: boolean;
  generateKubeconfigName?: string;
  generateKubeconfigTTL?: number;
  generateKubeconfigPort?: number;
  integrationsMetricsDatasourceUid?: string;
  integrationsMetricsKubeletJob?: string;
  integrationsMetricsKubeStateMetricsJob?: string;
  integrationsMetricsNodeExporterJob?: string;
  integrationsTracesLink?: string;
}

export interface KubernetesSecureJsonData {
  clusterKubeconfig?: string;
  grafanaPassword?: string;
}
