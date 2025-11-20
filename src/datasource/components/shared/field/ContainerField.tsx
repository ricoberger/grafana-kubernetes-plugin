import React from 'react';
import { Combobox, ComboboxOption, InlineField } from '@grafana/ui';
import { useAsync } from 'react-use';

import { DataSource } from '../../../datasource';

interface Props {
  datasource: DataSource;
  resourceId?: string;
  namespace?: string;
  name?: string;
  container?: string;
  onContainerChange: (value: string) => void;
}

export function ContainerField({
  datasource,
  resourceId,
  namespace,
  name,
  container,
  onContainerChange,
}: Props) {
  const state = useAsync(async (): Promise<ComboboxOption[]> => {
    if (!resourceId || !namespace || !name) {
      return [];
    }

    const result = await datasource.metricFindQuery({
      refId: 'kubernetes-containers',
      queryType: 'kubernetes-containers',
      resourceId: resourceId,
      namespace: namespace,
      name: name,
    });

    const containers = result.map((value) => {
      return { value: value.text };
    });
    return containers;
  }, [datasource, resourceId, namespace, name]);

  return (
    <InlineField label="Container">
      <Combobox<string>
        value={container}
        createCustomValue={true}
        options={state.value || []}
        onChange={(option: ComboboxOption<string>) => {
          onContainerChange(option.value);
        }}
      />
    </InlineField>
  );
}
