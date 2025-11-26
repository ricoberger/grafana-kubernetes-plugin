import React from 'react';
import { QueryEditorProps } from '@grafana/data';
import { InlineFieldRow } from '@grafana/ui';

import { DataSource } from '../../datasource';
import { Query } from '../../types/query';
import { DataSourceOptions } from '../../types/settings';
import { ResourceIdField } from '../shared/field/ResourceIdField';
import { NamespaceField } from '../shared/field/NamespaceField';
import { ResourceNameField } from '../shared/field/ResourceNameField';

interface Props
  extends QueryEditorProps<DataSource, any, DataSourceOptions, Query> { }

export function KubernetesContainers({ datasource, query, onChange }: Props) {
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
        <ResourceNameField
          datasource={datasource}
          resourceId={query.resourceId}
          namespace={query.namespace}
          name={query.name}
          onNameChange={(value) => {
            onChange({ ...query, name: value });
          }}
        />
      </InlineFieldRow>
    </>
  );
}
