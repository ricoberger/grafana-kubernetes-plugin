import { css } from '@emotion/css';
import { PluginPage } from '@grafana/runtime';
import { Alert, LoadingPlaceholder, Stack, useStyles2 } from '@grafana/ui';
import React from 'react';
import { useAsync } from 'react-use';

import resourcesImg from '../../img/logo.svg';

export function KubectlPage() {
  const styles = useStyles2(() => {
    return {
      title: {
        image: css({
          width: '32px',
          height: '32px',
          marginRight: '16px',
        }),
      },
    };
  });

  const urlParams = new URLSearchParams(window.location.search);
  const type = urlParams.get('type');
  const datasource = urlParams.get('datasource');
  const redirect = urlParams.get('redirect');

  const state = useAsync(async (): Promise<void> => {
    let url = '';
    if (type === 'kubeconfig') {
      url = `/api/datasources/uid/${datasource}/resources/kubernetes/kubeconfig?type=exec&redirect=${redirect}`;
    } else if (type === 'credentials') {
      url = `/api/datasources/uid/${datasource}/resources/kubernetes/kubeconfig/credentials?redirect=${redirect}`;
    }

    const response = await fetch(url, { method: 'get' });
    if (!response.ok) {
      throw new Error(await response.text());
    }

    const result = await response.json();

    window.location.replace(
      `${redirect}?${type}=${encodeURIComponent(JSON.stringify(result))}`,
    );
  }, []);

  return (
    <PluginPage
      renderTitle={() => (
        <Stack gap={0} alignItems="center" direction="row">
          <img
            className={styles.title.image}
            alt="kubectl"
            src={resourcesImg}
          />
          <h1>kubectl</h1>
        </Stack>
      )}
      subTitle="Generate a Kubeconfig file and get Kubeconfig credentials."
    >
      {state.loading ? (
        <LoadingPlaceholder text={`Loading ${type}...`} />
      ) : state.error ? (
        <Alert severity="error" title={`Failed to load ${type}`}>
          {state.error.message}
        </Alert>
      ) : (
        <LoadingPlaceholder text={'Redirecting...'} />
      )}
    </PluginPage>
  );
}
