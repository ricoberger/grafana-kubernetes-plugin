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

export function GitRepository({ manifest }: Props) {
  return (
    <>
      <DefinitionList title="Details">
        <DefinitionItem label="URL">{manifest.spec?.url || '-'}</DefinitionItem>
        <DefinitionItem label="Reference">
          {manifest.spec?.ref?.branch
            ? `Branch: ${manifest.spec.ref.branch}`
            : manifest.spec?.ref?.tag
              ? `Tag: ${manifest.spec.ref.tag}`
              : manifest.spec?.ref?.semver
                ? `SemVer: ${manifest.spec.ref.semver}`
                : manifest.spec?.ref?.commit
                  ? `Commit: ${manifest.spec.ref.commit}`
                  : '-'}
          <DefinitionItem label="Recurse Submodules">
            {manifest.spec?.recurseSubmodules ? 'True' : 'False'}
          </DefinitionItem>
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
        <DefinitionItem label="Artifact Digest">
          {manifest.status?.artifact?.digest || '-'}
        </DefinitionItem>
        <DefinitionItem label="Content Config Layer Digest">
          {manifest.status?.contentConfigChecksum || '-'}
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
