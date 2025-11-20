import React, { ChangeEvent } from 'react';
import { QueryEditorProps } from '@grafana/data';
import { InlineFieldRow, InlineField, Input } from '@grafana/ui';

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
