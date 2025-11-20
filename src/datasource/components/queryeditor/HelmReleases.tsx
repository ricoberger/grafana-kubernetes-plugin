import React from 'react';
import { InlineFieldRow } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';

import { DataSource } from '../../datasource';
import { Query } from '../../types/query';
import { DataSourceOptions } from '../../types/settings';
import { NamespaceField } from '../shared/field/NamespaceField';

type Props = QueryEditorProps<DataSource, Query, DataSourceOptions>;

export function HelmReleases({
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
            onChange({ ...query, namespace: value });
            onRunQuery();
          }}
        />
      </InlineFieldRow>
    </>
  );
}
