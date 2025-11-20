import {
  EmbeddedScene,
  PanelBuilders,
  SceneControlsSpacer,
  SceneFlexItem,
  SceneFlexLayout,
  SceneQueryRunner,
  SceneRefreshPicker,
  DataSourceVariable,
  SceneVariableSet,
  VariableValueSelectors,
  QueryVariable,
} from '@grafana/scenes';
import { VariableSort } from '@grafana/data';

import datasourcePluginJson from '../../datasource/plugin.json';
import { DEFAULT_QUERIES } from '../../datasource/types/query';

export function HelmScene() {
  const datasourceVariable = new DataSourceVariable({
    name: 'datasource',
    label: 'Datasource',
    pluginId: datasourcePluginJson.id,
  });

  const namespaceVariable = new QueryVariable({
    name: 'namespace',
    label: 'Namespace',
    datasource: {
      type: datasourcePluginJson.id,
      uid: '${datasource}',
    },
    query: {
      refId: 'kubernetes-namespaces',
      queryType: 'kubernetes-namespaces',
    },
    sort: VariableSort.alphabeticalCaseInsensitiveAsc,
    value: DEFAULT_QUERIES['helm-releases'].namespace,
  });

  const queryRunner = new SceneQueryRunner({
    datasource: {
      type: datasourcePluginJson.id,
      uid: '${datasource}',
    },
    queries: [
      {
        refId: 'A',
        queryType: 'helm-releases',
        resource: '${resource}',
        namespace: '${namespace}',
      },
    ],
  });

  return new EmbeddedScene({
    $variables: new SceneVariableSet({
      variables: [datasourceVariable, namespaceVariable],
    }),
    $data: queryRunner,
    body: new SceneFlexLayout({
      children: [
        new SceneFlexItem({
          body: PanelBuilders.table().setTitle('Resources').build(),
        }),
      ],
    }),
    controls: [
      new VariableValueSelectors({}),
      new SceneControlsSpacer(),
      new SceneRefreshPicker({
        isOnCanvas: true,
      }),
    ],
  });
}
