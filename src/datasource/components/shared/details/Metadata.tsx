import React from 'react';
import { Badge, TextLink } from '@grafana/ui';

import {
  DefinitionItem,
  DefinitionList,
} from '../definitionlist/DefinitionList';
import { formatTimeString, timeDifference } from '../../../../utils/utils.time';
import { KubernetesManifest } from '../../../types/kubernetes';
import { getResourceId } from 'utils/utils.resource';

interface Props {
  datasource?: string;
  namespace?: string;
  name?: string;
  manifest: KubernetesManifest | undefined;
}

export function Metadata({ datasource, namespace, name, manifest }: Props) {
  return (
    <DefinitionList title="Metadata">
      {name && <DefinitionItem label="Name">{name}</DefinitionItem>}
      {namespace && (
        <DefinitionItem label="Namespace">{namespace}</DefinitionItem>
      )}
      {manifest?.metadata?.labels && (
        <DefinitionItem label="Labels">
          {Object.keys(manifest?.metadata?.labels).map((key) => (
            <Badge
              key={key}
              color="darkgrey"
              text={`${key}: ${manifest?.metadata?.labels![key]}`}
            />
          ))}
        </DefinitionItem>
      )}
      {manifest?.metadata?.annotations && (
        <DefinitionItem label="Annotations">
          {Object.keys(manifest?.metadata?.annotations).map((key) => (
            <Badge
              key={key}
              color="darkgrey"
              text={`${key}: ${manifest?.metadata?.annotations![key]}`}
            />
          ))}
        </DefinitionItem>
      )}
      {manifest?.metadata?.creationTimestamp && (
        <DefinitionItem label="Age">
          {timeDifference(
            new Date().getTime(),
            new Date(manifest.metadata.creationTimestamp.toString()).getTime(),
          )}{' '}
          ({formatTimeString(manifest.metadata.creationTimestamp.toString())})
        </DefinitionItem>
      )}
      {manifest?.metadata?.ownerReferences && (
        <DefinitionItem label="Owners">
          {manifest.metadata.ownerReferences.map((owner, index) => (
            <Badge
              key={index}
              color="darkgrey"
              text={
                <TextLink
                  href={`/explore?left=${encodeURIComponent(JSON.stringify({ datasource: datasource, queries: [{ queryType: 'kubernetes-resources', namespace: namespace, resourceId: getResourceId(owner.kind, owner.apiVersion), parameterName: 'fieldSelector', parameterValue: `metadata.name=${owner.name}`, wide: false, refId: 'A' }] }))}`}
                  color="secondary"
                  variant="bodySmall"
                >
                  {owner.kind}: {owner.name}
                </TextLink>
              }
            />
          ))}
        </DefinitionItem>
      )}
    </DefinitionList>
  );
}
