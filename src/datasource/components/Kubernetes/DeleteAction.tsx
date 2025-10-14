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
  resource?: string;
  namespace?: string;
  name?: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * The DeleteAction component renders a confirmation modal for deleting a
 * Kubernetes resource.
 */
export function DeleteAction(props: Props) {
  const styles = useStyles2(getStyles);
  const [isLoading, setIsLoading] = useState(false);
  const [force, setForce] = useState(false);
  const [propagationPolicy, setPropagationPolicy] = useState('');

  /**
   * onConfirm handles the confirmation of the delete action. It requests the
   * resource details and performs the deletion, by sending a delete request to
   * the proxy endpoint of the datasource.
   */
  const onConfirm = async () => {
    try {
      setIsLoading(true);

      const resource = await getResource(props.datasource, props.resource);

      const response = await fetch(
        `/api/datasources/uid/${props.datasource}/resources/kubernetes/proxy${resource.path}${resource.scope === 'Namespaced' ? `/namespaces/${props.namespace}` : ''}/${resource.resource}/${props.name}`,
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
        payload: [
          `${props.namespace ? `${props.namespace}/${props.name}` : props.name} was deleted`,
        ],
      });
    } catch (_) {
      const appEvents = getAppEvents();
      appEvents.publish({
        type: AppEvents.alertError.name,
        payload: [
          `Failed to delete ${props.namespace ? `${props.namespace}/${props.name}` : props.name}`,
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
      title="Delete resource"
      body={`Are you sure you want to delete ${props.namespace ? `${props.namespace}/${props.name}` : props.name}?`}
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
