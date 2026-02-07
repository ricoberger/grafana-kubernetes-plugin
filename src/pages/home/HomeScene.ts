import { EmbeddedScene } from '@grafana/scenes';

import { Integrations } from './Integrations';
import { ROUTES } from '../../constants';
import resourcesImg from '../../img/logo.svg';
import helmImg from '../../img/helm.svg';
import fluxImg from '../../img/flux.svg';
import certmanagerImg from '../../img/cert-manager.svg';

export function HomeScene() {
  const integrations = new Integrations({
    items: [
      {
        route: ROUTES.Resources,
        title: 'Resources',
        image: resourcesImg,
        description: 'Manage your Kubernetes resources.',
        link: 'https://kubernetes.io',
      },
      {
        route: ROUTES.Helm,
        title: 'Helm',
        image: helmImg,
        description: 'Manage your Helm releases.',
        link: 'https://helm.sh',
      },
      {
        route: ROUTES.Flux,
        title: 'Flux',
        image: fluxImg,
        description: 'Manage your Flux resources.',
        link: 'https://fluxcd.io',
      },
      {
        route: ROUTES.CertManager,
        title: 'cert-manager',
        image: certmanagerImg,
        description: 'Manage your cert-manager resources.',
        link: 'https://cert-manager.io',
      },
      {
        route: ROUTES.Kubeconfig,
        title: 'Kubeconfig',
        image: resourcesImg,
        description: 'Generate a Kubeconfig file.',
        link: 'https://kubernetes.io',
      },
    ],
  });

  return new EmbeddedScene({
    body: integrations,
  });
}
