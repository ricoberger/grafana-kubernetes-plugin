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

export function FluxResources({
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
              {
                label: 'Bucket',
                value: 'bucket.source.toolkit.fluxcd.io',
              },
              {
                label: 'GitRepository',
                value: 'gitrepository.source.toolkit.fluxcd.io',
              },
              {
                label: 'HelmChart',
                value: 'helmchart.source.toolkit.fluxcd.io',
              },
              {
                label: 'HelmRepository',
                value: 'helmrepository.source.toolkit.fluxcd.io',
              },
              {
                label: 'OCIRepository',
                value: 'ocirepository.source.toolkit.fluxcd.io',
              },
              {
                label: 'Kustomization',
                value: 'kustomization.kustomize.toolkit.fluxcd.io',
              },
              {
                label: 'HelmRelease',
                value: 'helmrelease.helm.toolkit.fluxcd.io',
              },
              {
                label: 'ImagePolicy',
                value: 'imagepolicy.image.toolkit.fluxcd.io',
              },
              {
                label: 'ImageRepository',
                value: 'imagerepository.image.toolkit.fluxcd.io',
              },
              {
                label: 'ImageUpdateAutomation',
                value: 'imageupdateautomation.image.toolkit.fluxcd.io',
              },
              {
                label: 'Alert',
                value: 'alert.notification.toolkit.fluxcd.io',
              },
              {
                label: 'Provider',
                value: 'provider.notification.toolkit.fluxcd.io',
              },
              {
                label: 'Receiver',
                value: 'receiver.notification.toolkit.fluxcd.io',
              },
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
