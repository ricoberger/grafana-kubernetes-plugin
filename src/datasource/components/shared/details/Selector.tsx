import React, { useState } from 'react';
import { V1LabelSelector } from '@kubernetes/client-node';
import { Badge } from '@grafana/ui';

import { DefinitionItem } from '../../shared/definitionlist/DefinitionList';
import { Resources } from './Resources';

interface Props {
  datasource?: string;
  namespace?: string;
  selector: V1LabelSelector;
}

export function Selector({ datasource, namespace, selector }: Props) {
  const [selectedSelector, setSelectedSelector] = useState<string>('');

  return (
    <>
      <DefinitionItem label="Selector">
        {selector.matchLabels &&
          Object.keys(selector.matchLabels).map((key) => (
            <Badge
              key={key}
              color="blue"
              onClick={() =>
                setSelectedSelector(
                  `${key}=${selector.matchLabels ? selector.matchLabels[key] : ''}`,
                )
              }
              text={`${key}=${selector.matchLabels ? selector.matchLabels[key] : ''}`}
            />
          ))}

        {selectedSelector && (
          <Resources
            title="Pods"
            datasource={datasource}
            resourceId="pod"
            namespace={namespace}
            parameterName="labelSelector"
            parameterValue={selectedSelector}
            onClose={() => setSelectedSelector('')}
          />
        )}
      </DefinitionItem>
    </>
  );
}
