import React from 'react';
import { V1StatefulSet } from '@kubernetes/client-node';
import { Badge } from '@grafana/ui';

import {
  DefinitionList,
  DefinitionItem,
} from '../../shared/definitionlist/DefinitionList';
import { Selector } from '../../shared/details/Selector';

interface Props {
  datasource?: string;
  namespace?: string;
  manifest: V1StatefulSet;
}

export function StatefulSet({ datasource, namespace, manifest }: Props) {
  return (
    <DefinitionList title="Details">
      <DefinitionItem label="Replicas">
        <Badge
          color="darkgrey"
          text={`${manifest.status?.replicas ? manifest.status?.replicas : 0} desired`}
        />
        <Badge
          color="darkgrey"
          text={`${manifest.status?.currentReplicas ? manifest.status?.currentReplicas : 0} current`}
        />
        <Badge
          color="darkgrey"
          text={`${manifest.status?.readyReplicas ? manifest.status?.readyReplicas : 0} ready`}
        />
        <Badge
          color="darkgrey"
          text={`${manifest.status?.updatedReplicas ? manifest.status?.updatedReplicas : 0} updated`}
        />
      </DefinitionItem>
      {manifest.spec?.updateStrategy?.type && (
        <DefinitionItem label="Strategy">
          {manifest.spec.updateStrategy.type}
        </DefinitionItem>
      )}
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
