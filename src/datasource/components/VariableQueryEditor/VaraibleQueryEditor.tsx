import React from 'react';

import { QueryEditorProps } from '@grafana/data';
import { InlineField, RadioButtonGroup } from '@grafana/ui';

import { DataSource } from '../../datasource';
import { Query, QueryType } from '../../types/query';
import { DataSourceOptions } from '../../types/settings';

interface Props
  extends QueryEditorProps<DataSource, any, DataSourceOptions, Query> { }

export function VariableQueryEditor(props: Props) {
  const { query, onChange } = props;

  /**
   * Handle "queryType" field change. We support "kubernetes-resourceids" and
   * "kubernetes-namespaces" queries for variables.
   */
  const onTypeChange = (value: QueryType) => {
    onChange({ ...query, queryType: value });
  };

  return (
    <>
      <InlineField label="Type" labelWidth={20}>
        <RadioButtonGroup<QueryType>
          options={[
            { label: 'Resources', value: 'kubernetes-resourceids' },
            { label: 'Namespaces', value: 'kubernetes-namespaces' },
          ]}
          value={query.queryType}
          onChange={onTypeChange}
        />
      </InlineField>
    </>
  );
}
