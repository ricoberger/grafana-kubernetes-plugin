import React from 'react';
import { Combobox, ComboboxOption, InlineField } from '@grafana/ui';
import { useAsync } from 'react-use';

import { DataSource } from '../../../datasource';

interface Props {
  datasource: DataSource;
  namespace?: string;
  onNamespaceChange: (value: string) => void;
}

export function NamespaceField({
  datasource,
  namespace,
  onNamespaceChange,
}: Props) {
  const state = useAsync(async (): Promise<ComboboxOption[]> => {
    const result = await datasource.metricFindQuery({
      refId: 'kubernetes-namespaces',
      queryType: 'kubernetes-namespaces',
    });

    const namespaces = result.map((value) => {
      return { value: value.text };
    });
    return namespaces;
  }, [datasource]);

  return (
    <InlineField label="Namespace">
      <Combobox<string>
        value={namespace}
        createCustomValue={true}
        options={state.value || []}
        onChange={(option: ComboboxOption<string>) => {
          onNamespaceChange(option.value);
        }}
      />
    </InlineField>
  );
}
