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

export function resourcesScene() {
  const datasourceVariable = new DataSourceVariable({
    name: 'datasource',
    label: 'Datasource',
    pluginId: datasourcePluginJson.id,
  });

  const resourceVariable = new QueryVariable({
    name: 'resource',
    label: 'Resource',
    datasource: {
      type: datasourcePluginJson.id,
      uid: '${datasource}',
    },
    query: {
      refId: 'kubernetes-resourceids',
      queryType: 'kubernetes-resourceids',
    },
    sort: VariableSort.alphabeticalCaseInsensitiveAsc,
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
  });

  const queryRunner = new SceneQueryRunner({
    datasource: {
      type: datasourcePluginJson.id,
      uid: '${datasource}',
    },
    queries: [
      {
        refId: 'A',
        queryType: 'kubernetes-resources',
        resource: '${resource}',
        namespace: '${namespace}',
      },
    ],
  });

  return new EmbeddedScene({
    $variables: new SceneVariableSet({
      variables: [datasourceVariable, resourceVariable, namespaceVariable],
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
