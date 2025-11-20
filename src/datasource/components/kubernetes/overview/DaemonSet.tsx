import React from 'react';
import { V1DaemonSet } from '@kubernetes/client-node';
import { Badge } from '@grafana/ui';

import {
  DefinitionList,
  DefinitionItem,
} from '../../shared/definitionlist/DefinitionList';
import { Selector } from '../../shared/details/Selector';

interface Props {
  datasource?: string;
  namespace?: string;
  manifest: V1DaemonSet;
}

export function DaemonSet({ datasource, namespace, manifest }: Props) {
  return (
    <DefinitionList title="Details">
      <DefinitionItem label="Replicas">
        <Badge
          color="darkgrey"
          text={`${manifest.status?.desiredNumberScheduled ? manifest.status?.desiredNumberScheduled : 0} desired`}
        />
        <Badge
          color="darkgrey"
          text={`${manifest.status?.currentNumberScheduled ? manifest.status?.currentNumberScheduled : 0} current`}
        />
        <Badge
          color="darkgrey"
          text={`${manifest.status?.numberMisscheduled ? manifest.status?.numberMisscheduled : 0} misscheduled`}
        />
        <Badge
          color="darkgrey"
          text={`${manifest.status?.numberReady ? manifest.status?.numberReady : 0} ready`}
        />
        <Badge
          color="darkgrey"
          text={`${manifest.status?.updatedNumberScheduled ? manifest.status?.updatedNumberScheduled : 0} updated`}
        />
        <Badge
          color="darkgrey"
          text={`${manifest.status?.numberAvailable ? manifest.status?.numberAvailable : 0} available`}
        />
        <Badge
          color="darkgrey"
          text={`${manifest.status?.numberUnavailable ? manifest.status?.numberUnavailable : 0} unavailable`}
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
