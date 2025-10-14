import React, { ChangeEvent, useEffect, useState } from 'react';
import {
  Combobox,
  ComboboxOption,
  InlineField,
  InlineFieldRow,
  InlineSwitch,
  Input,
  RadioButtonGroup,
} from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';

import { DataSource } from '../../datasource';
import { Query } from '../../types/query';
import { DataSourceOptions } from '../../types/settings';

type Props = QueryEditorProps<DataSource, Query, DataSourceOptions>;

export function KubernetesResources({
  datasource,
  query,
  onChange,
  onRunQuery,
}: Props) {
  const [resources, setResources] = useState<ComboboxOption[]>([]);
  const [namespaces, setNamespaces] = useState<ComboboxOption[]>([]);

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
   * Handle "resource" field change. If the "resource" changes we also clear the
   * "name" and "container" fields, because the newly selected resource might
   * not have the same names and containers as the previously selected one.
   *
   * When the namespace changes we also immediately run the query, so that the
   * user gets instant feedback in the UI.
   */
  const onResourceChange = (option: ComboboxOption<string>) => {
    onChange({ ...query, resource: option.value, name: '', container: '' });
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
   * Handle "wide" field change.
   *
   * When the wide changes we also immediately run the query, so that the user
   * gets instant feedback in the UI.
   */
  const onWideChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...query, wide: event.target.checked });
    onRunQuery();
  };

  /**
   * Handle "parameterName" field change. If the "parameterName" is
   * cleared we also clear the "parameterValue".
   *
   * When the parameterName changes we also immediately run the query, so that
   * the user gets instant feedback in the UI.
   */
  const onParameterNameChange = (value: string) => {
    onChange({
      ...query,
      parameterName: value,
      parameterValue: value === '' ? '' : query.parameterValue,
    });
    onRunQuery();
  };

  /**
   * Handle "parameterValue" field change.
   */
  const onParameterValueChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...query, parameterValue: event.target.value });
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
        <InlineField label="Wide">
          <InlineSwitch value={query.wide || false} onChange={onWideChange} />
        </InlineField>
      </InlineFieldRow>
      <InlineFieldRow>
        <InlineField label="Selector">
          <RadioButtonGroup<string>
            options={[
              { label: 'None', value: '' },
              { label: 'Label', value: 'labelSelector' },
              { label: 'Field', value: 'fieldSelector' },
            ]}
            value={query.parameterName || ''}
            onChange={onParameterNameChange}
          />
        </InlineField>
        <InlineField
          label="Value"
          grow={true}
          disabled={query.parameterName === ''}
        >
          <Input
            onChange={onParameterValueChange}
            value={query.parameterValue || ''}
          />
        </InlineField>
      </InlineFieldRow>
    </>
  );
}
