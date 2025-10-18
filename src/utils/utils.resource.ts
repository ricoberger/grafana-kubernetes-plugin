import { KubernetesManifest, Resource } from '../datasource/types/kubernetes';

export const getResource = async (
  datasource: string | undefined,
  resource: string | undefined,
): Promise<Resource> => {
  if (!datasource || !resource) {
    throw new Error();
  }

  const response = await fetch(
    `/api/datasources/uid/${datasource}/resources/kubernetes/resource/${resource}`,
  );
  if (!response.ok) {
    throw new Error(await response.text());
  }

  return await response.json();
};

export const getResourceManifest = async (
  datasource: string | undefined,
  resource: Resource,
  namespace: string | undefined,
  name: string | undefined,
): Promise<KubernetesManifest> => {
  if (!datasource || !resource) {
    throw new Error();
  }

  const response = await fetch(
    `/api/datasources/uid/${datasource}/resources/kubernetes/proxy${resource.path}${resource.scope === 'Namespaced' ? `/namespaces/${namespace}` : ''}/${resource.resource}/${name}`,
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
