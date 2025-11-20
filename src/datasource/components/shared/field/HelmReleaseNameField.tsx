import React from 'react';
import { Combobox, ComboboxOption, InlineField } from '@grafana/ui';
import { useAsync } from 'react-use';

import { DataSource } from '../../../datasource';

interface Props {
  datasource: DataSource;
  namespace?: string;
  name?: string;
  onNameChange: (value: string) => void;
}

export function HelmReleaseNameField({
  datasource,
  namespace,
  name,
  onNameChange,
}: Props) {
  const state = useAsync(async (): Promise<ComboboxOption[]> => {
    if (!namespace) {
      return [];
    }

    const result = await datasource.metricFindQuery({
      refId: 'helm-releases',
      queryType: 'helm-releases',
      variableField: 'Name',
      namespace: namespace,
    });

    const names = result.map((value) => {
      return { value: value.text };
    });
    return names;
  }, [datasource, namespace]);

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
