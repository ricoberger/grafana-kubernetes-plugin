import React, { ChangeEvent, useState } from 'react';
import {
  Combobox,
  ComboboxOption,
  ConfirmModal,
  InlineField,
  InlineSwitch,
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

export function Delete({
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
  const [force, setForce] = useState(false);
  const [propagationPolicy, setPropagationPolicy] = useState('');

  const onConfirm = async () => {
    try {
      setIsLoading(true);

      const resource = await getResource(datasource, resourceId);

      const response = await fetch(
        `/api/datasources/uid/${datasource}/resources/kubernetes/proxy${resource.path}${resource.namespaced ? `/namespaces/${namespace}` : ''}/${resource.name}/${name}`,
        {
          method: 'delete',
          headers: {
            Accept: 'application/json, */*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            gracePeriodSeconds: force ? 0 : null,
            propagationPolicy:
              propagationPolicy !== '' ? propagationPolicy : null,
          }),
        },
      );
      if (!response.ok) {
        throw new Error();
      }

      const appEvents = getAppEvents();
      appEvents.publish({
        type: AppEvents.alertSuccess.name,
        payload: [`${namespace ? `${namespace}/${name}` : name} was deleted`],
      });
    } catch (_) {
      const appEvents = getAppEvents();
      appEvents.publish({
        type: AppEvents.alertError.name,
        payload: [
          `Failed to delete ${namespace ? `${namespace}/${name}` : name}`,
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
      title="Delete resource"
      body={`Are you sure you want to delete ${namespace ? `${namespace}/${name}` : name}?`}
      description={
        <div className={styles.body}>
          <Stack direction="column">
            <InlineField label="Force">
              <InlineSwitch
                value={force}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setForce(event.target.checked)
                }
                disabled={isLoading}
              />
            </InlineField>
            <InlineField label="Propagation Policy">
              <Combobox<string>
                value={propagationPolicy}
                options={[
                  { label: 'None', value: '' },
                  { label: 'Background', value: 'Background' },
                  { label: 'Foreground', value: 'Foreground' },
                  { label: 'Orphan', value: 'Orphan' },
                ]}
                onChange={(option: ComboboxOption<string>) =>
                  setPropagationPolicy(option.value)
                }
                disabled={isLoading}
              />
            </InlineField>
            {isLoading && <LoadingPlaceholder text="Deleting resource..." />}
          </Stack>
        </div>
      }
      confirmText="Delete"
      confirmButtonVariant="destructive"
      dismissText="Cancel"
      onConfirm={onConfirm}
      onDismiss={() => onClose()}
      disabled={isLoading}
    />
  );
}
