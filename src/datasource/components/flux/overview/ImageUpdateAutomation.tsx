import React, { useState } from 'react';
import { Badge, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import {
  DefinitionList,
  DefinitionItem,
} from '../../shared/definitionlist/DefinitionList';
import { Resources } from '../../shared/details/Resources';
import { KubernetesManifest } from '../../../types/kubernetes';
import { fluxKindToResourceId } from '../utils';

interface Props {
  datasource?: string;
  namespace?: string;
  manifest: KubernetesManifest;
}

export function ImageUpdateAutomation({
  datasource,
  namespace,
  manifest,
}: Props) {
  const styles = useStyles2(() => {
    return {
      badge: css({
        cursor: 'pointer',
      }),
    };
  });

  const [selectedSource, setSelectedSource] = useState<
    { kind: string; name: string } | undefined
  >(undefined);

  return (
    <>
      <DefinitionList title="Details">
        <DefinitionItem label="Source">
          {manifest.spec?.sourceRef?.name ? (
            <Badge
              className={styles.badge}
              color="blue"
              onClick={() => setSelectedSource(manifest.spec.sourceRef)}
              text={`${manifest.spec.sourceRef.name} (${manifest.spec.sourceRef.kind})`}
            />
          ) : (
            '-'
          )}
        </DefinitionItem>
        <DefinitionItem label="Git">
          {manifest.spec?.git
            ? `Checkout Branch: ${manifest.spec.git.checkout?.ref?.branch || '-'}, Push Branch: ${manifest.spec.git.push?.branch || '-'}`
            : '-'}
        </DefinitionItem>
        <DefinitionItem label="Suspended">
          {manifest.spec && manifest.spec.suspend ? 'True' : 'False'}
        </DefinitionItem>
        <DefinitionItem label="Interval">
          {manifest.spec?.interval || '-'}
        </DefinitionItem>
        <DefinitionItem label="Update Strategy">
          {manifest.spec?.update?.strategy || 'Setters'}
        </DefinitionItem>
        <DefinitionItem label="Update Path">
          {manifest.spec?.update?.path || '-'}
        </DefinitionItem>

        {selectedSource && (
          <Resources
            title={selectedSource.kind}
            datasource={datasource}
            resourceId={fluxKindToResourceId[selectedSource.kind]}
            namespace={namespace}
            parameterName="fieldSelector"
            parameterValue={`metadata.name=${selectedSource.name}`}
            onClose={() => setSelectedSource(undefined)}
          />
        )}
      </DefinitionList>

      <DefinitionList title="Status">
        <DefinitionItem label="Last Automation Run Time">
          {manifest.status?.lastAutomationRunTime || '-'}
        </DefinitionItem>
        <DefinitionItem label="Last Push Commit">
          {manifest.status?.lastPushCommit || '-'}
        </DefinitionItem>
        <DefinitionItem label="Last Push Time">
          {manifest.status?.lastPushTime || '-'}
        </DefinitionItem>
      </DefinitionList>
    </>
  );
}
