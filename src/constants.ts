import pluginJson from './plugin.json';

export const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;

export enum ROUTES {
  Home = 'home',
  Resources = 'resources',
  Helm = 'helm',
  Flux = 'flux',
  Kubeconfig = 'kubeconfig',
}
