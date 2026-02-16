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

export function Provider({ manifest }: Props) {
  return (
    <>
      <DefinitionList title="Details">
        <DefinitionItem label="Type">
          {manifest.spec?.type || '-'}
        </DefinitionItem>
        <DefinitionItem label="Channel">
          {manifest.spec?.channel || '-'}
        </DefinitionItem>
        <DefinitionItem label="Username">
          {manifest.spec?.username || '-'}
        </DefinitionItem>
        <DefinitionItem label="Address">
          {manifest.spec?.address || '-'}
        </DefinitionItem>
        <DefinitionItem label="Timeout">
          {manifest.spec?.timeout || '-'}
        </DefinitionItem>
        <DefinitionItem label="Proxy">
          {manifest.spec?.proxy || '-'}
        </DefinitionItem>
        <DefinitionItem label="Suspended">
          {manifest.spec?.suspend ? 'True' : 'False'}
        </DefinitionItem>
      </DefinitionList>
    </>
  );
}
