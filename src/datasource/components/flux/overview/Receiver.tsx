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

export function Receiver({ manifest }: Props) {
  return (
    <>
      <DefinitionList title="Details">
        <DefinitionItem label="Type">
          {manifest.spec?.type || '-'}
        </DefinitionItem>
        <DefinitionItem label="Events">
          {manifest.spec?.events?.join(', ') || '-'}
        </DefinitionItem>
        <DefinitionItem label="Resources">
          {manifest.spec?.resources
            ? manifest.spec.resources
              .map(
                (resource: {
                  apiVersion?: string;
                  kind: string;
                  name?: string;
                  namespace?: string;
                }) =>
                  `${resource.kind}${resource.name ? `/${resource.name}` : ''}${resource.namespace ? ` (${resource.namespace})` : ''}`,
              )
              .join(', ')
            : '-'}
        </DefinitionItem>
        <DefinitionItem label="Interval">
          {manifest.spec?.interval || '-'}
        </DefinitionItem>
        <DefinitionItem label="Suspended">
          {manifest.spec?.suspend ? 'True' : 'False'}
        </DefinitionItem>
      </DefinitionList>

      <DefinitionList title="Status">
        <DefinitionItem label="Webhook Path">
          {manifest.status?.webhookPath || '-'}
        </DefinitionItem>
      </DefinitionList>
    </>
  );
}
