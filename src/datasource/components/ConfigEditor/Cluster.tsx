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

export function Cluster(props: Props) {
  const { onOptionsChange, options } = props;
  const { jsonData, secureJsonFields, secureJsonData } = options;

  return (
    <div>
      <InlineField label="Type" labelWidth={20}>
        <RadioButtonGroup<ClusterProvider>
          options={[
            { label: 'In-Cluster', value: 'incluster' },
            { label: 'Path', value: 'path' },
            { label: 'Kubeconfig', value: 'kubeconfig' },
          ]}
          value={jsonData.clusterProvider}
          onChange={(value: ClusterProvider) => {
            onOptionsChange({
              ...options,
              jsonData: {
                ...jsonData,
                clusterProvider: value,
              },
            });
          }}
        />
      </InlineField>

      {jsonData.clusterProvider === 'path' && (
        <>
          <InlineField label="Path" labelWidth={20} interactive>
            <Input
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                onOptionsChange({
                  ...options,
                  jsonData: {
                    ...jsonData,
                    clusterPath: event.target.value,
                  },
                });
              }}
              value={jsonData.clusterPath}
              width={65}
            />
          </InlineField>
          <InlineField label="Context" labelWidth={20} interactive>
            <Input
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                onOptionsChange({
                  ...options,
                  jsonData: {
                    ...jsonData,
                    clusterContext: event.target.value,
                  },
                });
              }}
              value={jsonData.clusterContext}
              width={65}
            />
          </InlineField>
        </>
      )}
      {jsonData.clusterProvider === 'kubeconfig' && (
        <InlineField label="Kubeconfig" labelWidth={20} interactive>
          <SecretTextArea
            isConfigured={secureJsonFields.kubeconfig}
            value={secureJsonData?.clusterKubeconfig}
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
