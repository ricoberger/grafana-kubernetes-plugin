import React, { useEffect, useState } from 'react';

import { QueryEditorProps } from '@grafana/data';
import {
  InlineFieldRow,
  InlineField,
  ComboboxOption,
  Combobox,
} from '@grafana/ui';

import { DataSource } from '../../datasource';
import { Query } from '../../types/query';
import { DataSourceOptions } from '../../types/settings';

interface Props
  extends QueryEditorProps<DataSource, any, DataSourceOptions, Query> { }

export function KubernetesContainers(props: Props) {
  const [resourceIds, setResourceIds] = useState<ComboboxOption[]>([]);
  const [namespaces, setNamespaces] = useState<ComboboxOption[]>([]);
  const [names, setNames] = useState<ComboboxOption[]>([]);
  const { datasource, query, onChange } = props;

  /**
   * Fetch available resource ids from the datasource, which can then be used
   * as options in the "resourceId" field.
   */
  useEffect(() => {
    const fetchResourceIds = async () => {
      const result = await datasource.metricFindQuery({
        refId: 'kubernetes-resourceids',
        queryType: 'kubernetes-resourceids',
      });

      setResourceIds(
        result.map((value) => {
          return { value: value.value as string, label: value.text };
        }),
      );
    };

    fetchResourceIds();
  }, [datasource]);

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
   * options in the "name" field.
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

    fetchNames();
  }, [datasource, query.resourceId, query.namespace]);

  /**
   * Handle "resourceId" field change.
   */
  const onResourceChange = (option: ComboboxOption<string>) => {
    onChange({ ...query, resourceId: option.value });
  };

  /**
   * Handle "namespace" field change.
   */
  const onNamespaceChange = (option: ComboboxOption<string>) => {
    onChange({ ...query, namespace: option.value });
  };

  /**
   * Handle "name" field change.
   */
  const onNameChange = (option: ComboboxOption<string>) => {
    onChange({ ...query, name: option.value });
  };

  return (
    <>
      <InlineFieldRow>
        <InlineField label="Resource">
          <Combobox<string>
            value={query.resourceId}
            createCustomValue={true}
            options={resourceIds}
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
      </InlineFieldRow>
    </>
  );
}
