import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import React from 'react';

import {
  DataSourceOptions,
  KubernetesSecureJsonData,
} from '../../types/settings';
import { Cluster } from './Cluster';
import { GenerateKubeconfig } from './GenerateKubeconfig';
import { Grafana } from './Grafana';
import { Impersonate } from './Impersonate';
import { Integrations } from './Integrations';

interface Props
  extends DataSourcePluginOptionsEditorProps<
    DataSourceOptions,
    KubernetesSecureJsonData
  > { }

export function ConfigEditor({ options, onOptionsChange }: Props) {
  return (
    <>
      <Cluster options={options} onOptionsChange={onOptionsChange} />
      <Grafana options={options} onOptionsChange={onOptionsChange} />
      <Impersonate options={options} onOptionsChange={onOptionsChange} />
      <GenerateKubeconfig options={options} onOptionsChange={onOptionsChange} />
      <Integrations options={options} onOptionsChange={onOptionsChange} />
    </>
  );
}
