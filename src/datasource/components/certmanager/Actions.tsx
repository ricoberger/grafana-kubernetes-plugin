import React, { useState } from 'react';
import { IconButton, Menu, WithContextMenu } from '@grafana/ui';
import { DataFrame } from '@grafana/data';

import { Query } from '../../types/query';
import { Renew } from './Renew';
import { Details } from './Details';
import { CRApprove } from './CRApprove';
import { CRDeny } from './CRDeny';

interface Props {
  query: Query;
  frame: DataFrame;
  rowIndex: number;
}

export function Actions({ query, frame, rowIndex }: Props) {
  const [open, setOpen] = useState('');

  const datasource = query.datasource?.uid;
  const resourceId = query.resourceId;
  const namespace = frame.fields.find((f) => f.name === 'Namespace')?.values[
    rowIndex
  ];
  const name = frame.fields.find((f) => f.name === 'Name')?.values[rowIndex];

  return (
    <>
      <WithContextMenu
        renderMenuItems={() => (
          <Menu.Group>
            <Menu.Item label="Details" onClick={() => setOpen('details')} />
            {resourceId === 'certificate.cert-manager.io' && (
              <Menu.Item label="Renew" onClick={() => setOpen('renew')} />
            )}
            {resourceId === 'certificaterequest.cert-manager.io' && (
              <Menu.Item label="Approve" onClick={() => setOpen('crapprove')} />
            )}
            {resourceId === 'certificaterequest.cert-manager.io' && (
              <Menu.Item label="Deny" onClick={() => setOpen('crdeny')} />
            )}
          </Menu.Group>
        )}
      >
        {({ openMenu }) => (
          <IconButton name="cog" onClick={openMenu} tooltip="Actions" />
        )}
      </WithContextMenu>

      {open === 'details' && (
        <Details
          datasource={datasource}
          resourceId={resourceId}
          namespace={namespace}
          name={name}
          onClose={() => setOpen('')}
        />
      )}

      <Renew
        datasource={datasource}
        resourceId={resourceId}
        namespace={namespace}
        name={name}
        isOpen={open === 'renew'}
        onClose={() => setOpen('')}
      />

      <CRApprove
        datasource={datasource}
        resourceId={resourceId}
        name={name}
        isOpen={open === 'crapprove'}
        onClose={() => setOpen('')}
      />

      <CRDeny
        datasource={datasource}
        resourceId={resourceId}
        name={name}
        isOpen={open === 'crdeny'}
        onClose={() => setOpen('')}
      />
    </>
  );
}
