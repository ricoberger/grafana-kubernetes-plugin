import React from 'react';
import { Combobox, ComboboxOption, InlineField } from '@grafana/ui';
import { useAsync } from 'react-use';

import { DataSource } from '../../../datasource';

interface Props {
  datasource: DataSource;
  resourceId?: string;
  namespace?: string;
  name?: string;
  onNameChange: (value: string) => void;
}

export function ResourceNameField({
  datasource,
  resourceId,
  namespace,
  name,
  onNameChange,
}: Props) {
  const state = useAsync(async (): Promise<ComboboxOption[]> => {
    if (!resourceId || !namespace) {
      return [];
    }

    const result = await datasource.metricFindQuery({
      refId: 'kubernetes-resources',
      queryType: 'kubernetes-resources',
      variableField: 'Name',
      resourceId: resourceId,
      namespace: namespace,
    });

    const names = result.map((value) => {
      return { value: value.text };
    });
    return names;
  }, [datasource, resourceId, namespace]);

  return (
    <InlineField label="Name">
      <Combobox<string>
        value={name}
        createCustomValue={true}
        options={state.value || []}
        onChange={(option: ComboboxOption<string>) => {
          onNameChange(option.value);
        }}
      />
    </InlineField>
  );
}
