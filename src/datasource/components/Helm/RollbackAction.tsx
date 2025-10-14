import React, { ChangeEvent, useState } from 'react';
import {
  ConfirmModal,
  InlineField,
  InlineSwitch,
  Input,
  LoadingPlaceholder,
  Stack,
  useStyles2,
} from '@grafana/ui';
import { AppEvents, GrafanaTheme2 } from '@grafana/data';
import { getAppEvents } from '@grafana/runtime';
import { css } from '@emotion/css';

import { RollbackOptions } from './types';

interface Props {
  datasource?: string;
  namespace?: string;
  name?: string;
  version?: number;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * The RollbackAction component renders a confirmation modal for rolling back a
 * Helm release.
 */
export function RollbackAction(props: Props) {
  const styles = useStyles2(getStyles);
  const [isLoading, setIsLoading] = useState(false);

  const [version, setVersion] = useState<number>(props.version || 1);
  const [options, setOptions] = useState<RollbackOptions>({
    cleanupOnFail: false,
    dryRun: false,
    force: false,
    maxHistory: 10,
    disableHooks: false,
    recreate: false,
    timeout: '10m',
    wait: false,
    waitForJobs: false,
  });

  /**
   * onConfirm handles the confirmation of the rollback action.
   */
  const onConfirm = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(
        `/api/datasources/uid/${props.datasource}/resources/helm/${props.namespace}/${props.name}/${version}/rollback`,
        {
          method: 'post',
          headers: {
            Accept: 'application/json, */*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(options),
        },
      );
      if (!response.ok) {
        throw new Error();
      }

      const appEvents = getAppEvents();
      appEvents.publish({
        type: AppEvents.alertSuccess.name,
        payload: [`${props.namespace}/${props.name} was rolled back`],
      });
    } catch (_) {
      const appEvents = getAppEvents();
      appEvents.publish({
        type: AppEvents.alertError.name,
        payload: [`Failed to roll back ${props.namespace}/${props.name}`],
      });
    } finally {
      setIsLoading(false);
      props.onClose();
    }
  };

  return (
    <ConfirmModal
      isOpen={props.isOpen}
      title="Rollback release"
      body={`Are you sure you want to rollback ${props.namespace}/${props.name}?`}
      description={
        <div className={styles.body}>
          <Stack direction="column">
            <InlineField label="Version">
              <Input
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setVersion(parseInt(event.target.value, 10))
                }
                value={version}
              />
            </InlineField>
            <InlineField label="Cleanup on fail">
              <InlineSwitch
                value={options.cleanupOnFail}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setOptions({
                    ...options,
                    cleanupOnFail: event.target.checked,
                  })
                }
                disabled={isLoading}
              />
            </InlineField>
            <InlineField label="Dry run">
              <InlineSwitch
                value={options.dryRun}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setOptions({
                    ...options,
                    dryRun: event.target.checked,
                  })
                }
                disabled={isLoading}
              />
            </InlineField>
            <InlineField label="Force">
              <InlineSwitch
                value={options.force}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setOptions({
                    ...options,
                    force: event.target.checked,
                  })
                }
                disabled={isLoading}
              />
            </InlineField>
            <InlineField label="Max history">
              <Input
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setOptions({
                    ...options,
                    maxHistory: parseInt(event.target.value, 10),
                  })
                }
                value={options.maxHistory}
              />
            </InlineField>
            <InlineField label="Disable hooks">
              <InlineSwitch
                value={options.disableHooks}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setOptions({
                    ...options,
                    disableHooks: event.target.checked,
                  })
                }
                disabled={isLoading}
              />
            </InlineField>
            <InlineField label="Recreate">
              <InlineSwitch
                value={options.recreate}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setOptions({
                    ...options,
                    recreate: event.target.checked,
                  })
                }
                disabled={isLoading}
              />
            </InlineField>
            <InlineField label="Timeout">
              <Input
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setOptions({
                    ...options,
                    timeout: event.target.value,
                  })
                }
                value={options.timeout}
              />
            </InlineField>
            <InlineField label="Wait">
              <InlineSwitch
                value={options.wait}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setOptions({
                    ...options,
                    wait: event.target.checked,
                  })
                }
                disabled={isLoading}
              />
            </InlineField>
            <InlineField label="Wait for jobs">
              <InlineSwitch
                value={options.waitForJobs}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setOptions({
                    ...options,
                    waitForJobs: event.target.checked,
                  })
                }
                disabled={isLoading}
              />
            </InlineField>
            {isLoading && <LoadingPlaceholder text="Rolling back release..." />}
          </Stack>
        </div>
      }
      confirmText="Rollback"
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
