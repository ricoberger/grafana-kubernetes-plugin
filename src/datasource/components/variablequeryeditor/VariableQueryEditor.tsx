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
  return (
    <>
      <InlineFieldRow>
        <InlineField label="Type">
          <Combobox<QueryType>
            value={props.query.queryType}
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
              props.onChange({
                ...props.query,
                ...DEFAULT_QUERIES[option.value],
                queryType: option.value,
              });
            }}
          />
        </InlineField>
      </InlineFieldRow>

      {props.query.queryType === 'kubernetes-containers' && (
        <KubernetesContainers {...props} />
      )}

      {props.query.queryType === 'kubernetes-resources' && (
        <KubernetesResources {...props} />
      )}
    </>
  );
}
