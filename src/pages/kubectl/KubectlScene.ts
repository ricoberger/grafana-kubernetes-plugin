import { EmbeddedScene } from '@grafana/scenes';

import { Kubectl } from './Kubectl';

export function KubectlScene() {
  const kubectl = new Kubectl({});

  return new EmbeddedScene({
    body: kubectl,
  });
}
