import pluginJson from './plugin.json';

export const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;

export enum ROUTES {
  Home = 'home',
  Search = 'search',
  Resources = 'resources',
  Helm = 'helm',
  Kubeconfig = 'kubeconfig',
  Kubectl = 'kubectl',
  Nodes = 'nodes',
  Namespaces = 'namespaces',
  Workloads = 'workloads',
  Pods = 'pods',
  PersistentVolumeClaims = 'persistentvolumeclaims',
}
