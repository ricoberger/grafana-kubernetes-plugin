import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  CodeEditor,
  Drawer,
  LoadingPlaceholder,
  Stack,
} from '@grafana/ui';
import YAML from 'yaml';

import { fileDownload } from 'utils/utils.download';
import { KubeConfig } from './types';

interface Props {
  datasource: string | null;
  onClose: () => void;
}

export function Kubeconfig(props: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [kubeconfig, setKubeconfig] = useState<KubeConfig>();

  useEffect(() => {
    const fetchKubeconfig = async () => {
      try {
        setIsLoading(true);

        const response = await fetch(
          `/api/datasources/uid/${props.datasource}/resources/kubernetes/kubeconfig`,
          {
            method: 'get',
          },
        );
        if (!response.ok) {
          throw new Error(await response.text());
        }

        const result = await response.json();

        setKubeconfig(result);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchKubeconfig();
  }, [props.datasource]);

  return (
    <Drawer
      title="Kubeconfig"
      scrollableContent={true}
      onClose={() => props.onClose()}
    >
      <Stack direction="column">
        {isLoading ? (
          <LoadingPlaceholder text={'Loading kubeconfig...'} />
        ) : error ? (
          <Alert severity="error" title="Failed to load kubeconfig">
            {error}
          </Alert>
        ) : (
          <>
            <CodeEditor
              width="100%"
              height="700px"
              language="yaml"
              showLineNumbers={true}
              showMiniMap={false}
              readOnly={true}
              value={YAML.stringify(kubeconfig)}
            />
            {kubeconfig && (
              <div>
                <Button
                  variant="primary"
                  icon="file-download"
                  disabled={isLoading}
                  onClick={() =>
                    fileDownload(
                      YAML.stringify(kubeconfig),
                      `kubeconfig-${kubeconfig['current-context']}.yaml`,
                    )
                  }
                >
                  Download
                </Button>
              </div>
            )}
          </>
        )}
      </Stack>
    </Drawer>
  );
}
