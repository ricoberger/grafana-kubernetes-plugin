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

export function Scale({
  datasource,
  resourceId,
  namespace,
  name,
  isOpen,
  onClose,
}: Props) {
  const styles = useStyles2((theme: GrafanaTheme2) => {
    return {
      body: css({
        marginTop: theme.spacing(2),
      }),
    };
  });

  const [isLoading, setIsLoading] = useState(false);
  const [replicas, setReplicas] = useState(0);

  const onConfirm = async () => {
    try {
      setIsLoading(true);

      const resource = await getResource(datasource, resourceId);

      const response = await fetch(
        `/api/datasources/uid/${datasource}/resources/kubernetes/proxy${resource.path}/namespaces/${namespace}/${resource.name}/${name}/scale`,
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
              name: name,
              namespace: namespace,
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
        payload: [`${namespace ? `${namespace}/${name}` : name} was scaled`],
      });
    } catch (_) {
      const appEvents = getAppEvents();
      appEvents.publish({
        type: AppEvents.alertError.name,
        payload: [
          `Failed to scale ${namespace ? `${namespace}/${name}` : name}`,
        ],
      });
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <ConfirmModal
      isOpen={isOpen}
      title="Scale resource"
      body={`Are you sure you want to scale ${namespace ? `${namespace}/${name}` : name}?`}
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
      onDismiss={() => onClose()}
      disabled={isLoading}
    />
  );
}
