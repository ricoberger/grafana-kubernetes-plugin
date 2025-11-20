import { EmbeddedScene } from '@grafana/scenes';

import { Datasources } from './Datasources';

export function KubeconfigScene() {
  const datasources = new Datasources({});

  return new EmbeddedScene({
    body: datasources,
  });
}
