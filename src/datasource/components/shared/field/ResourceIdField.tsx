import React from 'react';
import { Combobox, ComboboxOption, InlineField } from '@grafana/ui';
import { useAsync } from 'react-use';

import { DataSource } from '../../../datasource';

interface Props {
  datasource: DataSource;
  resourceId?: string;
  onResourceIdChange: (value: string) => void;
}

export function ResourceIdField({
  datasource,
  resourceId,
  onResourceIdChange,
}: Props) {
  const state = useAsync(async (): Promise<ComboboxOption[]> => {
    const result = await datasource.metricFindQuery({
      refId: 'kubernetes-resourceids',
      queryType: 'kubernetes-resourceids',
    });

    const resourceIds = result.map((value) => {
      return { value: value.value as string, label: value.text };
    });
    return resourceIds;
  }, [datasource]);

  return (
    <InlineField label="Resource">
      <Combobox<string>
        value={resourceId}
        createCustomValue={true}
        options={state.value || []}
        onChange={(option: ComboboxOption<string>) => {
          onResourceIdChange(option.value);
        }}
      />
    </InlineField>
  );
}
