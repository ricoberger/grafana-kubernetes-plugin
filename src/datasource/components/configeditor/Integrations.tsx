import React, { ChangeEvent } from 'react';
import { InlineField, Input, useStyles2 } from '@grafana/ui';
import {
  DataSourcePluginOptionsEditorProps,
  GrafanaTheme2,
} from '@grafana/data';
import { css } from '@emotion/css';

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
      <InlineField label="Metrics kubelet job" labelWidth={30} interactive>
        <Input
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onOptionsChange({
              ...options,
              jsonData: {
                ...options.jsonData,
                integrationsMetricsKubeletJob: event.target.value,
              },
            });
          }}
          value={options.jsonData.integrationsMetricsKubeletJob}
          width={65}
        />
      </InlineField>
      <InlineField
        label="Metrics kube-state-metrics job"
        labelWidth={30}
        interactive
      >
        <Input
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onOptionsChange({
              ...options,
              jsonData: {
                ...options.jsonData,
                integrationsMetricsKubeStateMetricsJob: event.target.value,
              },
            });
          }}
          value={options.jsonData.integrationsMetricsKubeStateMetricsJob}
          width={65}
        />
      </InlineField>
      <InlineField
        label="Metrics node-exporter job"
        labelWidth={30}
        interactive
      >
        <Input
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onOptionsChange({
              ...options,
              jsonData: {
                ...options.jsonData,
                integrationsMetricsNodeExporterJob: event.target.value,
              },
            });
          }}
          value={options.jsonData.integrationsMetricsNodeExporterJob}
          width={65}
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
