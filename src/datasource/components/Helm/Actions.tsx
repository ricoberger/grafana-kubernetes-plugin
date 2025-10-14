import React, { useState } from 'react';
import { IconButton, Menu, WithContextMenu } from '@grafana/ui';
import { DataFrame } from '@grafana/data';

import { Query } from '../../types/query';
import { DetailsAction } from './DetailsAction';
import { RollbackAction } from './RollbackAction';
import { UninstallAction } from './UninstallAction';

interface Props {
  query: Query;
  frame: DataFrame;
  rowIndex: number;
}

/**
 * The Actions component renders a context menu with various actions for a
 * Kubernetes resource.
 */
export function Actions(props: Props) {
  const [open, setOpen] = useState('');

  const datasource = props.query.datasource?.uid;
  const namespace = props.frame.fields.find((f) => f.name === 'Namespace')
    ?.values[props.rowIndex];
  const name = props.frame.fields.find((f) => f.name === 'Name')?.values[
    props.rowIndex
  ];
  const version = props.frame.fields.find((f) => f.name === 'Revision')?.values[
    props.rowIndex
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
        <DetailsAction
          datasource={datasource}
          namespace={namespace}
          name={name}
          version={version}
          onClose={() => setOpen('')}
        />
      )}

      <RollbackAction
        datasource={datasource}
        namespace={namespace}
        name={name}
        version={version}
        isOpen={open === 'rollback'}
        onClose={() => setOpen('')}
      />

      <UninstallAction
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
