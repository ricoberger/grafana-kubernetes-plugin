import { DataQuery } from '@grafana/schema';

/**
 * DEFAULT_QUERY provides default values for a new query. The default query
 * type is "kubernetes-resources", the default namespace is "default", the
 * default resource is "pods" and wide is set to false.
 */
export const DEFAULT_QUERY: Partial<Query> = {
  queryType: 'kubernetes-resources',
  resource: 'pods',
  namespace: 'default',
  wide: false,
};

/**
 * DEFAULT_QUERIES provides default values for each query type. This is used
 * when the user changes the query type in the query editor.
 */
export const DEFAULT_QUERIES: Record<QueryType, Partial<Query>> = {
  'kubernetes-resourceids': {},
  'kubernetes-namespaces': {},
  'kubernetes-containers': {
    resource: 'pods',
    namespace: 'default',
    name: '',
  },
  'kubernetes-resources': {
    resource: 'pods',
    namespace: 'default',
    parameterName: '',
    parameterValue: '',
    wide: false,
    /**
     * When using the "kubernetes-resources" query type for a Variable, this
     * defines which field from the resource should be used as the variable
     * value. The default is "Name", which will return the metadata.name field
     * from the resource.
     */
    variableField: 'Name',
  },
  'kubernetes-logs': {
    resource: 'pods',
    namespace: 'default',
    name: '',
    container: '',
    filter: '',
  },
  'helm-releases': {
    namespace: 'default',
  },
  'helm-release-history': {
    namespace: 'default',
    name: '',
  },
  'flux-resources': {
    resource: 'kustomizations.kustomize.toolkit.fluxcd.io',
    namespace: 'default',
  },
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
