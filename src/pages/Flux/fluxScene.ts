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

export function fluxScene() {
  const datasourceVariable = new DataSourceVariable({
    name: 'datasource',
    label: 'Datasource',
    pluginId: datasourcePluginJson.id,
  });

  const resourceVariable = new CustomVariable({
    name: 'resource',
    label: 'Resource',
    query:
      'Bucket : buckets.source.toolkit.fluxcd.io, GitRepository : gitrepositories.source.toolkit.fluxcd.io, HelmChart : helmcharts.source.toolkit.fluxcd.io, HelmRepository : helmrepositories.source.toolkit.fluxcd.io, OCIRepository : ocirepositories.source.toolkit.fluxcd.io, Kustomization : kustomizations.kustomize.toolkit.fluxcd.io, HelmRelease : helmreleases.helm.toolkit.fluxcd.io, ImagePolicy : imagepolicies.image.toolkit.fluxcd.io, ImageRepository : imagerepositories.image.toolkit.fluxcd.io, ImageUpdateAutomation : imageupdateautomations.image.toolkit.fluxcd.io, Alert : alerts.notification.toolkit.fluxcd.io, Provider : providers.notification.toolkit.fluxcd.io, Receiver : receivers.notification.toolkit.fluxcd.io,',
    value: DEFAULT_QUERIES['flux-resources'].resource,
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
