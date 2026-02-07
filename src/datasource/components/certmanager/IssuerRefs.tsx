import React from 'react';
import {
  EmbeddedScene,
  PanelBuilders,
  SceneFlexItem,
  SceneFlexLayout,
  SceneQueryRunner,
} from '@grafana/scenes';

import datasourcePluginJson from '../../../datasource/plugin.json';

interface Props {
  datasource?: string;
  resourceId: string;
  namespace?: string;
  name?: string;
  title: string;
}

export function IssuerRefs({
  datasource,
  resourceId,
  namespace,
  name,
  title,
}: Props) {
  const queryRunner = new SceneQueryRunner({
    datasource: {
      type: datasourcePluginJson.id,
      uid: datasource || undefined,
    },
    queries: [
      {
        refId: 'A',
        queryType: 'kubernetes-resources',
        resourceId: resourceId,
        namespace: namespace || '*',
        parameterName: 'jsonPath',
        parameterValue: `{.items[?(@.spec.issuerRef.name=='${name}')]}`,
      },
    ],
  });

  const scene = new EmbeddedScene({
    $data: queryRunner,
    body: new SceneFlexLayout({
      children: [
        new SceneFlexItem({
          body: PanelBuilders.table().setTitle(title).build(),
        }),
      ],
    }),
  });

  return <scene.Component model={scene} />;
}
