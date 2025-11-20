import React from 'react';
import { V1Job } from '@kubernetes/client-node';
import { Badge } from '@grafana/ui';

import {
  DefinitionList,
  DefinitionItem,
} from '../../shared/definitionlist/DefinitionList';
import { Selector } from '../../shared/details/Selector';

interface Props {
  datasource?: string;
  namespace?: string;
  manifest: V1Job;
}

export function Job({ datasource, namespace, manifest }: Props) {
  return (
    <DefinitionList title="Details">
      <DefinitionItem label="Completions">
        {manifest.spec?.completions ? manifest.spec?.completions : 0}
      </DefinitionItem>
      <DefinitionItem label="Backoff Limit">
        {manifest.spec?.backoffLimit ? manifest.spec?.backoffLimit : 0}
      </DefinitionItem>
      <DefinitionItem label="Active">
        {manifest.status?.active ? 'True' : 'False'}
      </DefinitionItem>
      <DefinitionItem label="Status">
        <Badge
          color="darkgrey"
          text={`succeeded=${manifest.status?.succeeded ? manifest.status?.succeeded : 0}`}
        />
        <Badge
          color="darkgrey"
          text={`failed=${manifest.status?.failed ? manifest.status?.failed : 0}`}
        />
      </DefinitionItem>
      {datasource && namespace && manifest.spec?.selector && (
        <Selector
          datasource={datasource}
          namespace={namespace}
          selector={manifest.spec.selector}
        />
      )}
    </DefinitionList>
  );
}
