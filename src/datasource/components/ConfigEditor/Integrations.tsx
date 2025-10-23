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

export function Integrations(props: Props) {
  const styles = useStyles2(getStyles);
  const { onOptionsChange, options } = props;
  const { jsonData } = options;

  return (
    <div className={styles.containerKubeconfigGeneration}>
      <h3>Integrations</h3>
      <InlineField label="Metrics datasource uid" labelWidth={30} interactive>
        <Input
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onOptionsChange({
              ...options,
              jsonData: {
                ...jsonData,
                integrationsMetricsDatasourceUid: event.target.value,
              },
            });
          }}
          value={jsonData.integrationsMetricsDatasourceUid}
          width={65}
        />
      </InlineField>
      <InlineField label="Metrics kubelet job" labelWidth={30} interactive>
        <Input
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onOptionsChange({
              ...options,
              jsonData: {
                ...jsonData,
                integrationsMetricsKubeletJob: event.target.value,
              },
            });
          }}
          value={jsonData.integrationsMetricsKubeletJob}
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
                ...jsonData,
                integrationsMetricsKubeStateMetricsJob: event.target.value,
              },
            });
          }}
          value={jsonData.integrationsMetricsKubeStateMetricsJob}
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
                ...jsonData,
                integrationsMetricsNodeExporterJob: event.target.value,
              },
            });
          }}
          value={jsonData.integrationsMetricsNodeExporterJob}
          width={65}
        />
      </InlineField>
      <InlineField label="Traces link" labelWidth={30} interactive>
        <Input
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onOptionsChange({
              ...options,
              jsonData: {
                ...jsonData,
                integrationsTracesLink: event.target.value,
              },
            });
          }}
          value={jsonData.integrationsTracesLink}
          width={65}
        />
      </InlineField>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    containerKubeconfigGeneration: css({
      paddingTop: theme.spacing(5),
    }),
  };
};
