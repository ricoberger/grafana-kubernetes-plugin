import React, { useState } from 'react';
import { Card } from '@grafana/ui';
import { DataSourceSettings } from '@grafana/data';

import { Kubeconfig } from './Kubeconfig';

interface Props {
  datasource: DataSourceSettings;
}

export function Datasource({ datasource }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <li>
        <Card noMargin onClick={() => setOpen(true)}>
          <Card.Heading>{datasource.name}</Card.Heading>
          <Card.Figure>
            <img
              src={datasource.typeLogoUrl}
              alt={`${datasource.name} logo`}
              width="40"
              height="40"
            />
          </Card.Figure>
        </Card>
      </li>

      {open && (
        <Kubeconfig
          datasource={datasource.uid || null}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
