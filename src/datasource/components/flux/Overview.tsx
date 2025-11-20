import React from 'react';

import { DefinitionLists } from '../shared/definitionlist/DefinitionList';
import { KubernetesManifest } from '../../types/kubernetes';
import { Conditions } from '../shared/details/Conditions';
import { Metadata } from '../shared/details/Metadata';
import { ScrollContainer } from '@grafana/ui';

interface Props {
  datasource?: string;
  namespace?: string;
  name?: string;
  manifest: KubernetesManifest | undefined;
}

export function Overview({ datasource, namespace, name, manifest }: Props) {
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
      </DefinitionLists>
    </ScrollContainer>
  );
}
