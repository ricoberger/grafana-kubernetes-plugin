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

export function Integrations(props: Props) {
  const styles = useStyles2(getStyles);
  const { onOptionsChange, options } = props;
  const { jsonData } = options;

  return (
    <div className={styles.containerKubeconfigGeneration}>
      <h3>Integrations</h3>
      <InlineField label="Traces" labelWidth={20}>
        <InlineSwitch
          value={jsonData.integrationsTraces || false}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onOptionsChange({
              ...options,
              jsonData: {
                ...jsonData,
                integrationsTraces: event.target.checked,
                integrationsTracesLink: !event.target.checked
                  ? ''
                  : jsonData.integrationsTracesLink,
              },
            });
          }}
        />
      </InlineField>
      <InlineField
        label="Traces link"
        labelWidth={20}
        interactive
        disabled={!jsonData.integrationsTraces}
      >
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
