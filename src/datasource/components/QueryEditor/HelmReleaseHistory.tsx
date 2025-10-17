import React, { useEffect, useState } from 'react';
import {
  Combobox,
  ComboboxOption,
  InlineField,
  InlineFieldRow,
} from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';

import { DataSource } from '../../datasource';
import { Query } from '../../types/query';
import { DataSourceOptions } from '../../types/settings';

type Props = QueryEditorProps<DataSource, Query, DataSourceOptions>;

export function HelmReleaseHistory({
  datasource,
  query,
  onChange,
  onRunQuery,
}: Props) {
  const [namespaces, setNamespaces] = useState<ComboboxOption[]>([]);
  const [names, setNames] = useState<ComboboxOption[]>([]);

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
        refId: 'helm-releases',
        queryType: 'helm-releases',
        variableField: 'Name',
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
  }, [datasource, query.namespace]);

  /**
   * Handle "namespace" field change. If the "namespace" changes we also clear
   * the "name" field, because the newly selected namespace might not have the
   * same resources as the previously selected one.
   *
   * When the namespace changes we also immediately run the query, so that the
   * user gets instant feedback in the UI.
   */
  const onNamespaceChange = (option: ComboboxOption<string>) => {
    onChange({ ...query, namespace: option.value, name: '' });
    onRunQuery();
  };

  /**
   * Handle "name" field change.
   *
   * When the name changes we also immediately run the query, so that the user
   * gets instant feedback in the UI.
   */
  const onNameChange = (option: ComboboxOption<string>) => {
    onChange({ ...query, name: option.value });
    onRunQuery();
  };

  return (
    <>
      <InlineFieldRow>
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
      </InlineFieldRow>
    </>
  );
}
