import { css } from '@emotion/css';
import {
  DataSourcePluginOptionsEditorProps,
  GrafanaTheme2,
} from '@grafana/data';
import {
  InlineField,
  Input,
  RadioButtonGroup,
  SecretInput,
  useStyles2,
} from '@grafana/ui';
import React, { ChangeEvent } from 'react';

import {
  DataSourceOptions,
  GrafanaServiceAccountRole,
  KubernetesSecureJsonData,
} from '../../types/settings';

interface Props extends DataSourcePluginOptionsEditorProps<
  DataSourceOptions,
  KubernetesSecureJsonData
> { }

export function Grafana({ options, onOptionsChange }: Props) {
  const styles = useStyles2((theme: GrafanaTheme2) => {
    return {
      container: css({
        paddingTop: theme.spacing(5),
      }),
    };
  });

  return (
    <div className={styles.container}>
      <h3>Grafana</h3>
      <InlineField label="Username" labelWidth={20} interactive>
        <Input
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onOptionsChange({
              ...options,
              jsonData: {
                ...options.jsonData,
                grafanaUsername: event.target.value,
              },
            });
          }}
          value={options.jsonData.grafanaUsername}
          width={65}
        />
      </InlineField>
      <InlineField label="Password" labelWidth={20} interactive>
        <SecretInput
          isConfigured={options.secureJsonFields.grafanaPassword}
          value={options.secureJsonData?.grafanaPassword}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onOptionsChange({
              ...options,
              secureJsonData: {
                grafanaPassword: event.target.value,
              },
            });
          }}
          onReset={() => {
            onOptionsChange({
              ...options,
              secureJsonFields: {
                ...options.secureJsonFields,
                grafanaPassword: false,
              },
              secureJsonData: {
                ...options.secureJsonData,
                grafanaPassword: '',
              },
            });
          }}
          width={65}
        />
      </InlineField>
      <InlineField label="Service Account Role" labelWidth={20} interactive>
        <RadioButtonGroup<GrafanaServiceAccountRole>
          options={[
            { label: 'Admin', value: 'Admin' },
            { label: 'Editor', value: 'Editor' },
            { label: 'Viewer', value: 'Viewer' },
          ]}
          value={options.jsonData.grafanaServiceAccountRole ?? 'Viewer'}
          onChange={(value: GrafanaServiceAccountRole) => {
            onOptionsChange({
              ...options,
              jsonData: {
                ...options.jsonData,
                grafanaServiceAccountRole: value,
              },
            });
          }}
        />
      </InlineField>
    </div>
  );
}
