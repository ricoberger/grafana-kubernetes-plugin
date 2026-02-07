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

export function CertManagerScene() {
  const datasourceVariable = new DataSourceVariable({
    name: 'datasource',
    label: 'Datasource',
    pluginId: datasourcePluginJson.id,
  });

  const resourceIdVariable = new CustomVariable({
    name: 'resourceId',
    label: 'Resource',
    query:
      'Issuer : issuer.cert-manager.io, Order : order.acme.cert-manager.io, Challenge : challenge.acme.cert-manager.io, ClusterIssuer : clusterissuer.cert-manager.io, CertificateRequest : certificaterequest.cert-manager.io, Certificate : certificate.cert-manager.io',
    value: DEFAULT_QUERIES['certmanager-resources'].resourceId,
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
    value: DEFAULT_QUERIES['certmanager-resources'].namespace,
  });

  const queryRunner = new SceneQueryRunner({
    datasource: {
      type: datasourcePluginJson.id,
      uid: '${datasource}',
    },
    queries: [
      {
        refId: 'A',
        queryType: 'certmanager-resources',
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
