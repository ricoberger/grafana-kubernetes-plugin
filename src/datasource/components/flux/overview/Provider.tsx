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
