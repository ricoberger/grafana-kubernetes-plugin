import React, { ChangeEvent } from 'react';
import { InlineField, InlineSwitch, useStyles2 } from '@grafana/ui';
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

export function Impersonate({ onOptionsChange, options }: Props) {
  const styles = useStyles2((theme: GrafanaTheme2) => {
    return {
      containerKubeconfigGeneration: css({
        paddingTop: theme.spacing(5),
      }),
    };
  });

  return (
    <div className={styles.containerKubeconfigGeneration}>
      <h3>Impersonate</h3>
      <InlineField label="Impersonate user" labelWidth={20}>
        <InlineSwitch
          value={options.jsonData.impersonateUser || false}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onOptionsChange({
              ...options,
              jsonData: {
                ...options.jsonData,
                impersonateUser: event.target.checked,
                impersonateGroups: !event.target.checked
                  ? false
                  : options.jsonData.impersonateGroups,
              },
            });
          }}
        />
      </InlineField>
      <InlineField
        label="Impersonate groups"
        labelWidth={20}
        disabled={!options.jsonData.impersonateUser}
      >
        <InlineSwitch
          value={options.jsonData.impersonateGroups || false}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onOptionsChange({
              ...options,
              jsonData: {
                ...options.jsonData,
                impersonateGroups: event.target.checked,
              },
            });
          }}
        />
      </InlineField>
    </div>
  );
}
