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

export function GenerateKubeconfig({ options, onOptionsChange }: Props) {
  const styles = useStyles2((theme: GrafanaTheme2) => {
    return {
      container: css({
        paddingTop: theme.spacing(5),
      }),
    };
  });

  return (
    <div className={styles.container}>
      <h3>Generate Kubeconfig</h3>
      <InlineField label="Enabled" labelWidth={20}>
        <InlineSwitch
          value={options.jsonData.generateKubeconfig || false}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onOptionsChange({
              ...options,
              jsonData: {
                ...options.jsonData,
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
        disabled={!options.jsonData.generateKubeconfig}
      >
        <Input
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onOptionsChange({
              ...options,
              jsonData: {
                ...options.jsonData,
                generateKubeconfigName: event.target.value,
              },
            });
          }}
          value={options.jsonData.generateKubeconfigName}
          width={65}
        />
      </InlineField>
      <InlineField
        label="TTL"
        labelWidth={20}
        interactive
        disabled={!options.jsonData.generateKubeconfig}
      >
        <Input
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onOptionsChange({
              ...options,
              jsonData: {
                ...options.jsonData,
                generateKubeconfigTTL: parseInt(event.target.value, 10),
              },
            });
          }}
          value={options.jsonData.generateKubeconfigTTL || ''}
          type="number"
          width={65}
        />
      </InlineField>
      <InlineField
        label="Port"
        labelWidth={20}
        interactive
        disabled={!options.jsonData.generateKubeconfig}
      >
        <Input
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onOptionsChange({
              ...options,
              jsonData: {
                ...options.jsonData,
                generateKubeconfigPort: parseInt(event.target.value, 10),
              },
            });
          }}
          value={options.jsonData.generateKubeconfigPort || ''}
          type="number"
          width={65}
        />
      </InlineField>
    </div>
  );
}
