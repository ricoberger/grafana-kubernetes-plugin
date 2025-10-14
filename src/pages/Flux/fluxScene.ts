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

export function fluxScene() {
  const datasourceVariable = new DataSourceVariable({
    name: 'datasource',
    label: 'Datasource',
    pluginId: datasourcePluginJson.id,
  });

  const resourceVariable = new CustomVariable({
    name: 'resource',
    label: 'Resource',
    value: 'TODO',
    query:
      'Buckets : buckets.source.toolkit.fluxcd.io, Git Repositories : gitrepositories.source.toolkit.fluxcd.io, Helm Charts : helmcharts.source.toolkit.fluxcd.io, Helm Repositories : helmrepositories.source.toolkit.fluxcd.io, OCI Repositories : ocirepositories.source.toolkit.fluxcd.io, Kustomizations : kustomizations.kustomize.toolkit.fluxcd.io, Helm Releases : helmreleases.helm.toolkit.fluxcd.io, Image Policies : imagepolicies.image.toolkit.fluxcd.io, Image Repositories : imagerepositories.image.toolkit.fluxcd.io, Image Update Automations : imageupdateautomations.image.toolkit.fluxcd.io, Alerts : alerts.notification.toolkit.fluxcd.io, Providers : providers.notification.toolkit.fluxcd.io, Receivers : receivers.notification.toolkit.fluxcd.io,',
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
