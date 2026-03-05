import React from 'react';
import {
  Alert,
  Button,
  CodeEditor,
  Drawer,
  LoadingPlaceholder,
  Stack,
  useStyles2,
} from '@grafana/ui';
import YAML from 'yaml';
import { useAsync } from 'react-use';
import AutoSizer from 'react-virtualized-auto-sizer';
import { css } from '@emotion/css';

import { fileDownload } from '../../utils/utils.download';

interface KubeconfigFile {
  kind?: string;
  apiVersion?: string;
  clusters: Array<{
    name: string;
    cluster: {
      server: string;
    };
  }>;
  users: Array<{
    name: string;
    user: {
      token?: string;
    };
  }>;
  contexts: Array<{
    name: string;
    context: {
      cluster: string;
      user: string;
      namespace?: string;
    };
  }>;
  'current-context': string;
}

interface Props {
  datasource: string | null;
  onClose: () => void;
}

export function Kubeconfig({ datasource, onClose }: Props) {
  const styles = useStyles2(() => {
    return {
      editorWrapper: css({
        flex: 1,
      }),
      editorContainer: css({
        width: 'fit-content',
        border: 'none',
      }),
    };
  });

  const state = useAsync(async (): Promise<KubeconfigFile> => {
    const response = await fetch(
      `/api/datasources/uid/${datasource}/resources/kubernetes/kubeconfig`,
      {
        method: 'get',
      },
    );
    if (!response.ok) {
      throw new Error(await response.text());
    }

    const result = await response.json();
    return result;
  }, [datasource]);

  return (
    <Drawer
      title="Kubeconfig"
      scrollableContent={true}
      onClose={() => onClose()}
    >
      <Stack direction="column" height="100%">
        {state.loading ? (
          <LoadingPlaceholder text={'Loading kubeconfig...'} />
        ) : state.error ? (
          <Alert severity="error" title="Failed to load kubeconfig">
            {state.error.message}
          </Alert>
        ) : (
          <Stack
            direction="column"
            gap={2}
            justifyContent="space-between"
            height="100%"
          >
            <div className={styles.editorWrapper}>
              <AutoSizer>
                {({ width, height }) => {
                  return (
                    <CodeEditor
                      containerStyles={styles.editorContainer}
                      width={width}
                      height={height}
                      language="yaml"
                      showLineNumbers={true}
                      showMiniMap={false}
                      readOnly={true}
                      value={YAML.stringify(state.value)}
                    />
                  );
                }}
              </AutoSizer>
            </div>

            <div>
              <Button
                variant="primary"
                icon="file-download"
                disabled={state.loading}
                onClick={() =>
                  fileDownload(
                    YAML.stringify(state.value),
                    `kubeconfig-${state.value?.['current-context']}.yaml`,
                  )
                }
              >
                Download
              </Button>
            </div>
          </Stack>
        )}
      </Stack>
    </Drawer>
  );
}
