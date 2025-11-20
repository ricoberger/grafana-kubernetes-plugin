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
  CustomVariable,
} from '@grafana/scenes';
import { VariableSort } from '@grafana/data';

import datasourcePluginJson from '../../datasource/plugin.json';
import { DEFAULT_QUERIES } from '../../datasource/types/query';

export function FluxScene() {
  const datasourceVariable = new DataSourceVariable({
    name: 'datasource',
    label: 'Datasource',
    pluginId: datasourcePluginJson.id,
  });

  const resourceIdVariable = new CustomVariable({
    name: 'resourceId',
    label: 'Resource',
    query:
      'Bucket : bucket.source.toolkit.fluxcd.io, GitRepository : gitrepository.source.toolkit.fluxcd.io, HelmChart : helmchart.source.toolkit.fluxcd.io, HelmRepository : helmrepository.source.toolkit.fluxcd.io, OCIRepository : ocirepository.source.toolkit.fluxcd.io, Kustomization : kustomization.kustomize.toolkit.fluxcd.io, HelmRelease : helmrelease.helm.toolkit.fluxcd.io, ImagePolicy : imagepolicy.image.toolkit.fluxcd.io, ImageRepository : imagerepository.imagerepositories.image.toolkit.fluxcd.io, ImageUpdateAutomation : imageupdateautomation.image.toolkit.fluxcd.io, Alert : alert.notification.toolkit.fluxcd.io, Provider : provider.notification.toolkit.fluxcd.io, Receiver : receiver.notification.toolkit.fluxcd.io,',
    value: DEFAULT_QUERIES['flux-resources'].resourceId,
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
    value: DEFAULT_QUERIES['flux-resources'].namespace,
  });

  const queryRunner = new SceneQueryRunner({
    datasource: {
      type: datasourcePluginJson.id,
      uid: '${datasource}',
    },
    queries: [
      {
        refId: 'A',
        queryType: 'flux-resources',
        resourceId: '${resourceId}',
        namespace: '${namespace}',
      },
    ],
  });

  return new EmbeddedScene({
    $variables: new SceneVariableSet({
      variables: [datasourceVariable, resourceIdVariable, namespaceVariable],
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
