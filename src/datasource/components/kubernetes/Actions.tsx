import React, { useState } from 'react';
import { IconButton, Menu, WithContextMenu } from '@grafana/ui';
import { DataFrame } from '@grafana/data';

import { Query } from '../../types/query';
import { DataSourceOptions } from '../../types/settings';
import { Delete } from './Delete';
import { Scale } from './Scale';
import { Restart } from './Restart';
import { CreateJob } from './CreateJob';
import { Edit } from './Edit';
import { Details } from './Details';
import { CronJobSuspend } from './CronJobSuspend';
import { CronJobResume } from './CronJobResume';
import { CSRApprove } from './CSRApprove';
import { CSRDeny } from './CSRDeny';
import { EvictPod } from './EvictPod';
import { NodeUncordon } from './NodeUncordon';
import { NodeCordon } from './NodeCordon';

interface Props {
  query: Query;
  frame: DataFrame;
  rowIndex: number;
  settings: DataSourceOptions;
}

export function Actions({ query, frame, rowIndex, settings }: Props) {
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
                'deployment.apps',
                'statefulset.apps',
                'replicaset.apps',
              ].includes(resourceId) && (
                <Menu.Item label="Scale" onClick={() => setOpen('scale')} />
              )}
            {resourceId &&
              [
                'daemonset.apps',
                'deployment.apps',
                'statefulset.apps',
              ].includes(resourceId) && (
                <Menu.Item label="Restart" onClick={() => setOpen('restart')} />
              )}
            {resourceId && ['cronjob.batch'].includes(resourceId) && (
              <Menu.Item
                label="Create job"
                onClick={() => setOpen('createjob')}
              />
            )}
            {resourceId && ['cronjob.batch'].includes(resourceId) && (
              <Menu.Item
                label="Suspend"
                onClick={() => setOpen('cronjobsuspend')}
              />
            )}
            {resourceId && ['cronjob.batch'].includes(resourceId) && (
              <Menu.Item
                label="Resume"
                onClick={() => setOpen('cronjobresume')}
              />
            )}
            {resourceId &&
              ['certificatesigningrequest.certificates.k8s.io'].includes(
                resourceId,
              ) && (
                <Menu.Item
                  label="Approve"
                  onClick={() => setOpen('csrapprove')}
                />
              )}
            {resourceId &&
              ['certificatesigningrequest.certificates.k8s.io'].includes(
                resourceId,
              ) && (
                <Menu.Item label="Deny" onClick={() => setOpen('csrdeny')} />
              )}
            {resourceId && ['pod'].includes(resourceId) && (
              <Menu.Item label="Evict" onClick={() => setOpen('evict')} />
            )}
            {resourceId && ['node'].includes(resourceId) && (
              <Menu.Item label="Cordon" onClick={() => setOpen('cordon')} />
            )}
            {resourceId && ['node'].includes(resourceId) && (
              <Menu.Item label="Uncordon" onClick={() => setOpen('uncordon')} />
            )}
            {resourceId &&
              [
                'daemonset.apps',
                'deployment.apps',
                'job.batch',
                'pod',
                'statefulset.apps',
              ].includes(resourceId) && (
                <Menu.Item
                  label="Logs"
                  target="_blank"
                  url={`/explore?left=${encodeURIComponent(JSON.stringify({ datasource: datasource, queries: [{ queryType: 'kubernetes-logs', namespace: namespace, resourceId: resourceId, refId: 'A', name: name, container: '' }] }))}`}
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
        <Details
          settings={settings}
          datasource={datasource}
          resourceId={resourceId}
          namespace={namespace}
          name={name}
          onClose={() => setOpen('')}
        />
      )}

      <Scale
        datasource={datasource}
        resourceId={resourceId}
        namespace={namespace}
        name={name}
        isOpen={open === 'scale'}
        onClose={() => setOpen('')}
      />

      <Restart
        datasource={datasource}
        resourceId={resourceId}
        namespace={namespace}
        name={name}
        isOpen={open === 'restart'}
        onClose={() => setOpen('')}
      />

      <CreateJob
        datasource={datasource}
        resourceId={resourceId}
        namespace={namespace}
        name={name}
        isOpen={open === 'createjob'}
        onClose={() => setOpen('')}
      />

      <CronJobSuspend
        datasource={datasource}
        resourceId={resourceId}
        namespace={namespace}
        name={name}
        isOpen={open === 'cronjobsuspend'}
        onClose={() => setOpen('')}
      />

      <CronJobResume
        datasource={datasource}
        resourceId={resourceId}
        namespace={namespace}
        name={name}
        isOpen={open === 'cronjobresume'}
        onClose={() => setOpen('')}
      />

      <CSRApprove
        datasource={datasource}
        resourceId={resourceId}
        name={name}
        isOpen={open === 'csrapprove'}
        onClose={() => setOpen('')}
      />

      <CSRDeny
        datasource={datasource}
        resourceId={resourceId}
        name={name}
        isOpen={open === 'csrdeny'}
        onClose={() => setOpen('')}
      />

      <EvictPod
        datasource={datasource}
        resourceId={resourceId}
        namespace={namespace}
        name={name}
        isOpen={open === 'evict'}
        onClose={() => setOpen('')}
      />

      <NodeCordon
        datasource={datasource}
        resourceId={resourceId}
        name={name}
        isOpen={open === 'cordon'}
        onClose={() => setOpen('')}
      />

      <NodeUncordon
        datasource={datasource}
        resourceId={resourceId}
        name={name}
        isOpen={open === 'uncordon'}
        onClose={() => setOpen('')}
      />

      {open === 'edit' && (
        <Edit
          datasource={datasource}
          resourceId={resourceId}
          namespace={namespace}
          name={name}
          onClose={() => setOpen('')}
        />
      )}

      <Delete
        datasource={datasource}
        resourceId={resourceId}
        namespace={namespace}
        name={name}
        isOpen={open === 'delete'}
        onClose={() => setOpen('')}
      />
    </>
  );
}
