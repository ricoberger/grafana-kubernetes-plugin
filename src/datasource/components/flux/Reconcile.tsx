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

export function Reconcile({
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
        `/api/datasources/uid/${datasource}/resources/kubernetes/proxy${resource.path}/namespaces/${namespace}/${resource.name}/${name}?fieldManager=grafana-kubernetes-plugin`,
        {
          method: 'patch',
          headers: {
            Accept: 'application/json, */*',
            'Content-Type': 'application/merge-patch+json',
          },
          body: JSON.stringify({
            metadata: {
              annotations: {
                'reconcile.fluxcd.io/requestedAt': new Date().toJSON(),
              },
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
        payload: [
          `${namespace ? `${namespace}/${name}` : name} was reconciled`,
        ],
      });
    } catch (_) {
      const appEvents = getAppEvents();
      appEvents.publish({
        type: AppEvents.alertError.name,
        payload: [
          `Failed to reconcile ${namespace ? `${namespace}/${name}` : name}`,
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
      title="Reconcile resource"
      body={`Are you sure you want to reconcile ${namespace ? `${namespace}/${name}` : name}?`}
      description={
        <div className={styles.body}>
          <Stack direction="column">
            {isLoading && <LoadingPlaceholder text="Reconciling resource..." />}
          </Stack>
        </div>
      }
      confirmText="Reconcile"
      confirmButtonVariant="primary"
      dismissText="Cancel"
      onConfirm={onConfirm}
      onDismiss={() => onClose()}
      disabled={isLoading}
    />
  );
}
