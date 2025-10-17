import React, { ChangeEvent, useEffect, useState } from 'react';

import { QueryEditorProps } from '@grafana/data';
import {
  InlineFieldRow,
  InlineField,
  Input,
  ComboboxOption,
  Combobox,
} from '@grafana/ui';

import { DataSource } from '../../datasource';
import { Query } from '../../types/query';
import { DataSourceOptions } from '../../types/settings';

interface Props
  extends QueryEditorProps<DataSource, any, DataSourceOptions, Query> { }

export function KubernetesResources(props: Props) {
  const [resources, setResources] = useState<ComboboxOption[]>([]);
  const [namespaces, setNamespaces] = useState<ComboboxOption[]>([]);
  const { datasource, query, onChange } = props;

  /**
   * Fetch available resource kinds from the datasource, which can then be used
   * as options in the "resource" field.
   */
  useEffect(() => {
    const fetchResources = async () => {
      const result = await datasource.metricFindQuery({
        refId: 'kubernetes-resourceids',
        queryType: 'kubernetes-resourceids',
      });

      setResources(
        result.map((value) => {
          return { value: value.text };
        }),
      );
    };

    fetchResources();
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
   * Handle "resource" field change.
   */
  const onResourceChange = (option: ComboboxOption<string>) => {
    onChange({ ...query, resource: option.value });
  };

  /**
   * Handle "namespace" field change.
   */
  const onNamespaceChange = (option: ComboboxOption<string>) => {
    onChange({ ...query, namespace: option.value });
  };

  /**
   * Handle "variableField" field change.
   */
  const onVariableFieldChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...query, variableField: event.target.value });
  };

  return (
    <>
      <InlineFieldRow>
        <InlineField label="Resource">
          <Combobox<string>
            value={query.resource}
            createCustomValue={true}
            options={resources}
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
        <InlineField label="Field" grow={true}>
          <Input
            onChange={onVariableFieldChange}
            value={query.variableField || ''}
          />
        </InlineField>
      </InlineFieldRow>
    </>
  );
}
