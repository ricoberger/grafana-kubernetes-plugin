import React, { useState } from 'react';
import { IconButton, Menu, WithContextMenu } from '@grafana/ui';
import { DataFrame } from '@grafana/data';

import { Query } from '../../types/query';
import { ReconcileAction } from './ReconcileAction';
import { DetailsAction } from './DetailsAction';
import { SuspendAction } from './SuspendAction';
import { ResumeAction } from './ResumeAction';

interface Props {
  query: Query;
  frame: DataFrame;
  rowIndex: number;
}

/**
 * The Actions component renders a context menu with various actions for a Flux
 * resource.
 */
export function Actions(props: Props) {
  const [open, setOpen] = useState('');

  const datasource = props.query.datasource?.uid;
  const resource = props.query.resource;
  const namespace = props.frame.fields.find((f) => f.name === 'Namespace')
    ?.values[props.rowIndex];
  const name = props.frame.fields.find((f) => f.name === 'Name')?.values[
    props.rowIndex
  ];

  return (
    <>
      <WithContextMenu
        renderMenuItems={() => (
          <Menu.Group>
            <Menu.Item label="Details" onClick={() => setOpen('details')} />
            {resource &&
              [
                'buckets.source.toolkit.fluxcd.io',
                'gitrepositories.source.toolkit.fluxcd.io',
                'helmcharts.source.toolkit.fluxcd.io',
                'helmrepositories.source.toolkit.fluxcd.io',
                'ocirepositories.source.toolkit.fluxcd.io',
                'kustomizations.kustomize.toolkit.fluxcd.io',
                'helmreleases.helm.toolkit.fluxcd.io',
                'imagerepositories.image.toolkit.fluxcd.io',
                'imageupdateautomations.image.toolkit.fluxcd.io',
                'receivers.notification.toolkit.fluxcd.io',
              ].includes(resource) && (
                <Menu.Item
                  label="Reconcile"
                  onClick={() => setOpen('reconcile')}
                />
              )}
            {resource &&
              [
                'buckets.source.toolkit.fluxcd.io',
                'gitrepositories.source.toolkit.fluxcd.io',
                'helmcharts.source.toolkit.fluxcd.io',
                'helmrepositories.source.toolkit.fluxcd.io',
                'ocirepositories.source.toolkit.fluxcd.io',
                'kustomizations.kustomize.toolkit.fluxcd.io',
                'helmreleases.helm.toolkit.fluxcd.io',
                'imagerepositories.image.toolkit.fluxcd.io',
                'imageupdateautomations.image.toolkit.fluxcd.io',
                'alerts.notification.toolkit.fluxcd.io',
                'providers.notification.toolkit.fluxcd.io',
                'receivers.notification.toolkit.fluxcd.io',
              ].includes(resource) && (
                <Menu.Item label="Suspend" onClick={() => setOpen('suspend')} />
              )}
            {resource &&
              [
                'buckets.source.toolkit.fluxcd.io',
                'gitrepositories.source.toolkit.fluxcd.io',
                'helmcharts.source.toolkit.fluxcd.io',
                'helmrepositories.source.toolkit.fluxcd.io',
                'ocirepositories.source.toolkit.fluxcd.io',
                'kustomizations.kustomize.toolkit.fluxcd.io',
                'helmreleases.helm.toolkit.fluxcd.io',
                'imagerepositories.image.toolkit.fluxcd.io',
                'imageupdateautomations.image.toolkit.fluxcd.io',
                'alerts.notification.toolkit.fluxcd.io',
                'providers.notification.toolkit.fluxcd.io',
                'receivers.notification.toolkit.fluxcd.io',
              ].includes(resource) && (
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
        <DetailsAction
          datasource={datasource}
          resource={resource}
          namespace={namespace}
          name={name}
          onClose={() => setOpen('')}
        />
      )}

      <ReconcileAction
        datasource={datasource}
        resource={resource}
        namespace={namespace}
        name={name}
        isOpen={open === 'reconcile'}
        onClose={() => setOpen('')}
      />

      <SuspendAction
        datasource={datasource}
        resource={resource}
        namespace={namespace}
        name={name}
        isOpen={open === 'suspend'}
        onClose={() => setOpen('')}
      />

      <ResumeAction
        datasource={datasource}
        resource={resource}
        namespace={namespace}
        name={name}
        isOpen={open === 'resume'}
        onClose={() => setOpen('')}
      />
    </>
  );
}
