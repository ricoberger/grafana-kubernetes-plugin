import { EventsV1EventList } from '@kubernetes/client-node';

import { KubernetesManifest, Resource } from '../datasource/types/kubernetes';

/**
 * Get the internal resource id for the resource kind and apiVersion
 * (groupVersion). The id is in the format: kind.group (lowercase). This allows
 * us to uniquely identify resources based on their kind and apiVersion. The
 * version is not included in the id as it can be changed (e.g. when a CRD is
 * upgraded) and could break existing references in dashboards.
 *
 * The backend implementation of generating the id, could be found in the
 * "resources.go" file.
 */
export const getResourceId = (kind: string, apiVersion: string): string => {
  let id = kind;
  const groupVersion = apiVersion.split('/');
  if (groupVersion.length === 2) {
    id = `${kind}.${groupVersion[0]}`;
  }
  return id.toLowerCase();
};

export const getResource = async (
  datasource: string | undefined,
  resourceId: string | undefined,
): Promise<Resource> => {
  if (!datasource || !resourceId) {
    throw new Error();
  }

  const response = await fetch(
    `/api/datasources/uid/${datasource}/resources/kubernetes/resource/${resourceId}`,
  );
  if (!response.ok) {
    throw new Error(await response.text());
  }

  return await response.json();
};

export const getResourceManifest = async (
  datasource: string | undefined,
  resourceId: string | undefined,
  namespace: string | undefined,
  name: string | undefined,
): Promise<KubernetesManifest> => {
  if (!datasource || !resourceId) {
    throw new Error();
  }

  const resource = await getResource(datasource, resourceId);

  const response = await fetch(
    `/api/datasources/uid/${datasource}/resources/kubernetes/proxy${resource.path}${resource.namespaced ? `/namespaces/${namespace}` : ''}/${resource.name}/${name}`,
    {
      method: 'get',
      headers: {
        Accept: 'application/json, */*',
        'Content-Type': 'application/json',
      },
    },
  );
  if (!response.ok) {
    throw new Error(await response.text());
  }

  return await response.json();
};

export const getEvents = async (
  datasource: string | undefined,
  namespace: string | undefined,
  name: string | undefined,
): Promise<EventsV1EventList> => {
  if (!datasource) {
    throw new Error();
  }

  const response = await fetch(
    `/api/datasources/uid/${datasource}/resources/kubernetes/proxy/api/v1${namespace ? `/namespaces/${namespace}` : ''}/events?fieldSelector=involvedObject.name=${name}`,
    {
      method: 'get',
      headers: {
        Accept: 'application/json, */*',
        'Content-Type': 'application/json',
      },
    },
  );
  return await response.json();
};

export interface Logs {
  container: string;
  logs: string;
}

export const getLogs = async (
  datasource: string | undefined,
  namespace: string | undefined,
  name: string | undefined,
  manifest: KubernetesManifest,
): Promise<Logs[]> => {
  if (!datasource || !namespace || !name || !manifest) {
    throw new Error();
  }

  const logs: Logs[] = [];
  const containers: string[] =
    manifest?.spec?.containers?.map((c: any) => c.name) || [];

  for (const container of containers) {
    const response = await fetch(
      `/api/datasources/uid/${datasource}/resources/kubernetes/proxy/api/v1/namespaces/${namespace}/pods/${name}/log?container=${container}&tailLines=200`,
    );
    if (response.ok) {
      logs.push({
        container: container,
        logs: await response.text(),
      });
    }
  }
  return logs;
};
