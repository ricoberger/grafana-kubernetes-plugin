import React from 'react';
import {
  EmbeddedScene,
  PanelBuilders,
  SceneFlexItem,
  SceneFlexLayout,
  SceneQueryRunner,
} from '@grafana/scenes';

import datasourcePluginJson from '../../../plugin.json';

interface Props {
  datasource?: string;
  namespace?: string;
  name?: string;
}

export function Events({ datasource, namespace, name }: Props) {
  const queryRunner = new SceneQueryRunner({
    datasource: {
      type: datasourcePluginJson.id,
      uid: datasource || undefined,
    },
    queries: [
      {
        refId: 'A',
        queryType: 'kubernetes-resources',
        resource: 'events',
        namespace: namespace || '*',
        parameterName: 'fieldSelector',
        parameterValue: `involvedObject.name=${name}`,
      },
    ],
  });

  const scene = new EmbeddedScene({
    $data: queryRunner,
    body: new SceneFlexLayout({
      children: [
        new SceneFlexItem({
          body: PanelBuilders.table().setTitle('Events').build(),
        }),
      ],
    }),
  });

  return <scene.Component model={scene} />;
}
