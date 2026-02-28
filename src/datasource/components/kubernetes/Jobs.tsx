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
  namespace?: string;
  name?: string;
}

export function Jobs({ datasource, namespace, name }: Props) {
  const queryRunner = new SceneQueryRunner({
    datasource: {
      type: datasourcePluginJson.id,
      uid: datasource || undefined,
    },
    queries: [
      {
        refId: 'A',
        queryType: 'kubernetes-resources',
        resourceId: 'job.batch',
        namespace: namespace,
        parameterName: 'jsonPath',
        parameterValue: `{.items[?(@.metadata.ownerReferences[0].name=='${name}')]}`,
      },
    ],
  });

  const scene = new EmbeddedScene({
    $data: queryRunner,
    body: new SceneFlexLayout({
      children: [
        new SceneFlexItem({
          body: PanelBuilders.table().setTitle('Jobs').build(),
        }),
      ],
    }),
  });

  return <scene.Component model={scene} />;
}
