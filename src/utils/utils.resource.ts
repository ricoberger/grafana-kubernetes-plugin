import { EventsV1EventList } from '@kubernetes/client-node';

import { ROUTES } from '../constants';
import { KubernetesManifest, Resource } from '../datasource/types/kubernetes';
import { prefixRoute } from './utils.routing';

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
export function getResourceId(kind: string, apiVersion: string): string {
  let id = kind;
  const groupVersion = apiVersion.split('/');
  if (groupVersion.length === 2) {
    id = `${kind}.${groupVersion[0]}`;
  }
  return id.toLowerCase();
}

export async function getResource(
  datasource: string | undefined,
  resourceId: string | undefined,
): Promise<Resource> {
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
}

export async function getResourceManifest(
  datasource: string | undefined,
  resourceId: string | undefined,
  namespace: string | undefined,
  name: string | undefined,
): Promise<KubernetesManifest> {
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
}

export async function getEvents(
  datasource: string | undefined,
  namespace: string | undefined,
  name: string | undefined,
): Promise<EventsV1EventList> {
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
}

export interface Logs {
  container: string;
  logs: string;
}

export async function getLogs(
  datasource: string | undefined,
  namespace: string | undefined,
  name: string | undefined,
  manifest: KubernetesManifest,
): Promise<Logs[]> {
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
}

/**
 * Map the resource type from Prometheus to the corresponding Kubernetes
 * resource information, so that we can use it to get the resource information
 * via the Kubernetes data source.
 */
export function prometheusResourceToKubernetesResourceInfo(
  prometheusResource: string,
):
  | {
    title: string;
    resourceId: string;
    parameterName: string;
    parameterValue: string;
  }
  | undefined {
  switch (prometheusResource.toLowerCase()) {
    case 'node':
      return {
        title: 'Node',
        resourceId: 'node',
        parameterName: 'fieldSelector',
        parameterValue: `metadata.name=$node`,
      };
    case 'namespace':
      return {
        title: 'Namespace',
        resourceId: 'namespace',
        parameterName: 'fieldSelector',
        parameterValue: `metadata.name=$namespace`,
      };
    case 'deployment':
      return {
        title: 'Deployment',
        resourceId: 'deployment.apps',
        parameterName: 'fieldSelector',
        parameterValue: `metadata.name=$workload`,
      };
    case 'statefulset':
      return {
        title: 'StatefulSet',
        resourceId: 'statefulset.apps',
        parameterName: 'fieldSelector',
        parameterValue: `metadata.name=$workload`,
      };
    case 'daemonset':
      return {
        title: 'DaemonSet',
        resourceId: 'daemonset.apps',
        parameterName: 'fieldSelector',
        parameterValue: `metadata.name=$workload`,
      };
    case 'replicaset':
      return {
        title: 'ReplicaSet',
        resourceId: 'replicaset.apps',
        parameterName: 'fieldSelector',
        parameterValue: `metadata.name=$workload`,
      };
    case 'cronjob':
      return {
        title: 'CronJob',
        resourceId: 'cronjob.batch',
        parameterName: 'fieldSelector',
        parameterValue: `metadata.name=$workload`,
      };
    case 'job':
      return {
        title: 'Job',
        resourceId: 'job.batch',
        parameterName: 'fieldSelector',
        parameterValue: `metadata.name=$workload`,
      };
    case 'barepod':
      return {
        title: 'Pod',
        resourceId: 'pod',
        parameterName: 'fieldSelector',
        parameterValue: `metadata.name=$workload`,
      };
    case 'pod':
      return {
        title: 'Pod',
        resourceId: 'pod',
        parameterName: 'fieldSelector',
        parameterValue: `metadata.name=$pod`,
      };
    case 'persistentvolumeclaim':
      return {
        title: 'PersistentVolumeClaim',
        resourceId: 'persistentvolumeclaim',
        parameterName: 'fieldSelector',
        parameterValue: `metadata.name=$pvc`,
      };
    /**
     * The following resource types are none default Kubernetes resources, but
     * we want to support them as well, when the corresponding project is well
     * known and widely used.
     */
    case 'strimzipodset':
      return {
        title: 'StrimziPodSet',
        resourceId: 'strimzipodset.core.strimzi.io',
        parameterName: 'fieldSelector',
        parameterValue: `metadata.name=$workload`,
      };
    default:
      return undefined;
  }
}

/**
 * Map the resource id to the corresponding Prometheus resource type, so that we
 * can use it to generate the correct link to the metrics page when clicking on
 * the corresponding action of the resource.
 */
export function resourceIdToPrometheusLink(
  resourceId?: string,
  namespace?: string,
  name?: string,
): string | undefined {
  switch (resourceId) {
    case 'node':
      return `${prefixRoute(ROUTES.Nodes)}/${name}`;
    case 'namespace':
      return `${prefixRoute(ROUTES.Namespaces)}/${name}`;
    case 'deployment.apps':
      return `${prefixRoute(ROUTES.Workloads)}/${namespace}/deployment/${name}`;
    case 'statefulset.apps':
      return `${prefixRoute(ROUTES.Workloads)}/${namespace}/statefulset/${name}`;
    case 'daemonset.apps':
      return `${prefixRoute(ROUTES.Workloads)}/${namespace}/daemonset/${name}`;
    case 'replicaset.apps':
      return `${prefixRoute(ROUTES.Workloads)}/${namespace}/deployment/${name}`;
    case 'cronjob.batch':
      return `${prefixRoute(ROUTES.Workloads)}/${namespace}/CronJob/${name}`;
    case 'job.batch':
      return `${prefixRoute(ROUTES.Workloads)}/${namespace}/job/${name}`;
    case 'pod':
      return `${prefixRoute(ROUTES.Pods)}/${namespace}/${name}`;
    case 'persistentvolumeclaim':
      return `${prefixRoute(ROUTES.PersistentVolumeClaims)}/${namespace}/${name}`;
    /**
     * The following resource types are none default Kubernetes resources, but
     * we want to support them as well, when the corresponding project is well
     * known and widely used.
     */
    case 'strimzipodset.core.strimzi.io':
      return `${prefixRoute(ROUTES.Workloads)}/${namespace}/StrimziPodSet/${name}`;
    default:
      return undefined;
  }
}
