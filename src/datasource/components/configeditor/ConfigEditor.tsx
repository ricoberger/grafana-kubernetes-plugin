import React from 'react';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';

import {
  DataSourceOptions,
  KubernetesSecureJsonData,
} from '../../types/settings';
import { Cluster } from './Cluster';
import { Impersonate } from './Impersonate';
import { Integrations } from './Integrations';
import { GenerateKubeconfig } from './GenerateKubeconfig';
import { Grafana } from './Grafana';

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
