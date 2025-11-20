import React, { useState } from 'react';
import { Badge } from '@grafana/ui';
import { V1OwnerReference } from '@kubernetes/client-node';

import {
  DefinitionItem,
  DefinitionList,
} from '../definitionlist/DefinitionList';
import { formatTimeString, timeDifference } from '../../../../utils/utils.time';
import { KubernetesManifest } from '../../../types/kubernetes';
import { getResourceId } from '../../../../utils/utils.resource';
import { Resources } from './Resources';

interface Props {
  datasource?: string;
  namespace?: string;
  name?: string;
  manifest: KubernetesManifest | undefined;
}

export function Metadata({ datasource, namespace, name, manifest }: Props) {
  const [selectedOwner, setSelectedOwner] = useState<
    V1OwnerReference | undefined
  >(undefined);

  return (
    <>
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
              new Date(
                manifest.metadata.creationTimestamp.toString(),
              ).getTime(),
            )}{' '}
            ({formatTimeString(manifest.metadata.creationTimestamp.toString())})
          </DefinitionItem>
        )}
        {manifest?.metadata?.ownerReferences && (
          <DefinitionItem label="Owners">
            {manifest.metadata.ownerReferences.map((owner, index) => (
              <Badge
                key={index}
                color="blue"
                onClick={() => setSelectedOwner(owner)}
                text={`${owner.kind}: ${owner.name}`}
              />
            ))}
          </DefinitionItem>
        )}
      </DefinitionList>

      {selectedOwner && (
        <Resources
          title={selectedOwner.kind}
          datasource={datasource}
          resourceId={getResourceId(
            selectedOwner.kind,
            selectedOwner.apiVersion,
          )}
          namespace={namespace}
          parameterName="fieldSelector"
          parameterValue={`metadata.name=${selectedOwner.name}`}
          onClose={() => setSelectedOwner(undefined)}
        />
      )}
    </>
  );
}
