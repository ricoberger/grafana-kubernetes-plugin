import React, { useState } from 'react';
import { IconButton, Menu, WithContextMenu } from '@grafana/ui';
import { DataFrame } from '@grafana/data';

import { Query } from '../../types/query';
import { Details } from './Details';
import { Rollback } from './Rollback';
import { Uninstall } from './Uninstall';

interface Props {
  query: Query;
  frame: DataFrame;
  rowIndex: number;
}

export function Actions({ query, frame, rowIndex }: Props) {
  const [open, setOpen] = useState('');

  const datasource = query.datasource?.uid;
  const namespace = frame.fields.find((f) => f.name === 'Namespace')?.values[
    rowIndex
  ];
  const name = frame.fields.find((f) => f.name === 'Name')?.values[rowIndex];
  const version = frame.fields.find((f) => f.name === 'Revision')?.values[
    rowIndex
  ];

  return (
    <>
      <WithContextMenu
        renderMenuItems={() => (
          <Menu.Group>
            <Menu.Item label="Details" onClick={() => setOpen('details')} />
            <Menu.Item label="Rollback" onClick={() => setOpen('rollback')} />
            <Menu.Item label="Uninstall" onClick={() => setOpen('uninstall')} />
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
          namespace={namespace}
          name={name}
          version={version}
          onClose={() => setOpen('')}
        />
      )}

      <Rollback
        datasource={datasource}
        namespace={namespace}
        name={name}
        version={version}
        isOpen={open === 'rollback'}
        onClose={() => setOpen('')}
      />

      <Uninstall
        datasource={datasource}
        namespace={namespace}
        name={name}
        version={version}
        isOpen={open === 'uninstall'}
        onClose={() => setOpen('')}
      />
    </>
  );
}
