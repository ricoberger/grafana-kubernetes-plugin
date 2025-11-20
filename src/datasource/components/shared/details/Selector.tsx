import React from 'react';
import { V1LabelSelector } from '@kubernetes/client-node';
import { Badge, TextLink } from '@grafana/ui';

import { DefinitionItem } from '../../shared/definitionlist/DefinitionList';

interface Props {
  datasource?: string;
  namespace?: string;
  selector: V1LabelSelector;
}

export function Selector({ datasource, namespace, selector }: Props) {
  return (
    <DefinitionItem label="Selector">
      {selector.matchLabels &&
        Object.keys(selector.matchLabels).map((key) => (
          <Badge
            key={key}
            color="darkgrey"
            text={
              <TextLink
                href={`/explore?left=${encodeURIComponent(JSON.stringify({ datasource: datasource, queries: [{ queryType: 'kubernetes-resources', namespace: namespace, resourceId: 'pod', parameterName: 'labelSelector', parameterValue: `${key}=${selector.matchLabels ? selector.matchLabels[key] : ''}`, wide: false, refId: 'A' }] }))}`}
                color="secondary"
                variant="bodySmall"
              >
                {key}={selector.matchLabels ? selector.matchLabels[key] : ''}
              </TextLink>
            }
          />
        ))}
    </DefinitionItem>
  );
}
