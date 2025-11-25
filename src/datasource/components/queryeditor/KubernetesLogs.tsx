import React, { ChangeEvent } from 'react';
import {
  Combobox,
  ComboboxOption,
  InlineField,
  InlineFieldRow,
  Input,
} from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';

import { DataSource } from '../../datasource';
import { Query } from '../../types/query';
import { DataSourceOptions } from '../../types/settings';
import { NamespaceField } from '../shared/field/NamespaceField';
import { ResourceNameField } from '../shared/field/ResourceNameField';
import { ContainerField } from '../shared/field/ContainerField';

type Props = QueryEditorProps<DataSource, Query, DataSourceOptions>;

export function KubernetesLogs({
  datasource,
  query,
  onChange,
  onRunQuery,
}: Props) {
  return (
    <>
      <InlineFieldRow>
        <InlineField label="Resource">
          <Combobox<string>
            value={query.resourceId}
            createCustomValue={true}
            options={[
              { value: 'daemonset.apps', label: 'DaemonSet' },
              { value: 'deployment.apps', label: 'Deployment' },
              { value: 'pod', label: 'Pod' },
              { value: 'job.batch', label: 'Job' },
              { value: 'statefulset.apps', label: 'StatefulSet' },
            ]}
            onChange={(option: ComboboxOption<string>) => {
              onChange({
                ...query,
                resourceId: option.value,
                name: '',
                container: '',
              });
              onRunQuery();
            }}
          />
        </InlineField>
        <NamespaceField
          datasource={datasource}
          namespace={query.namespace}
          onNamespaceChange={(value) => {
            onChange({ ...query, namespace: value, name: '', container: '' });
            onRunQuery();
          }}
        />
        <ResourceNameField
          datasource={datasource}
          resourceId={query.resourceId}
          namespace={query.namespace}
          name={query.name}
          onNameChange={(value) => {
            onChange({ ...query, name: value, container: '' });
            onRunQuery();
          }}
        />
        <ContainerField
          datasource={datasource}
          resourceId={query.resourceId}
          namespace={query.namespace}
          name={query.name}
          container={query.container}
          onContainerChange={(value) => {
            onChange({ ...query, container: value });
            onRunQuery();
          }}
        />
      </InlineFieldRow>
      <InlineFieldRow>
        <InlineField label="Tail">
          <Input
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              onChange({ ...query, tail: parseInt(event.target.value, 10) });
            }}
            value={query.tail || 0}
          />
        </InlineField>
        <InlineField label="Filter" grow={true}>
          <Input
            id="query-editor-filter"
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              onChange({ ...query, filter: event.target.value });
            }}
            value={query.filter || ''}
          />
        </InlineField>
      </InlineFieldRow>
    </>
  );
}
