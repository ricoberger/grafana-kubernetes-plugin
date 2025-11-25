import React from 'react';
import {
  SceneComponentProps,
  SceneObjectBase,
  SceneObjectState,
} from '@grafana/scenes';
import { Alert, LoadingPlaceholder, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { useAsync } from 'react-use';

interface KubectlState extends SceneObjectState { }

export class Kubectl extends SceneObjectBase<KubectlState> {
  static Component = KubectlRenderer;
}

function KubectlRenderer({ }: SceneComponentProps<Kubectl>) {
  const styles = useStyles2(() => {
    return {
      container: css({
        width: '100%',
      }),
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
    <>
      <div className={styles.container}>
        {state.loading ? (
          <LoadingPlaceholder text={`Loading ${type}...`} />
        ) : state.error ? (
          <Alert severity="error" title={`Failed to load ${type}`}>
            {state.error.message}
          </Alert>
        ) : (
          <LoadingPlaceholder text={'Redirecting...'} />
        )}
      </div>
    </>
  );
}
