import React, { ChangeEvent } from 'react';
import {
  InlineField,
  InlineFieldRow,
  InlineSwitch,
  Input,
  RadioButtonGroup,
} from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';

import { DataSource } from '../../datasource';
import { Query } from '../../types/query';
import { DataSourceOptions } from '../../types/settings';
import { ResourceIdField } from '../shared/field/ResourceIdField';
import { NamespaceField } from '../shared/field/NamespaceField';

type Props = QueryEditorProps<DataSource, Query, DataSourceOptions>;

export function KubernetesResources({
  datasource,
  query,
  onChange,
  onRunQuery,
}: Props) {
  return (
    <>
      <InlineFieldRow>
        <ResourceIdField
          datasource={datasource}
          resourceId={query.resourceId}
          onResourceIdChange={(value) => {
            onChange({ ...query, resourceId: value });
            onRunQuery();
          }}
        />
        <NamespaceField
          datasource={datasource}
          namespace={query.namespace}
          onNamespaceChange={(value) => {
            onChange({ ...query, namespace: value });
            onRunQuery();
          }}
        />
        <InlineField label="Wide">
          <InlineSwitch
            value={query.wide || false}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              onChange({ ...query, wide: event.target.checked });
              onRunQuery();
            }}
          />
        </InlineField>
      </InlineFieldRow>
      <InlineFieldRow>
        <InlineField label="Selector">
          <RadioButtonGroup<string>
            options={[
              { label: 'None', value: '' },
              { label: 'Label', value: 'labelSelector' },
              { label: 'Field', value: 'fieldSelector' },
              { label: 'JSONPath', value: 'jsonPath' },
              { label: 'Regex', value: 'regex' },
            ]}
            value={query.parameterName || ''}
            onChange={(value: string) => {
              onChange({
                ...query,
                parameterName: value,
                parameterValue: value === '' ? '' : query.parameterValue,
              });
              onRunQuery();
            }}
          />
        </InlineField>
        <InlineField
          label="Value"
          grow={true}
          disabled={
            query.parameterName !== 'labelSelector' &&
            query.parameterName !== 'fieldSelector' &&
            query.parameterName !== 'jsonPath' &&
            query.parameterName !== 'regex'
          }
        >
          <Input
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              onChange({ ...query, parameterValue: event.target.value });
            }}
            value={query.parameterValue || ''}
          />
        </InlineField>
      </InlineFieldRow>
    </>
  );
}
