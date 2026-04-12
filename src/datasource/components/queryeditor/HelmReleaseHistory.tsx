import { QueryEditorProps } from '@grafana/data';
import { InlineFieldRow } from '@grafana/ui';
import React from 'react';

import { DataSource } from '../../datasource';
import { Query } from '../../types/query';
import { DataSourceOptions } from '../../types/settings';
import { HelmReleaseNameField } from '../shared/field/HelmReleaseNameField';
import { NamespaceField } from '../shared/field/NamespaceField';

type Props = QueryEditorProps<DataSource, Query, DataSourceOptions>;

export function HelmReleaseHistory({
  datasource,
  query,
  onChange,
  onRunQuery,
}: Props) {
  return (
    <>
      <InlineFieldRow>
        <NamespaceField
          datasource={datasource}
          namespace={query.namespace}
          onNamespaceChange={(value) => {
            onChange({ ...query, namespace: value, name: '' });
            onRunQuery();
          }}
        />
        <HelmReleaseNameField
          datasource={datasource}
          namespace={query.namespace}
          name={query.name}
          onNameChange={(value) => {
            onChange({ ...query, name: value });
            onRunQuery();
          }}
        />
      </InlineFieldRow>
    </>
  );
}
