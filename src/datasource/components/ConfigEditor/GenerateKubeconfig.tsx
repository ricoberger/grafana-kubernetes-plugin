import React, { ChangeEvent } from 'react';
import { InlineField, InlineSwitch, Input, useStyles2 } from '@grafana/ui';
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

export function GenerateKubeconfig(props: Props) {
  const styles = useStyles2(getStyles);
  const { onOptionsChange, options } = props;
  const { jsonData } = options;

  return (
    <div className={styles.container}>
      <h3>Generate Kubeconfig</h3>
      <InlineField label="Enabled" labelWidth={20}>
        <InlineSwitch
          value={jsonData.generateKubeconfig || false}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onOptionsChange({
              ...options,
              jsonData: {
                ...jsonData,
                generateKubeconfig: event.target.checked,
              },
            });
          }}
        />
      </InlineField>
      <InlineField
        label="Name"
        labelWidth={20}
        interactive
        disabled={!jsonData.generateKubeconfig}
      >
        <Input
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onOptionsChange({
              ...options,
              jsonData: {
                ...jsonData,
                generateKubeconfigName: event.target.value,
              },
            });
          }}
          value={jsonData.generateKubeconfigName}
          width={65}
        />
      </InlineField>
      <InlineField
        label="TTL"
        labelWidth={20}
        interactive
        disabled={!jsonData.generateKubeconfig}
      >
        <Input
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onOptionsChange({
              ...options,
              jsonData: {
                ...jsonData,
                generateKubeconfigTTL: parseInt(event.target.value, 10),
              },
            });
          }}
          value={jsonData.generateKubeconfigTTL || ''}
          type="number"
          width={65}
        />
      </InlineField>
      <InlineField
        label="Port"
        labelWidth={20}
        interactive
        disabled={!jsonData.generateKubeconfig}
      >
        <Input
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onOptionsChange({
              ...options,
              jsonData: {
                ...jsonData,
                generateKubeconfigPort: parseInt(event.target.value, 10),
              },
            });
          }}
          value={jsonData.generateKubeconfigPort || ''}
          type="number"
          width={65}
        />
      </InlineField>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    container: css({
      paddingTop: theme.spacing(5),
    }),
  };
};
