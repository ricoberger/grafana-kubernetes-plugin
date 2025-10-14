import { EmbeddedScene } from '@grafana/scenes';

import { Datasources } from '../../components/Kubeconfig/Datasources';

export function kubeconfigScene() {
  const datasources = new Datasources({});

  return new EmbeddedScene({
    body: datasources,
  });
}
