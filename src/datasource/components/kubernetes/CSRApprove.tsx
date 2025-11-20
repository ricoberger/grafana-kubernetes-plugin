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
  name?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CSRApprove({
  datasource,
  resourceId,
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

  /**
   * To create a CertificateSigningRequest follow the steps mentioned in
   * https://kubernetes.io/docs/tasks/tls/certificate-issue-client-csr/
   */
  const onConfirm = async () => {
    try {
      setIsLoading(true);

      const resource = await getResource(datasource, resourceId);

      const response = await fetch(
        `/api/datasources/uid/${datasource}/resources/kubernetes/proxy${resource.path}/${resource.name}/${name}/approval?fieldManager=grafana-kubernetes-plugin`,
        {
          method: 'patch',
          headers: {
            Accept: 'application/json, */*',
            'Content-Type': 'application/merge-patch+json',
          },
          body: JSON.stringify({
            status: {
              conditions: [
                {
                  type: 'Approved',
                  status: 'True',
                  reason: 'GrafanaKubernetesPluginApprove',
                  message:
                    'This CSR was approved by Grafana Kubernetes Plugin certificate approve.',
                  lastUpdateTime: new Date().toJSON(),
                  lastTransitionTime: null,
                },
              ],
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
        payload: [`${name} was approved`],
      });
    } catch (_) {
      const appEvents = getAppEvents();
      appEvents.publish({
        type: AppEvents.alertError.name,
        payload: [`Failed to approve ${name}`],
      });
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <ConfirmModal
      isOpen={isOpen}
      title="Approve certificate signing request"
      body={`Are you sure you want to approve ${name}?`}
      description={
        <div className={styles.body}>
          <Stack direction="column">
            {isLoading && (
              <LoadingPlaceholder text="Approving certificate signing request..." />
            )}
          </Stack>
        </div>
      }
      confirmText="Approve"
      confirmButtonVariant="primary"
      dismissText="Cancel"
      onConfirm={onConfirm}
      onDismiss={() => onClose()}
      disabled={isLoading}
    />
  );
}
