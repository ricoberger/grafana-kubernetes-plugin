import React, { useState } from 'react';
import { V1LabelSelector } from '@kubernetes/client-node';
import { Badge, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { DefinitionItem } from '../../shared/definitionlist/DefinitionList';
import { Resources } from './Resources';

interface Props {
  datasource?: string;
  namespace?: string;
  selector: V1LabelSelector;
}

export function Selector({ datasource, namespace, selector }: Props) {
  const styles = useStyles2(() => {
    return {
      badge: css({
        cursor: 'pointer',
      }),
    };
  });

  const [selectedSelector, setSelectedSelector] = useState<string>('');

  return (
    <>
      <DefinitionItem label="Selector">
        {selector.matchLabels &&
          Object.keys(selector.matchLabels).map((key) => (
            <Badge
              key={key}
              className={styles.badge}
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
