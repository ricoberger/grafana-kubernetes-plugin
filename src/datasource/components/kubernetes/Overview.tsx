import React from 'react';
import {
  V1CronJob,
  V1DaemonSet,
  V1Deployment,
  V1Job,
  V1Pod,
  V1StatefulSet,
} from '@kubernetes/client-node';

import { DefinitionLists } from '../shared/definitionlist/DefinitionList';
import { KubernetesManifest } from '../../types/kubernetes';
import { Metadata } from '../shared/details/Metadata';
import { Conditions } from '../shared/details/Conditions';
import { CronJob } from './overview/CronJob';
import { DaemonSet } from './overview/DaemonSet';
import { StatefulSet } from './overview/StatefulSet';
import { Pod } from './overview/Pod';
import { Job } from './overview/Job';
import { Deployment } from './overview/Deployment';
import { ScrollContainer } from '@grafana/ui';

interface Props {
  datasource?: string;
  resourceId?: string;
  namespace?: string;
  name?: string;
  manifest?: KubernetesManifest;
}

export function Overview({
  datasource,
  resourceId,
  namespace,
  name,
  manifest,
}: Props) {
  return (
    <ScrollContainer height="100%">
      <DefinitionLists>
        <Metadata
          datasource={datasource}
          namespace={namespace}
          name={name}
          manifest={manifest}
        />

        {manifest &&
          manifest.status &&
          manifest.status.conditions &&
          Array.isArray(manifest.status.conditions) ? (
          <Conditions conditions={manifest.status.conditions} />
        ) : null}

        {manifest && resourceId === 'cronjob.batch' && (
          <CronJob manifest={manifest as V1CronJob} />
        )}
        {manifest && resourceId === 'daemonset.apps' && (
          <DaemonSet
            datasource={datasource}
            namespace={namespace}
            manifest={manifest as V1DaemonSet}
          />
        )}
        {manifest && resourceId === 'deployment.apps' && (
          <Deployment
            datasource={datasource}
            namespace={namespace}
            manifest={manifest as V1Deployment}
          />
        )}
        {manifest && resourceId === 'job.batch' && (
          <Job
            datasource={datasource}
            namespace={namespace}
            manifest={manifest as V1Job}
          />
        )}
        {manifest && resourceId === 'pod' && (
          <Pod manifest={manifest as V1Pod} />
        )}
        {manifest && resourceId === 'statefulset.apps' && (
          <StatefulSet
            datasource={datasource}
            namespace={namespace}
            manifest={manifest as V1StatefulSet}
          />
        )}
      </DefinitionLists>
    </ScrollContainer>
  );
}
