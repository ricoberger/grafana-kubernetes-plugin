import React from 'react';

import {
  DefinitionList,
  DefinitionItem,
} from '../../shared/definitionlist/DefinitionList';
import { KubernetesManifest } from '../../../types/kubernetes';
import { formatTimeString } from '../../../../utils/utils.time';

interface Props {
  datasource?: string;
  namespace?: string;
  manifest: KubernetesManifest;
}

export function Bucket({ manifest }: Props) {
  return (
    <>
      <DefinitionList title="Details">
        <DefinitionItem label="Bucket Name">
          {manifest.spec?.bucketName || '-'}
        </DefinitionItem>
        <DefinitionItem label="Endpoint">
          {manifest.spec?.endpoint || '-'}
        </DefinitionItem>
        <DefinitionItem label="Provider">
          {manifest.spec?.provider || 'generic'}
        </DefinitionItem>
        <DefinitionItem label="Region">
          {manifest.spec?.region || '-'}
        </DefinitionItem>
        <DefinitionItem label="Insecure">
          {manifest.spec?.insecure ? 'True' : 'False'}
        </DefinitionItem>
        <DefinitionItem label="Suspended">
          {manifest.spec && manifest.spec.suspend ? 'True' : 'False'}
        </DefinitionItem>
        <DefinitionItem label="Interval">
          {manifest.spec?.interval || '-'}
        </DefinitionItem>
        <DefinitionItem label="Timeout">
          {manifest.spec?.timeout || '-'}
        </DefinitionItem>
        <DefinitionItem label="Ignore">
          {manifest.spec?.ignore || '-'}
        </DefinitionItem>
      </DefinitionList>

      <DefinitionList title="Status">
        <DefinitionItem label="Artifact Revision">
          {manifest.status?.artifact?.revision || '-'}
        </DefinitionItem>
        <DefinitionItem label="Artifact URL">
          {manifest.status?.artifact?.url || '-'}
        </DefinitionItem>
        <DefinitionItem label="Artifact Path">
          {manifest.status?.artifact?.path || '-'}
        </DefinitionItem>
        <DefinitionItem label="Artifact Digest">
          {manifest.status?.artifact?.digest || '-'}
        </DefinitionItem>
        <DefinitionItem label="Artifact Last Update Time">
          {manifest.status?.artifact?.lastUpdateTime
            ? formatTimeString(manifest.status?.artifact?.lastUpdateTime)
            : '-'}
        </DefinitionItem>
      </DefinitionList>
    </>
  );
}
