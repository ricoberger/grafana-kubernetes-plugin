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
  const [resourceIds, setResourceIds] = useState<ComboboxOption[]>([]);
  const [namespaces, setNamespaces] = useState<ComboboxOption[]>([]);

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
   * Handle "resourceId" field change.
   *
   * When the resource id changes we also immediately run the query, so that the
   * user gets instant feedback in the UI.
   */
  const onResourceIdChange = (option: ComboboxOption<string>) => {
    onChange({ ...query, resourceId: option.value });
    onRunQuery();
  };

  /**
   * Handle "namespace" field change.
   *
   * When the namespace changes we also immediately run the query, so that the
   * user gets instant feedback in the UI.
   */
  const onNamespaceChange = (option: ComboboxOption<string>) => {
    onChange({ ...query, namespace: option.value });
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
            value={query.resourceId}
            createCustomValue={true}
            options={resourceIds}
            onChange={onResourceIdChange}
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
