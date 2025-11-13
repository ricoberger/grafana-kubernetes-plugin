import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  CodeEditor,
  Drawer,
  LoadingPlaceholder,
  Stack,
} from '@grafana/ui';
import { AppEvents } from '@grafana/data';
import { getAppEvents } from '@grafana/runtime';
import YAML from 'yaml';
import { compare } from 'fast-json-patch';

import {
  getResource,
  getResourceManifest,
} from '../../../utils/utils.resource';
import { KubernetesManifest } from '../../types/kubernetes';

interface Props {
  datasource?: string;
  resource?: string;
  namespace?: string;
  name?: string;
  onClose: () => void;
}

/**
 * The EditAction component renders a drawer to edit a Kubernetes resource.
 */
export function EditAction(props: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [manifest, setManifest] = useState<KubernetesManifest>();
  const [value, setValue] = useState('');

  /**
   * Fetch the manifest of the reqources, which is identified by the
   * "datasource", "resource", "namespace" and "name". The fetched manifest is
   * saved in the "manifest" state (JSON object) and in the "value" state, which
   * can be adjusted by the user.
   */
  useEffect(() => {
    const fetchManifest = async () => {
      try {
        setIsLoading(true);

        const manifest = await getResourceManifest(
          props.resource,
          props.datasource,
          props.namespace,
          props.name,
        );
        setManifest(manifest);
        setValue(YAML.stringify(manifest));
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

    fetchManifest();
  }, [props.datasource, props.resource, props.namespace, props.name]);

  /**
   * onSave handles the saving of the edited resource. It creates a JSON patch
   * of the "manifest" we loaded of the resource and the adjusted resource.
   * Afterwards we make a patch request to update the resource on the Kubernetes
   * cluster.
   */
  const onSave = async () => {
    try {
      setIsLoading(true);

      const parsedValue = YAML.parse(value);
      const diff = compare(manifest!, parsedValue);

      const resource = await getResource(props.datasource, props.resource);

      const response = await fetch(
        `/api/datasources/uid/${props.datasource}/resources/kubernetes/proxy${resource.path}${resource.namespaced ? `/namespaces/${props.namespace}` : ''}/${resource.resource}/${props.name}`,
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
        payload: [
          `${props.namespace ? `${props.namespace}/${props.name}` : props.name} was saved`,
        ],
      });
    } catch {
      const appEvents = getAppEvents();
      appEvents.publish({
        type: AppEvents.alertError.name,
        payload: [
          `Failed to save ${props.namespace ? `${props.namespace}/${props.name}` : props.name}`,
        ],
      });
    } finally {
      setIsLoading(false);
      props.onClose();
    }
  };

  return (
    <Drawer
      title="Edit resource"
      scrollableContent={true}
      onClose={() => props.onClose()}
    >
      <Stack direction="column">
        {isLoading ? (
          <LoadingPlaceholder
            text={!value ? 'Loading resource...' : 'Saving resource...'}
          />
        ) : error ? (
          <Alert
            severity="error"
            title={`Failed to load ${props.namespace ? `${props.namespace}/${props.name}` : props.name}`}
          >
            {error}
          </Alert>
        ) : (
          <>
            <CodeEditor
              width="100%"
              height="700px"
              language="yaml"
              showLineNumbers={true}
              showMiniMap={true}
              readOnly={isLoading}
              value={value}
              onChange={(value) => setValue(value)}
            />
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
          </>
        )}
      </Stack>
    </Drawer>
  );
}
