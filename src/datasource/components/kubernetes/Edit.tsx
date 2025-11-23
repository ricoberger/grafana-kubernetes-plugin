import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  CodeEditor,
  Drawer,
  LoadingPlaceholder,
  Stack,
  useStyles2,
} from '@grafana/ui';
import { AppEvents } from '@grafana/data';
import { getAppEvents } from '@grafana/runtime';
import YAML from 'yaml';
import { compare } from 'fast-json-patch';
import { useAsync } from 'react-use';
import AutoSizer from 'react-virtualized-auto-sizer';
import { css } from '@emotion/css';

import {
  getResource,
  getResourceManifest,
} from '../../../utils/utils.resource';
import { KubernetesManifest } from '../../types/kubernetes';

interface Props {
  datasource?: string;
  resourceId?: string;
  namespace?: string;
  name?: string;
  onClose: () => void;
}

export function Edit({
  datasource,
  resourceId,
  namespace,
  name,
  onClose,
}: Props) {
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

  const [isLoading, setIsLoading] = useState(false);
  const [value, setValue] = useState('');

  const state = useAsync(async (): Promise<KubernetesManifest> => {
    const manifest = await getResourceManifest(
      datasource,
      resourceId,
      namespace,
      name,
    );

    return manifest;
  }, [datasource, resourceId, namespace, name]);

  useEffect(() => {
    if (state.value) {
      setValue(YAML.stringify(state.value));
    }
  }, [state.value]);

  const onSave = async () => {
    try {
      setIsLoading(true);

      const parsedValue = YAML.parse(value);
      const diff = compare(state.value!, parsedValue);

      const resource = await getResource(datasource, resourceId);

      const response = await fetch(
        `/api/datasources/uid/${datasource}/resources/kubernetes/proxy${resource.path}${resource.namespaced ? `/namespaces/${namespace}` : ''}/${resource.name}/${name}`,
        {
          method: 'patch',
          headers: {
            Accept: 'application/json, */*',
            'Content-Type': 'application/json-patch+json',
          },
          body: JSON.stringify(diff),
        },
      );
      if (!response.ok) {
        throw new Error();
      }

      const appEvents = getAppEvents();
      appEvents.publish({
        type: AppEvents.alertSuccess.name,
        payload: [`${namespace ? `${namespace}/${name}` : name} was saved`],
      });
    } catch {
      const appEvents = getAppEvents();
      appEvents.publish({
        type: AppEvents.alertError.name,
        payload: [
          `Failed to save ${namespace ? `${namespace}/${name}` : name}`,
        ],
      });
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <Drawer
      title="Edit resource"
      scrollableContent={true}
      onClose={() => onClose()}
    >
      <Stack direction="column" height="100%">
        {state.loading ? (
          <LoadingPlaceholder text="Loading resource..." />
        ) : state.error ? (
          <Alert
            severity="error"
            title={`Failed to load ${namespace ? `${namespace}/${name}` : name}`}
          >
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
                      showMiniMap={true}
                      readOnly={isLoading}
                      value={value}
                      onChange={(value) => setValue(value)}
                    />
                  );
                }}
              </AutoSizer>
            </div>

            <div>
              <Button
                variant="primary"
                icon="save"
                disabled={isLoading}
                onClick={() => onSave()}
              >
                Save
              </Button>
            </div>
          </Stack>
        )}
      </Stack>
    </Drawer>
  );
}
