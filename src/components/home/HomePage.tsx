import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Card, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { ROUTES } from '../../constants';
import resourcesImg from '../../img/logo.svg';
import helmImg from '../../img/helm.svg';
import fluxImg from '../../img/flux.svg';
import certmanagerImg from '../../img/cert-manager.svg';
import { prefixRoute } from '../../utils/utils.routing';

interface Item {
  route: ROUTES;
  title: string;
  image: string;
  description: string;
  link: string;
}

const items: Item[] = [
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
];

export const HomePage = () => {
  const styles = useStyles2((theme: GrafanaTheme2) => {
    return {
      title: {
        image: css({
          width: '32px',
          height: '32px',
          marginRight: '16px',
        }),
      },
      list: css({
        listStyle: 'none',
        display: 'grid',
        gap: theme.spacing(1),
      }),
    };
  });

  return (
    <PluginPage>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.route} data-testid={`integration-${item.route}`}>
            <Card noMargin href={prefixRoute(item.route)}>
              <Card.Heading>{item.title}</Card.Heading>
              <Card.Figure>
                <img
                  src={item.image}
                  alt={`${item.title} logo`}
                  width="40"
                  height="40"
                />
              </Card.Figure>
              <Card.Meta>
                <span>{item.description}</span>
                <a href={item.link}>{item.link}</a>
              </Card.Meta>
            </Card>
          </li>
        ))}
      </ul>
    </PluginPage>
  );
};
