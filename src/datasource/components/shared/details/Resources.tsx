import React from 'react';
import { Drawer } from '@grafana/ui';
import {
  EmbeddedScene,
  PanelBuilders,
  SceneFlexItem,
  SceneFlexLayout,
  SceneQueryRunner,
} from '@grafana/scenes';

import datasourcePluginJson from '../../../plugin.json';

interface Props {
  title: string;
  datasource?: string;
  resourceId?: string;
  namespace?: string;
  parameterName?: string;
  parameterValue?: string;
  onClose: () => void;
}

export function Resources({
  title,
  datasource,
  resourceId,
  namespace,
  parameterName,
  parameterValue,
  onClose,
}: Props) {
  console.log(datasource, resourceId, namespace, parameterName, parameterValue);

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
        parameterName: parameterName || '',
        parameterValue: parameterValue || '',
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

  return (
    <Drawer title={title} scrollableContent={false} onClose={() => onClose()}>
      <scene.Component model={scene} />
    </Drawer>
  );
}
