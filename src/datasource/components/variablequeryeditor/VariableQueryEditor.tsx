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

export function VariableQueryEditor({
  datasource,
  query,
  onChange,
  onRunQuery,
}: Props) {
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
            onChange={(option: ComboboxOption<QueryType>) => {
              onChange({
                ...query,
                ...DEFAULT_QUERIES[option.value],
                queryType: option.value,
              });
            }}
          />
        </InlineField>
      </InlineFieldRow>

      {query.queryType === 'kubernetes-containers' && (
        <KubernetesContainers
          datasource={datasource}
          query={query}
          onChange={onChange}
          onRunQuery={onRunQuery}
        />
      )}

      {query.queryType === 'kubernetes-resources' && (
        <KubernetesResources
          datasource={datasource}
          query={query}
          onChange={onChange}
          onRunQuery={onRunQuery}
        />
      )}
    </>
  );
}
