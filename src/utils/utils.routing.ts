import { PLUGIN_BASE_URL } from '../constants';

/**
 * prefixRoute prefixes the route with the base URL of the plugin.
 */
export function prefixRoute(route: string): string {
  return `${PLUGIN_BASE_URL}/${route}`;
}
