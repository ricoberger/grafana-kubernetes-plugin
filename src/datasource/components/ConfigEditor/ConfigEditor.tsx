import React from 'react';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';

import {
  DataSourceOptions,
  KubernetesSecureJsonData,
} from '../../types/settings';
import { Cluster } from './Cluster';
import { Impersonate } from './Impersonate';
import { GenerateKubeconfig } from './GenerateKubeconfig';
import { Grafana } from './Grafana';

interface Props
  extends DataSourcePluginOptionsEditorProps<
    DataSourceOptions,
    KubernetesSecureJsonData
  > { }

export function ConfigEditor(props: Props) {
  return (
    <>
      <Cluster {...props} />
      <Grafana {...props} />
      <Impersonate {...props} />
      <GenerateKubeconfig {...props} />
    </>
  );
}
