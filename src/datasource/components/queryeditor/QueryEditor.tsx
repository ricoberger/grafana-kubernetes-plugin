import { QueryEditorProps } from '@grafana/data';
import {
  Combobox,
  ComboboxOption,
  InlineField,
  InlineFieldRow,
} from '@grafana/ui';
import React from 'react';

import { DataSource } from '../../datasource';
import { DEFAULT_QUERIES, Query, QueryType } from '../../types/query';
import { DataSourceOptions } from '../../types/settings';
import { HelmReleaseHistory } from './HelmReleaseHistory';
import { HelmReleases } from './HelmReleases';
import { KubernetesLogs } from './KubernetesLogs';
import { KubernetesResources } from './KubernetesResources';

type Props = QueryEditorProps<DataSource, Query, DataSourceOptions>;

export function QueryEditor({
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
              { label: 'Kubernetes: Resources', value: 'kubernetes-resources' },
              { label: 'Kubernetes: Logs', value: 'kubernetes-logs' },
              { label: 'Helm: Releases', value: 'helm-releases' },
              { label: 'Helm: Release History', value: 'helm-release-history' },
            ]}
            onChange={(option: ComboboxOption<QueryType>) => {
              onChange({
                ...query,
                ...DEFAULT_QUERIES[option.value],
                queryType: option.value,
              });
              onRunQuery();
            }}
          />
        </InlineField>
      </InlineFieldRow>

      {query.queryType === 'kubernetes-resources' && (
        <KubernetesResources
          datasource={datasource}
          query={query}
          onChange={onChange}
          onRunQuery={onRunQuery}
        />
      )}

      {query.queryType === 'kubernetes-logs' && (
        <KubernetesLogs
          datasource={datasource}
          query={query}
          onChange={onChange}
          onRunQuery={onRunQuery}
        />
      )}

      {query.queryType === 'helm-releases' && (
        <HelmReleases
          datasource={datasource}
          query={query}
          onChange={onChange}
          onRunQuery={onRunQuery}
        />
      )}

      {query.queryType === 'helm-release-history' && (
        <HelmReleaseHistory
          datasource={datasource}
          query={query}
          onChange={onChange}
          onRunQuery={onRunQuery}
        />
      )}
    </>
  );
}
