import React, { ChangeEvent } from 'react';
import { QueryEditorProps } from '@grafana/data';
import {
  InlineFieldRow,
  InlineField,
  Input,
  InlineSwitch,
  RadioButtonGroup,
} from '@grafana/ui';

import { DataSource } from '../../datasource';
import { Query } from '../../types/query';
import { DataSourceOptions } from '../../types/settings';
import { NamespaceField } from '../shared/field/NamespaceField';
import { ResourceIdField } from '../shared/field/ResourceIdField';

interface Props
  extends QueryEditorProps<DataSource, any, DataSourceOptions, Query> { }

export function KubernetesResources({ datasource, query, onChange }: Props) {
  return (
    <>
      <InlineFieldRow>
        <ResourceIdField
          datasource={datasource}
          resourceId={query.resourceId}
          onResourceIdChange={(value) => {
            onChange({ ...query, resourceId: value });
          }}
        />
        <NamespaceField
          datasource={datasource}
          namespace={query.namespace}
          onNamespaceChange={(value) => {
            onChange({ ...query, namespace: value });
          }}
        />
        <InlineField label="Wide">
          <InlineSwitch
            value={query.wide || false}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              onChange({ ...query, wide: event.target.checked });
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
            ]}
            value={query.parameterName || ''}
            onChange={(value: string) => {
              onChange({
                ...query,
                parameterName: value,
                parameterValue: value === '' ? '' : query.parameterValue,
              });
            }}
          />
        </InlineField>
        <InlineField
          label="Value"
          grow={true}
          disabled={
            query.parameterName !== 'labelSelector' &&
            query.parameterName !== 'fieldSelector' &&
            query.parameterName !== 'jsonPath'
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
      <InlineFieldRow>
        <InlineField label="Field" grow={true}>
          <Input
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              onChange({ ...query, variableField: event.target.value });
            }}
            value={query.variableField || ''}
          />
        </InlineField>
      </InlineFieldRow>
    </>
  );
}
