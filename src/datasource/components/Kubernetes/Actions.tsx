import React, { useState } from 'react';
import { IconButton, Menu, WithContextMenu } from '@grafana/ui';
import { DataFrame } from '@grafana/data';

import datasourcePluginJson from '../../../datasource/plugin.json';
import { Query } from '../../types/query';
import { DeleteAction } from './DeleteAction';
import { ScaleAction } from './ScaleAction';
import { RestartAction } from './RestartAction';
import { CreateJobAction } from './CreateJobAction';
import { EditAction } from './EditAction';
import { DetailsAction } from './DetailsAction';

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
              ['deployments', 'statefulsets', 'replicasets'].includes(
                resource,
              ) && <Menu.Item label="Scale" onClick={() => setOpen('scale')} />}
            {resource &&
              ['daemonsets', 'deployments', 'statefulsets'].includes(
                resource,
              ) && (
                <Menu.Item label="Restart" onClick={() => setOpen('restart')} />
              )}
            {resource && ['cronjobs'].includes(resource) && (
              <Menu.Item
                label="Create job"
                onClick={() => setOpen('createjob')}
              />
            )}
            {resource &&
              [
                'daemonsets',
                'deployments',
                'jobs',
                'pods',
                'statefulsets',
              ].includes(resource) && (
                <Menu.Item
                  label="Logs"
                  target="_blank"
                  url={`/explore?schemaVersion=1&panes={"ncx":{"datasource":"${datasource}","queries":[{"queryType":"kubernetes-logs","namespace":"${namespace}","resource":"${resource}","parameterName":"","parameterValue":"","wide":false,"refId":"A","datasource":{"type":"${datasourcePluginJson.id}","uid":"${datasource}"},"name":"${name}","container":""}],"range":{"from":"now-1h","to":"now"}}}`}
                />
              )}
            <Menu.Item label="Edit" onClick={() => setOpen('edit')} />
            <Menu.Item label="Delete" onClick={() => setOpen('delete')} />
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

      <ScaleAction
        datasource={datasource}
        resource={resource}
        namespace={namespace}
        name={name}
        isOpen={open === 'scale'}
        onClose={() => setOpen('')}
      />

      <RestartAction
        datasource={datasource}
        resource={resource}
        namespace={namespace}
        name={name}
        isOpen={open === 'restart'}
        onClose={() => setOpen('')}
      />

      <CreateJobAction
        datasource={datasource}
        resource={resource}
        namespace={namespace}
        name={name}
        isOpen={open === 'createjob'}
        onClose={() => setOpen('')}
      />

      {open === 'edit' && (
        <EditAction
          datasource={datasource}
          resource={resource}
          namespace={namespace}
          name={name}
          onClose={() => setOpen('')}
        />
      )}

      <DeleteAction
        datasource={datasource}
        resource={resource}
        namespace={namespace}
        name={name}
        isOpen={open === 'delete'}
        onClose={() => setOpen('')}
      />
    </>
  );
}
