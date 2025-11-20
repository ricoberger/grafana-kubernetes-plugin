import React, { useState } from 'react';
import { IconButton, Menu, WithContextMenu } from '@grafana/ui';
import { DataFrame } from '@grafana/data';

import { Query } from '../../types/query';
import { Reconcile } from './Reconcile';
import { Details } from './Details';
import { Suspend } from './Suspend';
import { Resume } from './Resume';

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
            {resourceId &&
              [
                'bucket.source.toolkit.fluxcd.io',
                'gitrepository.source.toolkit.fluxcd.io',
                'helmchart.source.toolkit.fluxcd.io',
                'helmrepository.source.toolkit.fluxcd.io',
                'ocirepository.source.toolkit.fluxcd.io',
                'kustomization.kustomize.toolkit.fluxcd.io',
                'helmrelease.helm.toolkit.fluxcd.io',
                'imagerepository.image.toolkit.fluxcd.io',
                'imageupdateautomation.image.toolkit.fluxcd.io',
                'receiver.notification.toolkit.fluxcd.io',
              ].includes(resourceId) && (
                <Menu.Item
                  label="Reconcile"
                  onClick={() => setOpen('reconcile')}
                />
              )}
            {resourceId &&
              [
                'bucket.source.toolkit.fluxcd.io',
                'gitrepository.source.toolkit.fluxcd.io',
                'helmchart.source.toolkit.fluxcd.io',
                'helmrepository.source.toolkit.fluxcd.io',
                'ocirepository.source.toolkit.fluxcd.io',
                'kustomization.kustomize.toolkit.fluxcd.io',
                'helmrelease.helm.toolkit.fluxcd.io',
                'imagerepository.image.toolkit.fluxcd.io',
                'imageupdateautomation.image.toolkit.fluxcd.io',
                'alert.notification.toolkit.fluxcd.io',
                'provider.notification.toolkit.fluxcd.io',
                'receiver.notification.toolkit.fluxcd.io',
              ].includes(resourceId) && (
                <Menu.Item label="Suspend" onClick={() => setOpen('suspend')} />
              )}
            {resourceId &&
              [
                'bucket.source.toolkit.fluxcd.io',
                'gitrepository.source.toolkit.fluxcd.io',
                'helmchart.source.toolkit.fluxcd.io',
                'helmrepository.source.toolkit.fluxcd.io',
                'ocirepository.source.toolkit.fluxcd.io',
                'kustomization.kustomize.toolkit.fluxcd.io',
                'helmrelease.helm.toolkit.fluxcd.io',
                'imagerepository.image.toolkit.fluxcd.io',
                'imageupdateautomation.image.toolkit.fluxcd.io',
                'alert.notification.toolkit.fluxcd.io',
                'provider.notification.toolkit.fluxcd.io',
                'receiver.notification.toolkit.fluxcd.io',
              ].includes(resourceId) && (
                <Menu.Item label="Resume" onClick={() => setOpen('resume')} />
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

      <Reconcile
        datasource={datasource}
        resourceId={resourceId}
        namespace={namespace}
        name={name}
        isOpen={open === 'reconcile'}
        onClose={() => setOpen('')}
      />

      <Suspend
        datasource={datasource}
        resourceId={resourceId}
        namespace={namespace}
        name={name}
        isOpen={open === 'suspend'}
        onClose={() => setOpen('')}
      />

      <Resume
        datasource={datasource}
        resourceId={resourceId}
        namespace={namespace}
        name={name}
        isOpen={open === 'resume'}
        onClose={() => setOpen('')}
      />
    </>
  );
}
