import React from 'react';

import {
  DefinitionList,
  DefinitionItem,
} from '../../shared/definitionlist/DefinitionList';
import { KubernetesManifest } from '../../../types/kubernetes';

interface Props {
  datasource?: string;
  namespace?: string;
  manifest: KubernetesManifest;
}

export function OCIRepository({ manifest }: Props) {
  return (
    <>
      <DefinitionList title="Details">
        <DefinitionItem label="URL">{manifest.spec?.url || '-'}</DefinitionItem>
        <DefinitionItem label="Suspended">
          {manifest.spec && manifest.spec.suspend ? 'True' : 'False'}
        </DefinitionItem>
        <DefinitionItem label="Interval">
          {manifest.spec?.interval || '-'}
        </DefinitionItem>
        <DefinitionItem label="Reference">
          {manifest.spec?.ref?.tag
            ? `Tag: ${manifest.spec.ref.tag}`
            : manifest.spec?.ref?.semver
              ? `SemVer: ${manifest.spec.ref.semver}`
              : manifest.spec?.ref?.digest
                ? `Digest: ${manifest.spec.ref.digest}`
                : '-'}
        </DefinitionItem>
        <DefinitionItem label="Timeout">
          {manifest.spec?.timeout || '-'}
        </DefinitionItem>
        <DefinitionItem label="Ignore">
          {manifest.spec?.ignore || '-'}
        </DefinitionItem>
        <DefinitionItem label="Layer Selector">
          {manifest.spec?.layerSelector?.mediaType || '-'}
        </DefinitionItem>
        <DefinitionItem label="Insecure">
          {manifest.spec?.insecure ? 'True' : 'False'}
        </DefinitionItem>
        <DefinitionItem label="Provider">
          {manifest.spec?.provider || 'generic'}
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
      </DefinitionList>
    </>
  );
}
