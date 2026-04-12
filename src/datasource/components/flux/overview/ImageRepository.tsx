import React from 'react';

import { KubernetesManifest } from '../../../types/kubernetes';
import {
  DefinitionItem,
  DefinitionList,
} from '../../shared/definitionlist/DefinitionList';

interface Props {
  datasource?: string;
  namespace?: string;
  manifest: KubernetesManifest;
}

export function ImageRepository({ manifest }: Props) {
  return (
    <>
      <DefinitionList title="Details">
        <DefinitionItem label="Image">
          {manifest.spec?.image || '-'}
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
        <DefinitionItem label="Service Account">
          {manifest.spec?.serviceAccountName || '-'}
        </DefinitionItem>
        <DefinitionItem label="Exclusion List">
          {manifest.spec?.exclusionList?.join(', ') || '-'}
        </DefinitionItem>
      </DefinitionList>

      <DefinitionList title="Status">
        <DefinitionItem label="Canonical Image Name">
          {manifest.status?.canonicalImageName || '-'}
        </DefinitionItem>
        <DefinitionItem label="Last Scan Result">
          {manifest.status?.lastScanResult?.tagCount
            ? `${manifest.status.lastScanResult.tagCount} tags`
            : '-'}
        </DefinitionItem>
      </DefinitionList>
    </>
  );
}
