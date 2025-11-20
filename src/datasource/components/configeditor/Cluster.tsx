import React, { ChangeEvent } from 'react';
import {
  InlineField,
  Input,
  RadioButtonGroup,
  SecretTextArea,
} from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';

import {
  DataSourceOptions,
  ClusterProvider,
  KubernetesSecureJsonData,
} from '../../types/settings';

interface Props
  extends DataSourcePluginOptionsEditorProps<
    DataSourceOptions,
    KubernetesSecureJsonData
  > { }

export function Cluster({ options, onOptionsChange }: Props) {
  return (
    <div>
      <InlineField label="Type" labelWidth={20}>
        <RadioButtonGroup<ClusterProvider>
          options={[
            { label: 'In-Cluster', value: 'incluster' },
            { label: 'Path', value: 'path' },
            { label: 'Kubeconfig', value: 'kubeconfig' },
          ]}
          value={options.jsonData.clusterProvider}
          onChange={(value: ClusterProvider) => {
            onOptionsChange({
              ...options,
              jsonData: {
                ...options.jsonData,
                clusterProvider: value,
              },
            });
          }}
        />
      </InlineField>

      {options.jsonData.clusterProvider === 'path' && (
        <>
          <InlineField label="Path" labelWidth={20} interactive>
            <Input
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                onOptionsChange({
                  ...options,
                  jsonData: {
                    ...options.jsonData,
                    clusterPath: event.target.value,
                  },
                });
              }}
              value={options.jsonData.clusterPath}
              width={65}
            />
          </InlineField>
          <InlineField label="Context" labelWidth={20} interactive>
            <Input
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                onOptionsChange({
                  ...options,
                  jsonData: {
                    ...options.jsonData,
                    clusterContext: event.target.value,
                  },
                });
              }}
              value={options.jsonData.clusterContext}
              width={65}
            />
          </InlineField>
        </>
      )}
      {options.jsonData.clusterProvider === 'kubeconfig' && (
        <InlineField label="Kubeconfig" labelWidth={20} interactive>
          <SecretTextArea
            isConfigured={options.secureJsonFields.kubeconfig}
            value={options.secureJsonData?.clusterKubeconfig}
            rows={20}
            cols={56}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
              onOptionsChange({
                ...options,
                secureJsonData: {
                  clusterKubeconfig: event.target.value,
                },
              });
            }}
            onReset={() => {
              onOptionsChange({
                ...options,
                secureJsonFields: {
                  ...options.secureJsonFields,
                  kubeconfig: false,
                },
                secureJsonData: {
                  ...options.secureJsonData,
                  clusterKubeconfig: '',
                },
              });
            }}
          />
        </InlineField>
      )}
    </div>
  );
}
