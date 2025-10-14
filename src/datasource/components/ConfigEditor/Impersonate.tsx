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

export function Impersonate(props: Props) {
  const styles = useStyles2(getStyles);
  const { onOptionsChange, options } = props;
  const { jsonData } = options;

  return (
    <div className={styles.containerKubeconfigGeneration}>
      <h3>Impersonate</h3>
      <InlineField label="Impersonate user" labelWidth={20}>
        <InlineSwitch
          value={jsonData.impersonateUser || false}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onOptionsChange({
              ...options,
              jsonData: {
                ...jsonData,
                impersonateUser: event.target.checked,
                impersonateGroups: !event.target.checked
                  ? false
                  : jsonData.impersonateGroups,
              },
            });
          }}
        />
      </InlineField>
      <InlineField
        label="Impersonate groups"
        labelWidth={20}
        disabled={!jsonData.impersonateUser}
      >
        <InlineSwitch
          value={jsonData.impersonateGroups || false}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onOptionsChange({
              ...options,
              jsonData: {
                ...jsonData,
                impersonateGroups: event.target.checked,
              },
            });
          }}
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
