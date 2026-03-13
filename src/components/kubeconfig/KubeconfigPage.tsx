import React from 'react';
import { DataSourceSettings, GrafanaTheme2 } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Alert, Stack, LoadingPlaceholder, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { useAsync } from 'react-use';

import datasourcePluginJson from '../../datasource/plugin.json';
import { Datasource } from './Datasource';
import resourcesImg from '../../img/logo.svg';

export const KubeconfigPage = () => {
  const styles = useStyles2((theme: GrafanaTheme2) => {
    return {
      title: {
        image: css({
          width: '32px',
          height: '32px',
          marginRight: '16px',
        }),
      },
      list: css({
        listStyle: 'none',
        display: 'grid',
        gap: theme.spacing(1),
      }),
    };
  });

  const state = useAsync(async (): Promise<DataSourceSettings[]> => {
    const response = await fetch('/api/datasources');
    const data = await response.json();
    const filteredDatasources = data.filter(
      (ds: DataSourceSettings) => ds.type === datasourcePluginJson.id,
    );
    return filteredDatasources;
  }, []);

  return (
    <PluginPage
      renderTitle={() => (
        <Stack gap={0} alignItems="center" direction="row">
          <img
            className={styles.title.image}
            alt="Kubeconfig"
            src={resourcesImg}
          />
          <h1>Kubeconfig</h1>
        </Stack>
      )}
      subTitle="Generate a Kubeconfig file."
    >
      {state.loading ? (
        <LoadingPlaceholder text={'Loading data sources...'} />
      ) : state.error ? (
        <Alert severity="error" title="Failed to load data sources">
          {state.error.message}
        </Alert>
      ) : (
        <ul className={styles.list}>
          {state.value?.map((ds) => <Datasource key={ds.id} datasource={ds} />)}
        </ul>
      )}
    </PluginPage>
  );
};
