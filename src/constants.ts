import pluginJson from './plugin.json';

export const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;

export enum ROUTES {
  Home = 'home',
  Search = 'search',
  Resources = 'resources',
  Helm = 'helm',
  Kubeconfig = 'kubeconfig',
  Kubectl = 'kubectl',
  MetricsNodes = 'nodes',
  MetricsNamespaces = 'namespaces',
  MetricsWorkloads = 'workloads',
  MetricsPods = 'pods',
  MetricsPersistentVolumeClaims = 'persistentvolumeclaims',
}
