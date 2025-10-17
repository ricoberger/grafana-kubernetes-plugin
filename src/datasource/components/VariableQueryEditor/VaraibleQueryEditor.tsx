import React from 'react';

import { QueryEditorProps } from '@grafana/data';
import {
  InlineFieldRow,
  InlineField,
  Combobox,
  ComboboxOption,
} from '@grafana/ui';

import { DataSource } from '../../datasource';
import { DEFAULT_QUERIES, Query, QueryType } from '../../types/query';
import { DataSourceOptions } from '../../types/settings';
import { KubernetesResources } from './KubernetesResources';
import { KubernetesContainers } from './KubernetesContainers';

interface Props
  extends QueryEditorProps<DataSource, any, DataSourceOptions, Query> { }

export function VariableQueryEditor(props: Props) {
  const { query, onChange } = props;

  /**
   * Handle "queryType" field change. If the "queryType" is changed we also set
   * the default queriy for that query tpe.
   */
  const onTypeChange = (option: ComboboxOption<QueryType>) => {
    onChange({
      ...query,
      ...DEFAULT_QUERIES[option.value],
      queryType: option.value,
    });
  };

  return (
    <>
      <InlineFieldRow>
        <InlineField label="Type">
          <Combobox<QueryType>
            value={query.queryType}
            options={[
              {
                label: 'Kubernetes: Resources IDs',
                value: 'kubernetes-resourceids',
              },
              {
                label: 'Kubernetes: Namespaces',
                value: 'kubernetes-namespaces',
              },
              {
                label: 'Kubernetes: Containers',
                value: 'kubernetes-containers',
              },
              { label: 'Kubernetes: Resources', value: 'kubernetes-resources' },
            ]}
            onChange={onTypeChange}
          />
        </InlineField>
      </InlineFieldRow>

      {query.queryType === 'kubernetes-containers' && (
        <KubernetesContainers {...props} />
      )}

      {query.queryType === 'kubernetes-resources' && (
        <KubernetesResources {...props} />
      )}
    </>
  );
}
