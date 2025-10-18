import { KubernetesObject } from '@kubernetes/client-node';

/**
 * Resource is the interface for a Kubernetes resource with all the required
 * fields to identify and work with this resource.
 */
export interface Resource {
  isCRD: boolean;
  path: string;
  resource: string;
  scope: 'Cluster' | 'Namespaced';
  columns: ResourceColumn[] | null;
}

export interface ResourceColumn {
  description: string;
  jsonPath: string;
  name: string;
  type: string;
}

export interface KubernetesManifest extends KubernetesObject {
  spec: any;
  status: any;
}
