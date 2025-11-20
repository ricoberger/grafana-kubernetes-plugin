import React from 'react';

import { Release } from '../../types/helm';
import {
  DefinitionItem,
  DefinitionList,
  DefinitionLists,
} from '../shared/definitionlist/DefinitionList';
import { formatTimeString } from '../../../utils/utils.time';
import { ScrollContainer } from '@grafana/ui';

interface Props {
  release: Release | undefined;
}

export function Overview({ release }: Props) {
  return (
    <ScrollContainer height="100%">
      <DefinitionLists>
        <DefinitionList title="Details">
          <DefinitionItem label="Name">{release?.name || '-'}</DefinitionItem>
          <DefinitionItem label="Namespace">
            {release?.namespace || '-'}
          </DefinitionItem>
          <DefinitionItem label="Version">
            {release?.version || '-'}
          </DefinitionItem>
          <DefinitionItem label="Status">
            {release?.info?.status || '-'}
          </DefinitionItem>
          <DefinitionItem label="Description">
            {release?.info?.description || '-'}
          </DefinitionItem>
          <DefinitionItem label="First Deployed">
            {release?.info?.first_deployed
              ? formatTimeString(release?.info.first_deployed)
              : '-'}
          </DefinitionItem>
          <DefinitionItem label="Last Deployed">
            {release?.info?.last_deployed
              ? formatTimeString(release?.info.last_deployed)
              : '-'}
          </DefinitionItem>
          <DefinitionItem label="Notes">
            {release?.info?.notes || '-'}
          </DefinitionItem>
        </DefinitionList>
      </DefinitionLists>
    </ScrollContainer>
  );
}
