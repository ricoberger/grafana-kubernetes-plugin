import React from 'react';
import {
  EmbeddedScene,
  PanelBuilders,
  SceneFlexItem,
  SceneFlexLayout,
  SceneQueryRunner,
} from '@grafana/scenes';

import datasourcePluginJson from '../../../datasource/plugin.json';
import { KubernetesManifest } from '../../types/kubernetes';

interface Props {
  datasource?: string;
  resourceId?: string;
  namespace?: string;
  name?: string;
  manifest?: KubernetesManifest;
}

export function Top({ datasource, resourceId, namespace, manifest }: Props) {
  const selector = manifest?.spec?.selector?.matchLabels
    ? Object.keys(manifest?.spec.selector.matchLabels)
      .map((key) => `${key}=${manifest?.spec.selector.matchLabels[key]}`)
      .join(',')
    : '';

  const queryRunner = new SceneQueryRunner({
    datasource: {
      type: datasourcePluginJson.id,
      uid: datasource || undefined,
    },
    queries: [
      {
        refId: 'A',
        queryType: 'kubernetes-resources',
        resourceId:
          resourceId === 'node'
            ? 'nodemetrics.metrics.k8s.io'
            : 'podmetrics.metrics.k8s.io',
        namespace: resourceId === 'node' ? '*' : namespace,
        parameterName: selector ? 'labelSelector' : 'fieldSelector',
        parameterValue: selector
          ? selector
          : `metadata.name=${manifest?.metadata?.name}`,
      },
    ],
  });

  const scene = new EmbeddedScene({
    $data: queryRunner,
    body: new SceneFlexLayout({
      children: [
        new SceneFlexItem({
          body: PanelBuilders.table().setTitle('Top').build(),
        }),
      ],
    }),
  });

  return <scene.Component model={scene} />;
}
