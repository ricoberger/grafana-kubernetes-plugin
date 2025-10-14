import { DataQuery } from '@grafana/schema';

/**
 * DEFAULT_QUERY provides default values for a new query. The default query
 * type is "kubernetes-resources", the default namespace is "default", the
 * default resource is "pods" and wide is set to false.
 */
export const DEFAULT_QUERY: Partial<Query> = {
  queryType: 'kubernetes-resources',
  namespace: 'default',
  resource: 'pods',
  wide: false,
};

/**
 * QueryType defines the different query types that the data source supports.
 * Each query type may require different parameters.
 *
 * The "resourcekinds", "namespaces" and "containers" query types can onlye be
 * used for Variable values, while all other query types should return a data
 * frame which can be used within a panel.
 */
export type QueryType =
  | 'kubernetes-resourceids'
  | 'kubernetes-namespaces'
  | 'kubernetes-containers'
  | 'kubernetes-resources'
  | 'kubernetes-logs'
  | 'helm-releases'
  | 'helm-release-history'
  | 'flux-resources';

/**
 * Query defines the query structure for the Kubernetes data source. Depending
 * on the selected queryType, different parameters may be required.
 */
export interface Query
  extends DataQuery,
  QueryModelVariable,
  QueryModelKubernetesResources,
  QueryModelKubernetesContainers,
  QueryModelKubernetesLogs,
  QueryModelHelmReleases,
  QueryModelHelmReleaseHistory,
  QueryModelFluxResources {
  queryType: QueryType;
}

export interface QueryModelVariable {
  variableField?: string;
}

export interface QueryModelKubernetesResources {
  resource?: string;
  namespace?: string;
  parameterName?: string;
  parameterValue?: string;
  wide?: boolean;
}

export interface QueryModelKubernetesContainers {
  resource?: string;
  namespace?: string;
  name?: string;
}

export interface QueryModelKubernetesLogs {
  resource?: string;
  namespace?: string;
  name?: string;
  container?: string;
  filter?: string;
}

export interface QueryModelHelmReleases {
  namespace?: string;
}

export interface QueryModelHelmReleaseHistory {
  namespace?: string;
  name?: string;
}

export interface QueryModelFluxResources {
  resource?: string;
  namespace?: string;
}
