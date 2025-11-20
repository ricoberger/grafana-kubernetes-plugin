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

import { RollbackOptions } from '../../types/helm';

interface Props {
  datasource?: string;
  namespace?: string;
  name?: string;
  version?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function Rollback({
  datasource,
  namespace,
  name,
  version,
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
  const [options, setOptions] = useState<RollbackOptions>({
    version: version || 1,
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

  const onConfirm = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(
        `/api/datasources/uid/${datasource}/resources/helm/${namespace}/${name}/${options.version}/rollback`,
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
        payload: [`${namespace}/${name} was rolled back`],
      });
    } catch (_) {
      const appEvents = getAppEvents();
      appEvents.publish({
        type: AppEvents.alertError.name,
        payload: [`Failed to roll back ${namespace}/${name}`],
      });
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <ConfirmModal
      isOpen={isOpen}
      title="Rollback release"
      body={`Are you sure you want to rollback ${namespace}/${name}?`}
      description={
        <div className={styles.body}>
          <Stack direction="column">
            <InlineField label="Version">
              <Input
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setOptions({
                    ...options,
                    version: parseInt(event.target.value, 10),
                  })
                }
                value={options.version}
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
      onDismiss={() => onClose()}
      disabled={isLoading}
    />
  );
}
