import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  CustomVariableSupport,
  DataQueryRequest,
  MetricFindValue,
  ScopedVars,
  TimeRange,
} from '@grafana/data';

import { VariableQueryEditor } from './components/VariableQueryEditor/VaraibleQueryEditor';
import { DataSource } from './datasource';
import { Query } from './types/query';

export class VariableSupport extends CustomVariableSupport<DataSource, Query> {
  editor = VariableQueryEditor;

  constructor(private datasource: DataSource) {
    super();
  }

  execute = async (query: Query, scopedVars: ScopedVars, range: TimeRange) => {
    return this.datasource.metricFindQuery(query, { scopedVars, range });
  };

  query = (
    request: DataQueryRequest<Query>,
  ): Observable<{ data: MetricFindValue[] }> => {
    const result = this.execute(
      request.targets[0],
      request.scopedVars,
      request.range,
    );

    return from(result).pipe(map((data) => ({ data })));
  };
}
