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

/**
 * The ReconcileAction component renders a confirmation modal for reconciling a
 * Flux resource.
 */
export function ReconcileAction(props: Props) {
  const styles = useStyles2(getStyles);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * onConfirm handles the confirmation of the reconcile action.
   */
  const onConfirm = async () => {
    try {
      setIsLoading(true);

      const resource = await getResource(props.datasource, props.resourceId);

      const response = await fetch(
        `/api/datasources/uid/${props.datasource}/resources/kubernetes/proxy${resource.path}/namespaces/${props.namespace}/${resource.name}/${props.name}?fieldManager=grafana-kubernetes-plugin`,
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
          `${props.namespace ? `${props.namespace}/${props.name}` : props.name} was reconciled`,
        ],
      });
    } catch (_) {
      const appEvents = getAppEvents();
      appEvents.publish({
        type: AppEvents.alertError.name,
        payload: [
          `Failed to reconcile ${props.namespace ? `${props.namespace}/${props.name}` : props.name}`,
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
      title="Reconcile resource"
      body={`Are you sure you want to reconcile ${props.namespace ? `${props.namespace}/${props.name}` : props.name}?`}
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
