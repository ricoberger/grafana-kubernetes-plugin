import React, { ChangeEvent, useState } from 'react';
import {
  ConfirmModal,
  InlineField,
  Input,
  LoadingPlaceholder,
  Stack,
  useStyles2,
} from '@grafana/ui';
import { AppEvents, GrafanaTheme2 } from '@grafana/data';
import { getAppEvents } from '@grafana/runtime';
import { css } from '@emotion/css';

import { getResource } from '../../../utils/utils.resource';

interface Props {
  datasource?: string;
  resourceId?: string;
  namespace?: string;
  name?: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * The ScaleAction component renders a confirmation modal for scaling a
 * Kubernetes resource.
 */
export function ScaleAction(props: Props) {
  const styles = useStyles2(getStyles);
  const [isLoading, setIsLoading] = useState(false);
  const [replicas, setReplicas] = useState(0);

  /**
   * onConfirm handles the confirmation of the scale action. It requests the
   * resource details and performs the scale, by sending a put request to the
   * proxy endpoint of the datasource with a "Scale" object.
   */
  const onConfirm = async () => {
    try {
      setIsLoading(true);

      const resource = await getResource(props.datasource, props.resourceId);

      const response = await fetch(
        `/api/datasources/uid/${props.datasource}/resources/kubernetes/proxy${resource.path}/namespaces/${props.namespace}/${resource.name}/${props.name}/scale`,
        {
          method: 'put',
          headers: {
            Accept: 'application/json, */*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            kind: 'Scale',
            apiVersion: 'autoscaling/v1',
            metadata: {
              name: props.name,
              namespace: props.namespace,
            },
            spec: { replicas: replicas },
          }),
        },
      );
      if (!response.ok) {
        throw new Error();
      }

      const appEvents = getAppEvents();
      appEvents.publish({
        type: AppEvents.alertSuccess.name,
        payload: [
          `${props.namespace ? `${props.namespace}/${props.name}` : props.name} was scaled`,
        ],
      });
    } catch (_) {
      const appEvents = getAppEvents();
      appEvents.publish({
        type: AppEvents.alertError.name,
        payload: [
          `Failed to scale ${props.namespace ? `${props.namespace}/${props.name}` : props.name}`,
        ],
      });
    } finally {
      setIsLoading(false);
      props.onClose();
    }
  };

  return (
    <ConfirmModal
      isOpen={props.isOpen}
      title="Scale resource"
      body={`Are you sure you want to scale ${props.namespace ? `${props.namespace}/${props.name}` : props.name}?`}
      description={
        <div className={styles.body}>
          <Stack direction="column">
            <InlineField label="Replicas">
              <Input
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setReplicas(parseInt(event.target.value, 10))
                }
                value={replicas}
              />
            </InlineField>
            {isLoading && <LoadingPlaceholder text="Scaling resource..." />}
          </Stack>
        </div>
      }
      confirmText="Scale"
      confirmButtonVariant="primary"
      dismissText="Cancel"
      onConfirm={onConfirm}
      onDismiss={() => props.onClose()}
      disabled={isLoading}
    />
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    body: css({
      marginTop: theme.spacing(2),
    }),
  };
};
