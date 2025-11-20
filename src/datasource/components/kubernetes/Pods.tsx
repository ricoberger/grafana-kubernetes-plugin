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
  namespace?: string;
  manifest?: KubernetesManifest;
}

export function Pods({ datasource, namespace, manifest }: Props) {
  /**
   * Create the selector which can be used to get the pods for all resources
   * except nodes. Therefore we check if the selector is defined in the query
   * and if not we use a different parameter name and value, to get the pods,
   * which are running on a node.
   */
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
        resourceId: 'pod',
        namespace: selector ? namespace : '*',
        parameterName: selector ? 'labelSelector' : 'fieldSelector',
        parameterValue: selector
          ? selector
          : `spec.nodeName=${manifest?.metadata?.name}`,
      },
    ],
  });

  const scene = new EmbeddedScene({
    $data: queryRunner,
    body: new SceneFlexLayout({
      children: [
        new SceneFlexItem({
          body: PanelBuilders.table().setTitle('Pods').build(),
        }),
      ],
    }),
  });

  return <scene.Component model={scene} />;
}
