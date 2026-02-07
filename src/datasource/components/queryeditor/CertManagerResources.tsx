import React from 'react';
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
import { NamespaceField } from '../shared/field/NamespaceField';

type Props = QueryEditorProps<DataSource, Query, DataSourceOptions>;

export function CertManagerResources({
  datasource,
  query,
  onChange,
  onRunQuery,
}: Props) {
  return (
    <>
      <InlineFieldRow>
        <InlineField label="Resource">
          <Combobox<string>
            value={query.resourceId}
            createCustomValue={true}
            options={[
              { label: 'Issuer', value: 'issuer.cert-manager.io' },
              { label: 'Order', value: 'order.acme.cert-manager.io' },
              { label: 'Challenge', value: 'challenge.acme.cert-manager.io' },
              {
                label: 'ClusterIssuer',
                value: 'clusterissuer.cert-manager.io',
              },
              {
                label: 'CertificateRequest',
                value: 'certificaterequest.cert-manager.io',
              },
              { label: 'Certificate', value: 'certificate.cert-manager.io' },
            ]}
            onChange={(option: ComboboxOption<string>) => {
              onChange({ ...query, resourceId: option.value });
              onRunQuery();
            }}
          />
        </InlineField>
        <NamespaceField
          datasource={datasource}
          namespace={query.namespace}
          onNamespaceChange={(value) => {
            onChange({ ...query, namespace: value });
            onRunQuery();
          }}
        />
      </InlineFieldRow>
    </>
  );
}
