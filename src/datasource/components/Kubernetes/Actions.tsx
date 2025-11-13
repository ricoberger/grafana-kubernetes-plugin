import React, { useEffect, useState } from 'react';
import { IconButton, Menu, WithContextMenu } from '@grafana/ui';
import { DataFrame } from '@grafana/data';
import { llm } from '@grafana/llm';

import { Query } from '../../types/query';
import { DataSourceOptions } from '../../types/settings';
import { DeleteAction } from './DeleteAction';
import { ScaleAction } from './ScaleAction';
import { RestartAction } from './RestartAction';
import { CreateJobAction } from './CreateJobAction';
import { EditAction } from './EditAction';
import { DetailsAction } from './DetailsAction';
import { AIAction } from './AIAction';

interface Props {
  query: Query;
  frame: DataFrame;
  rowIndex: number;
  settings: DataSourceOptions;
}

/**
 * The Actions component renders a context menu with various actions for a
 * Kubernetes resource.
 */
export function Actions(props: Props) {
  const [open, setOpen] = useState('');
  const [isAIEnabled, setIsAIEnabled] = useState(false);

  const datasource = props.query.datasource?.uid;
  const resource = props.query.resource;
  const namespace = props.frame.fields.find((f) => f.name === 'Namespace')
    ?.values[props.rowIndex];
  const name = props.frame.fields.find((f) => f.name === 'Name')?.values[
    props.rowIndex
  ];

  /**
   * If the Grafana LLM plugin is enabled, we set the "isAIEnabled" state to
   * "true" to render the AI action in the context menu.
   */
  useEffect(() => {
    const checkIsAIEnabled = async () => {
      try {
        const enabled = await llm.enabled();
        setIsAIEnabled(enabled);
      } catch (_) { }
    };

    checkIsAIEnabled();
  }, []);

  return (
    <>
      <WithContextMenu
        renderMenuItems={() => (
          <Menu.Group>
            <Menu.Item label="Details" onClick={() => setOpen('details')} />

            {resource &&
              [
                'deployments.apps',
                'statefulsets.apps',
                'replicasets.apps',
              ].includes(resource) && (
                <Menu.Item label="Scale" onClick={() => setOpen('scale')} />
              )}
            {resource &&
              [
                'daemonsets.apps',
                'deployments.apps',
                'statefulsets.apps',
              ].includes(resource) && (
                <Menu.Item label="Restart" onClick={() => setOpen('restart')} />
              )}
            {resource && ['cronjobs.batch'].includes(resource) && (
              <Menu.Item
                label="Create job"
                onClick={() => setOpen('createjob')}
              />
            )}
            {resource &&
              [
                'daemonsets.apps',
                'deployments.apps',
                'jobs.batch',
                'pods',
                'statefulsets.apps',
              ].includes(resource) && (
                <Menu.Item
                  label="Logs"
                  target="_blank"
                  url={`/explore?left=${encodeURIComponent(JSON.stringify({ datasource: datasource, queries: [{ queryType: 'kubernetes-logs', namespace: namespace, resource: resource, refId: 'A', name: name, container: '' }] }))}`}
                />
              )}
            {isAIEnabled && (
              <Menu.Item label="AI" onClick={() => setOpen('ai')} />
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
          settings={props.settings}
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

      {open === 'ai' && (
        <AIAction
          datasource={datasource}
          resource={resource}
          namespace={namespace}
          name={name}
          onClose={() => setOpen('')}
        />
      )}

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
