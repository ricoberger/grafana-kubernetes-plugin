import {
  DataFrame,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceInstanceSettings,
  CoreApp,
  ScopedVars,
  MetricFindValue,
  LegacyMetricFindQueryOptions,
} from '@grafana/data';
import { DataSourceWithBackend, getTemplateSrv } from '@grafana/runtime';
import { lastValueFrom, map, Observable } from 'rxjs';

import { Query, DEFAULT_QUERY } from './types/query';
import { DataSourceOptions } from './types/settings';
import { VariableSupport } from './variablesupport';
import {
  kubernetesResourcesTransformation,
  kubernetesLogsTransformation,
} from './components/Kubernetes/Kubernetes';
import { helmTransformation } from './components/Helm/Helm';
import { fluxResourcesTransformation } from './components/Flux/Flux';

export class DataSource extends DataSourceWithBackend<
  Query,
  DataSourceOptions
> {
  settings: DataSourceOptions | undefined;

  constructor(instanceSettings: DataSourceInstanceSettings<DataSourceOptions>) {
    super(instanceSettings);
    this.settings = instanceSettings.jsonData;
    this.variables = new VariableSupport(this);
  }

  getDefaultQuery(_: CoreApp): Partial<Query> {
    return DEFAULT_QUERY;
  }

  /**
   * TODO: Find a way to apply template variables to all fields in the query
   * without having to list them all here.
   */
  applyTemplateVariables(query: Query, scopedVars: ScopedVars) {
    return {
      ...query,
      variableField: getTemplateSrv().replace(query.variableField, scopedVars),
      resourceId: getTemplateSrv().replace(query.resourceId, scopedVars),
      namespace: getTemplateSrv().replace(query.namespace, scopedVars),
      parameterName: getTemplateSrv().replace(query.parameterName, scopedVars),
      parameterValue: getTemplateSrv().replace(
        query.parameterValue,
        scopedVars,
      ),
      name: getTemplateSrv().replace(query.name, scopedVars),
      container: getTemplateSrv().replace(query.container, scopedVars),
      filter: getTemplateSrv().replace(query.filter, scopedVars),
    };
  }

  /**
   * query runs the provided query and modifies the returned response.
   */
  query(request: DataQueryRequest<Query>): Observable<DataQueryResponse> {
    let response = super.query(request);

    return response.pipe(
      map((dataQueryResponse) => {
        return {
          ...dataQueryResponse,
          data: dataQueryResponse.data.flatMap((frame) => {
            if (frame.refId.startsWith('metricsFindQuery')) {
              return frame;
            }

            const query = request.targets.find((t) => t.refId === frame.refId);

            if (
              request.app !== CoreApp.Explore &&
              query?.queryType === 'kubernetes-resources'
            ) {
              return kubernetesResourcesTransformation(
                this.applyTemplateVariables(query, request.scopedVars),
                frame,
                this.settings!,
              );
            } else if (
              query?.queryType === 'kubernetes-logs' &&
              this.settings?.integrationsTracesQuery
            ) {
              return kubernetesLogsTransformation(
                frame,
                this.settings.integrationsTracesQuery,
              );
            } else if (
              request.app !== CoreApp.Explore &&
              (query?.queryType === 'helm-releases' ||
                query?.queryType === 'helm-release-history')
            ) {
              return helmTransformation(
                this.applyTemplateVariables(query, request.scopedVars),
                frame,
              );
            } else if (
              request.app !== CoreApp.Explore &&
              query?.queryType === 'flux-resources'
            ) {
              return fluxResourcesTransformation(
                this.applyTemplateVariables(query, request.scopedVars),
                frame,
              );
            }

            return frame;
          }),
        };
      }),
    );
  }

  /**
   * metricFindQuery is used to execute the queries to get the values for a
   * variable.
   */
  async metricFindQuery(
    query: Query,
    options?: LegacyMetricFindQueryOptions,
  ): Promise<MetricFindValue[]> {
    const q = this.query({
      targets: [
        {
          ...query,
          refId: query.refId
            ? `metricsFindQuery-${query.refId}`
            : 'metricFindQuery',
        },
      ],
      range: options?.range,
    } as DataQueryRequest<Query>);

    const response = await lastValueFrom(q as Observable<DataQueryResponse>);

    if (
      response &&
      (!response.data.length || !response.data[0].fields.length)
    ) {
      return [];
    }

    // If query type is "kubernetes-resourceids" we apply a special handling to
    // get the variables values, because this query type returns both the
    // resource id and the kind of the resource. The id is used as value, while
    // the kind is used as text.
    if (query.queryType === 'kubernetes-resourceids') {
      return response
        ? (response.data[0] as DataFrame).fields[0].values.map((_, index) => ({
          value: _.toString(),
          text: (response.data[0] as DataFrame).fields[1].values[
            index
          ].toString(),
        }))
        : [];
    }

    /**
     * If the query type is "kubernetes-namespaces" or "kubernetes-containers"
     * we apply a special handling to get the variable values, because these
     * query types can only be used for variables.
     */
    if (
      query.queryType === 'kubernetes-namespaces' ||
      query.queryType === 'kubernetes-containers'
    ) {
      return response
        ? (response.data[0] as DataFrame).fields[0].values.map((_) => ({
          text: _.toString(),
        }))
        : [];
    }

    /**
     * For all other query types we get the values from the provided
     * "variableField" parameter in the query.
     */
    const index = response
      ? (response.data[0] as DataFrame).fields
        .map((_) => _.name)
        .indexOf(query.variableField || '')
      : -1;

    if (index === -1) {
      return [];
    }

    return response
      ? (response.data[0] as DataFrame).fields[index].values.map((_) => ({
        text: _.toString(),
      }))
      : [];
  }

  /**
   * filterQuery filters the query so it is not executed when a field is
   * missing. We always need the query type in the query.
   */
  filterQuery(query: Query): boolean {
    if (!query.queryType) {
      return false;
    }

    /**
     * If the query type is "kubernetes-containers" we also need the resource,
     * namespace and name.
     */
    if (
      query.queryType === 'kubernetes-containers' &&
      (!query.resourceId || !query.namespace || !query.name)
    ) {
      return false;
    }

    /**
     * If the query type is "kubernetes-resources" we also need the resource
     * and namespace.
     */
    if (
      query.queryType === 'kubernetes-resources' &&
      (!query.resourceId || !query.namespace)
    ) {
      return false;
    }

    /**
     * If the query type is "kubernetes-logs" we also need the resource,
     * namespace, name and container.
     */
    if (
      query.queryType === 'kubernetes-logs' &&
      (!query.resourceId || !query.namespace || !query.name || !query.container)
    ) {
      return false;
    }

    /**
     * If the query type is "helm-releases" we need a namespace to run the
     * query.
     */
    if (query.queryType === 'helm-releases' && !query.namespace) {
      return false;
    }

    /**
     * If the query type is "helm-release-history" we need a namespace and name
     * to run the query.
     */
    if (
      query.queryType === 'helm-release-history' &&
      (!query.namespace || !query.name)
    ) {
      return false;
    }

    /**
     * If the query type is "flux-resources" need a resource and namespace to
     * run the query.
     */
    if (
      query.queryType === 'flux-resources' &&
      (!query.resourceId || !query.namespace)
    ) {
      return false;
    }

    return true;
  }
}
