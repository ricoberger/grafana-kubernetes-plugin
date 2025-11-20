import React, { ChangeEvent, useState } from 'react';
import {
  Combobox,
  ComboboxOption,
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

import { UninstallOptions } from '../../types/helm';

interface Props {
  datasource?: string;
  namespace?: string;
  name?: string;
  version?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function Uninstall({
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
  const [options, setOptions] = useState<UninstallOptions>({
    cascade: 'background',
    dryRun: false,
    keepHistory: false,
    disableHooks: false,
    timeout: '10m',
    wait: false,
  });

  const onConfirm = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(
        `/api/datasources/uid/${datasource}/resources/helm/${namespace}/${name}/${version}/uninstall`,
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

      const data = await response.json();

      const appEvents = getAppEvents();
      appEvents.publish({
        type: AppEvents.alertSuccess.name,
        payload: [
          `${namespace}/${name} was uninstalled${data.info ? `: ${data.info}` : ''}`,
        ],
      });
    } catch (_) {
      const appEvents = getAppEvents();
      appEvents.publish({
        type: AppEvents.alertError.name,
        payload: [`Failed to uninstall ${namespace}/${name}`],
      });
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <ConfirmModal
      isOpen={isOpen}
      title="Uninstall release"
      body={`Are you sure you want to uninstall ${namespace}/${name}?`}
      description={
        <div className={styles.body}>
          <Stack direction="column">
            <InlineField label="Cascade">
              <Combobox<string>
                value={options.cascade}
                options={[
                  { label: 'Background', value: 'background' },
                  { label: 'Foreground', value: 'foreground' },
                  { label: 'Orphan', value: 'orphan' },
                ]}
                onChange={(option: ComboboxOption<string>) =>
                  setOptions({ ...options, cascade: option.value })
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
            <InlineField label="Keep history">
              <InlineSwitch
                value={options.keepHistory}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setOptions({
                    ...options,
                    keepHistory: event.target.checked,
                  })
                }
                disabled={isLoading}
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
            {isLoading && <LoadingPlaceholder text="Uninstalling release..." />}
          </Stack>
        </div>
      }
      confirmText="Uninstall"
      confirmButtonVariant="destructive"
      dismissText="Cancel"
      onConfirm={onConfirm}
      onDismiss={() => onClose()}
      disabled={isLoading}
    />
  );
}
