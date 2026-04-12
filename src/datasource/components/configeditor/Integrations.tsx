import { css } from '@emotion/css';
import {
  DataSourcePluginOptionsEditorProps,
  GrafanaTheme2,
} from '@grafana/data';
import { InlineField, Input, TextArea, useStyles2 } from '@grafana/ui';
import React, { ChangeEvent } from 'react';

import {
  DataSourceOptions,
  KubernetesSecureJsonData,
} from '../../types/settings';

interface Props
  extends DataSourcePluginOptionsEditorProps<
    DataSourceOptions,
    KubernetesSecureJsonData
  > { }

export function Integrations({ options, onOptionsChange }: Props) {
  const styles = useStyles2((theme: GrafanaTheme2) => {
    return {
      containerKubeconfigGeneration: css({
        paddingTop: theme.spacing(5),
      }),
    };
  });

  return (
    <div className={styles.containerKubeconfigGeneration}>
      <h3>Integrations</h3>
      <InlineField label="Metrics datasource uid" labelWidth={30} interactive>
        <Input
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onOptionsChange({
              ...options,
              jsonData: {
                ...options.jsonData,
                integrationsMetricsDatasourceUid: event.target.value,
              },
            });
          }}
          value={options.jsonData.integrationsMetricsDatasourceUid}
          width={65}
        />
      </InlineField>
      <InlineField label="Metrics cluster label" labelWidth={30} interactive>
        <Input
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onOptionsChange({
              ...options,
              jsonData: {
                ...options.jsonData,
                integrationsMetricsClusterLabel: event.target.value,
              },
            });
          }}
          value={options.jsonData.integrationsMetricsClusterLabel}
          width={65}
        />
      </InlineField>
      <InlineField label="Metrics logs queries" labelWidth={30} interactive>
        <TextArea
          rows={3}
          cols={56}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
            onOptionsChange({
              ...options,
              jsonData: {
                ...options.jsonData,
                integrationsMetricsLogs: event.target.value,
              },
            });
          }}
          value={options.jsonData.integrationsMetricsLogs}
        />
      </InlineField>
      <InlineField label="Traces query" labelWidth={30} interactive>
        <Input
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onOptionsChange({
              ...options,
              jsonData: {
                ...options.jsonData,
                integrationsTracesQuery: event.target.value,
              },
            });
          }}
          value={options.jsonData.integrationsTracesQuery}
          width={65}
        />
      </InlineField>
    </div>
  );
}
