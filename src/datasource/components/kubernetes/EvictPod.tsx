import React, { useState } from 'react';
import {
  ConfirmModal,
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

export function EvictPod({
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

  const onConfirm = async () => {
    try {
      setIsLoading(true);

      const resource = await getResource(datasource, resourceId);

      const response = await fetch(
        `/api/datasources/uid/${datasource}/resources/kubernetes/proxy${resource.path}/namespaces/${namespace}/${resource.name}/${name}/eviction?fieldManager=grafana-kubernetes-plugin`,
        {
          method: 'post',
          headers: {
            Accept: 'application/json, */*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            apiVersion: 'policy/v1',
            kind: 'Eviction',
            metadata: {
              name: name,
              namespace: namespace,
            },
          }),
        },
      );
      if (!response.ok) {
        throw new Error();
      }

      const appEvents = getAppEvents();
      appEvents.publish({
        type: AppEvents.alertSuccess.name,
        payload: [`${namespace}/${name} was evicted`],
      });
    } catch (_) {
      const appEvents = getAppEvents();
      appEvents.publish({
        type: AppEvents.alertError.name,
        payload: [`Failed to evict ${namespace}/${name}`],
      });
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <ConfirmModal
      isOpen={isOpen}
      title="Evict pod"
      body={`Are you sure you want to evict ${namespace}/${name}?`}
      description={
        <div className={styles.body}>
          <Stack direction="column">
            {isLoading && <LoadingPlaceholder text="Evicting pod..." />}
          </Stack>
        </div>
      }
      confirmText="Evict"
      confirmButtonVariant="destructive"
      dismissText="Cancel"
      onConfirm={onConfirm}
      onDismiss={() => onClose()}
      disabled={isLoading}
    />
  );
}
