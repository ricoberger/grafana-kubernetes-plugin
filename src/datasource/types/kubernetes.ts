import { KubernetesObject } from '@kubernetes/client-node';

/**
 * Resource is the interface for a Kubernetes resource with all the required
 * fields to identify and work with this resource.
 */
export interface Resource {
  kind: string;
  resource: string;
  path: string;
  namespaced: boolean;
}

export interface KubernetesManifest extends KubernetesObject {
  spec: any;
  status: any;
}
