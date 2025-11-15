import React, { ChangeEvent, useEffect, useState } from 'react';
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

type Props = QueryEditorProps<DataSource, Query, DataSourceOptions>;

export function KubernetesLogs({
  datasource,
  query,
  onChange,
  onRunQuery,
}: Props) {
  const [namespaces, setNamespaces] = useState<ComboboxOption[]>([]);
  const [names, setNames] = useState<ComboboxOption[]>([]);
  const [containers, setContainers] = useState<ComboboxOption[]>([]);

  /**
   * Fetch available namespaces from the datasource, which can then be used as
   * options in the "namespace" field.
   */
  useEffect(() => {
    const fetchNamespaces = async () => {
      const result = await datasource.metricFindQuery({
        refId: 'kubernetes-namespaces',
        queryType: 'kubernetes-namespaces',
      });

      setNamespaces(
        result.map((value) => {
          return { value: value.text };
        }),
      );
    };

    fetchNamespaces();
  }, [datasource]);

  /**
   * Fetch available names from the datasource, which can then be used as
   * options in the "name" field. The names are only fetched when a "namespace"
   * is selected.
   */
  useEffect(() => {
    const fetchNames = async () => {
      const result = await datasource.metricFindQuery({
        refId: 'kubernetes-resources',
        queryType: 'kubernetes-resources',
        variableField: 'Name',
        resourceId: query.resourceId,
        namespace: query.namespace,
      });

      setNames(
        result.map((value) => {
          return { value: value.text };
        }),
      );
    };

    if (query.namespace) {
      fetchNames();
    }
  }, [datasource, query.resourceId, query.namespace]);

  /**
   * Fetch available containers from the datasource, which can then be used as
   * options in the "container" field. The containers are only fetched when a
   * "namespace" or "name" is selected.
   */
  useEffect(() => {
    const fetchContainers = async () => {
      const result = await datasource.metricFindQuery({
        refId: 'kubernetes-containers',
        queryType: 'kubernetes-containers',
        resourceId: query.resourceId,
        namespace: query.namespace,
        name: query.name,
      });

      setContainers(
        result.map((value) => {
          return { value: value.text };
        }),
      );

      if (result.length > 0 && !query.container) {
        onChange({ ...query, container: result[0].text });
      }
    };

    if (query.namespace && query.name) {
      fetchContainers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasource, query.resourceId, query.namespace, query.name]);

  /**
   * Handle "resourceId" field change. If the "resourceId" changes we also clear
   * the "name" and "container" fields, because the newly selected resource
   * might not have the same names and containers as the previously selected
   * one.
   *
   * When the resource id changes we also immediately run the query, so that the
   * user gets instant feedback in the UI.
   */
  const onResourceChange = (option: ComboboxOption<string>) => {
    onChange({ ...query, resourceId: option.value, name: '', container: '' });
    onRunQuery();
  };

  /**
   * Handle "namespace" field change. If the "namespace" changes we also clear
   * the "name" and "container" fields, because the newly selected namespace
   * might not have the same resources as the previously selected one.
   *
   * When the namespace changes we also immediately run the query, so that the
   * user gets instant feedback in the UI.
   */
  const onNamespaceChange = (option: ComboboxOption<string>) => {
    onChange({ ...query, namespace: option.value, name: '', container: '' });
    onRunQuery();
  };

  /**
   * Handle "name" field change. If the "name" changes we also reset the
   * "container" field, because the newly selected resource might not have the
   * same containers as the previously selected one.
   *
   * When the name changes we also immediately run the query, so that the user
   * gets instant feedback in the UI.
   */
  const onNameChange = (option: ComboboxOption<string>) => {
    onChange({ ...query, name: option.value, container: '' });
    onRunQuery();
  };

  /**
   * Handle "container" field change.
   *
   * When the container changes we also immediately run the query, so that the
   * user gets instant feedback in the UI.
   */
  const onContainerChange = (option: ComboboxOption<string>) => {
    onChange({ ...query, container: option.value });
    onRunQuery();
  };

  /**
   * Handle "filter" field change.
   */
  const onFilterChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...query, filter: event.target.value });
  };

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
            onChange={onResourceChange}
          />
        </InlineField>
        <InlineField label="Namespace">
          <Combobox<string>
            value={query.namespace}
            createCustomValue={true}
            options={namespaces}
            onChange={onNamespaceChange}
          />
        </InlineField>
        <InlineField label="Name">
          <Combobox<string>
            value={query.name}
            createCustomValue={true}
            options={names}
            onChange={onNameChange}
          />
        </InlineField>
        <InlineField label="Container">
          <Combobox<string>
            value={query.container}
            createCustomValue={true}
            options={containers}
            onChange={onContainerChange}
          />
        </InlineField>
      </InlineFieldRow>
      <InlineFieldRow>
        <InlineField label="Filter" grow={true}>
          <Input
            id="query-editor-filter"
            onChange={onFilterChange}
            value={query.filter || ''}
          />
        </InlineField>
      </InlineFieldRow>
    </>
  );
}
