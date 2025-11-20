import React from 'react';
import {
  SceneComponentProps,
  SceneObjectBase,
  SceneObjectState,
} from '@grafana/scenes';
import { Card, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';

import { ROUTES } from '../../constants';
import { prefixRoute } from '../../utils/utils.routing';

interface Item {
  route: ROUTES;
  title: string;
  image: string;
  description: string;
  link: string;
}

interface IntegrationsState extends SceneObjectState {
  items: Item[];
}

export class Integrations extends SceneObjectBase<IntegrationsState> {
  static Component = IntegrationsRenderer;
}

function IntegrationsRenderer({ model }: SceneComponentProps<Integrations>) {
  const styles = useStyles2((theme: GrafanaTheme2) => {
    return {
      container: css({
        width: '100%',
      }),
      list: css({
        padding: '20px',
        listStyle: 'none',
        display: 'grid',
        gap: theme.spacing(1),
      }),
    };
  });

  const state = model.useState();

  return (
    <div className={styles.container}>
      <ul className={styles.list}>
        {state.items.map((item) => (
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
    </div>
  );
}
