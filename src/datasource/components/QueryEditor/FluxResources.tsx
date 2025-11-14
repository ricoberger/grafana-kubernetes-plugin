import React, { useEffect, useState } from 'react';
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

type Props = QueryEditorProps<DataSource, Query, DataSourceOptions>;

export function FluxResources({
  datasource,
  query,
  onChange,
  onRunQuery,
}: Props) {
  const [namespaces, setNamespaces] = useState<ComboboxOption[]>([]);

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
   *
   * When the namespace changes we also immediately run the query, so that the
   * user gets instant feedback in the UI.
   */
  const onResourceChange = (option: ComboboxOption<string>) => {
    onChange({ ...query, resource: option.value });
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

  return (
    <>
      <InlineFieldRow>
        <InlineField label="Resource">
          <Combobox<string>
            value={query.resource}
            createCustomValue={true}
            options={[
              {
                label: 'Bucket',
                value: 'buckets.source.toolkit.fluxcd.io',
              },
              {
                label: 'GitRepository',
                value: 'gitrepositories.source.toolkit.fluxcd.io',
              },
              {
                label: 'HelmChart',
                value: 'helmcharts.source.toolkit.fluxcd.io',
              },
              {
                label: 'HelmRepository',
                value: 'helmrepositories.source.toolkit.fluxcd.io',
              },
              {
                label: 'OCIRepository',
                value: 'ocirepositories.source.toolkit.fluxcd.io',
              },
              {
                label: 'Kustomization',
                value: 'kustomizations.kustomize.toolkit.fluxcd.io',
              },
              {
                label: 'HelmRelease',
                value: 'helmreleases.helm.toolkit.fluxcd.io',
              },
              {
                label: 'ImagePolicy',
                value: 'imagepolicies.image.toolkit.fluxcd.io',
              },
              {
                label: 'ImageRepository',
                value: 'imagerepositories.image.toolkit.fluxcd.io',
              },
              {
                label: 'ImageUpdateAutomation',
                value: 'imageupdateautomations.image.toolkit.fluxcd.io',
              },
              {
                label: 'Alert',
                value: 'alerts.notification.toolkit.fluxcd.io',
              },
              {
                label: 'Provider',
                value: 'providers.notification.toolkit.fluxcd.io',
              },
              {
                label: 'Receiver',
                value: 'receivers.notification.toolkit.fluxcd.io',
              },
            ]}
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
      </InlineFieldRow>
    </>
  );
}
