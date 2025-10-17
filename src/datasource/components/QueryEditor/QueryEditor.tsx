import React from 'react';
import {
  Combobox,
  ComboboxOption,
  InlineField,
  InlineFieldRow,
} from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';

import { DataSource } from '../../datasource';
import { DEFAULT_QUERIES, Query, QueryType } from '../../types/query';
import { DataSourceOptions } from '../../types/settings';
import { KubernetesLogs } from './KubernetesLogs';
import { KubernetesResources } from './KubernetesResources';
import { HelmReleases } from './HelmReleases';
import { HelmReleaseHistory } from './HelmReleaseHistory';
import { FluxResources } from './FluxResources';

type Props = QueryEditorProps<DataSource, Query, DataSourceOptions>;

export function QueryEditor({
  datasource,
  query,
  onChange,
  onRunQuery,
}: Props) {
  /**
   * Handle "queryType" field change. If the "queryType" is changed we also set
   * the default queriy for that query tpe.
   *
   * When the query type changes we also immediately run the query, so that the
   * user gets instant feedback in the UI.
   */
  const onTypeChange = (option: ComboboxOption<QueryType>) => {
    onChange({
      ...query,
      ...DEFAULT_QUERIES[option.value],
      queryType: option.value,
    });
    onRunQuery();
  };

  return (
    <>
      <InlineFieldRow>
        <InlineField label="Type">
          <Combobox<QueryType>
            value={query.queryType}
            options={[
              { label: 'Kubernetes: Resources', value: 'kubernetes-resources' },
              { label: 'Kubernetes: Logs', value: 'kubernetes-logs' },
              { label: 'Helm Releases', value: 'helm-releases' },
              { label: 'Helm Release History', value: 'helm-release-history' },
              { label: 'Flux: Resources', value: 'flux-resources' },
            ]}
            onChange={onTypeChange}
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

      {query.queryType === 'flux-resources' && (
        <FluxResources
          datasource={datasource}
          query={query}
          onChange={onChange}
          onRunQuery={onRunQuery}
        />
      )}
    </>
  );
}
