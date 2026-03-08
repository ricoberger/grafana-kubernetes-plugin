import pluginJson from './plugin.json';

export const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;

export enum ROUTES {
  Home = 'home',
  Resources = 'resources',
  Helm = 'helm',
  Flux = 'flux',
  CertManager = 'cert-manager',
  Kubeconfig = 'kubeconfig',
  Kubectl = 'kubectl',
  Metrics = 'metrics',
  MetricsNodes = 'metrics/nodes',
  MetricsNamespaces = 'metrics/namespaces',
  MetricsWorkloads = 'metrics/workloads',
  MetricsPods = 'metrics/pods',
  MetricsPersistentVolumeClaims = 'metrics/persistentvolumeclaims',
}
