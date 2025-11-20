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
import { V1Job } from '@kubernetes/client-node';

import { getResourceManifest } from '../../../utils/utils.resource';

interface Props {
  datasource?: string;
  resourceId?: string;
  namespace?: string;
  name?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CreateJob({
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
  const jobName = `${name}-manual-${randomString(6)}`;

  const onConfirm = async () => {
    try {
      setIsLoading(true);

      const manifest = await getResourceManifest(
        datasource,
        resourceId,
        namespace,
        name,
      );

      const job: V1Job = {
        apiVersion: 'batch/v1',
        kind: 'Job',
        metadata: {
          annotations: {
            'cronjob.kubernetes.io/instantiate': 'manual',
          },
          labels: {
            'job-name': jobName,
          },
          name: jobName,
          namespace: namespace,
        },
        spec: manifest?.spec?.jobTemplate.spec,
      };

      if (job.spec) {
        if (job.spec.template.metadata) {
          if (job.spec.template.metadata.labels) {
            job.spec.template.metadata.labels['job-name'] = jobName;
          }
        } else {
          job.spec.template.metadata = {
            labels: {
              'job-name': jobName,
            },
          };
        }
      }

      const response = await fetch(
        `/api/datasources/uid/${datasource}/resources/kubernetes/proxy/apis/batch/v1/namespaces/${namespace}/jobs?fieldManager=grafana-kubernetes-plugin`,
        {
          method: 'post',
          headers: {
            Accept: 'application/json, */*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(job),
        },
      );
      if (!response.ok) {
        throw new Error();
      }

      const appEvents = getAppEvents();
      appEvents.publish({
        type: AppEvents.alertSuccess.name,
        payload: [
          `Job ${namespace ? `${namespace}/${jobName}` : jobName} was created`,
        ],
      });
    } catch (_) {
      const appEvents = getAppEvents();
      appEvents.publish({
        type: AppEvents.alertError.name,
        payload: [
          `Failed to create job ${namespace ? `${namespace}/${jobName}` : jobName}`,
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
      title="Crate job"
      body={`Are you sure you want to create a job `}
      description={
        <div className={styles.body}>
          <Stack direction="column">
            <div>
              This will create a new job {namespace}/{jobName}
            </div>
            {isLoading && <LoadingPlaceholder text="Creating job..." />}
          </Stack>
        </div>
      }
      confirmText="Create job"
      confirmButtonVariant="primary"
      dismissText="Cancel"
      onConfirm={onConfirm}
      onDismiss={() => onClose()}
      disabled={isLoading}
    />
  );
}

const randomString = (length: number): string => {
  let result = '';
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};
