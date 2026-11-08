import { css } from '@emotion/css';
import { Badge, useStyles2 } from '@grafana/ui';
import { CoreV1Event, V1ObjectReference } from '@kubernetes/client-node';
import React, { useState } from 'react';

import { getResourceId } from '../../../../utils/utils.resource';
import { formatTimeString } from '../../../../utils/utils.time';
import {
  DefinitionItem,
  DefinitionList,
} from '../../shared/definitionlist/DefinitionList';
import { Resources } from '../../shared/details/Resources';

interface Props {
  datasource?: string;
  namespace?: string;
  manifest: CoreV1Event;
}

export function Event({ datasource, manifest }: Props) {
  const styles = useStyles2(() => {
    return {
      badge: css({
        cursor: 'pointer',
      }),
    };
  });

  const [selectedInvolvedObject, setSelectedInvolvedObject] = useState<
    V1ObjectReference | undefined
  >(undefined);

  console.log(selectedInvolvedObject);
  console.log(
    getResourceId(
      selectedInvolvedObject?.kind || '',
      selectedInvolvedObject?.apiVersion || '',
    ),
  );

  return (
    <>
      <DefinitionList title="Details">
        <DefinitionItem label="First Seen">
          {manifest.firstTimestamp
            ? formatTimeString(manifest.firstTimestamp as any as string)
            : '-'}
        </DefinitionItem>
        <DefinitionItem label="Last Seen">
          {manifest.lastTimestamp
            ? formatTimeString(manifest.lastTimestamp as any as string)
            : '-'}
        </DefinitionItem>
        <DefinitionItem label="Count">{manifest.count}</DefinitionItem>
        <DefinitionItem label="Type">{manifest.type}</DefinitionItem>
        <DefinitionItem label="Reason">{manifest.reason}</DefinitionItem>
        <DefinitionItem label="Message">{manifest.message}</DefinitionItem>
        <DefinitionItem label="Source">
          {manifest.source && manifest.source.component
            ? manifest.source.component
            : '-'}
        </DefinitionItem>
        <DefinitionItem label="Involved Object">
          {manifest.involvedObject ? (
            <Badge
              className={styles.badge}
              color="blue"
              onClick={() => setSelectedInvolvedObject(manifest.involvedObject)}
              text={`${manifest.involvedObject.kind}: ${manifest.involvedObject.name}`}
            />
          ) : (
            '-'
          )}
        </DefinitionItem>

        {selectedInvolvedObject && (
          <Resources
            title={selectedInvolvedObject.kind || ''}
            datasource={datasource}
            resourceId={getResourceId(
              selectedInvolvedObject.kind || '',
              selectedInvolvedObject.apiVersion || '',
            )}
            namespace={selectedInvolvedObject.namespace}
            parameterName="fieldSelector"
            parameterValue={`metadata.name=${selectedInvolvedObject.name}`}
            onClose={() => setSelectedInvolvedObject(undefined)}
          />
        )}
      </DefinitionList>
    </>
  );
}
