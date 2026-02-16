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
import { formatTimeString } from '../../../../utils/utils.time';

interface Props {
  datasource?: string;
  namespace?: string;
  manifest: KubernetesManifest;
}

export function HelmChart({ datasource, namespace, manifest }: Props) {
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
        <DefinitionItem label="Chart">
          {manifest.spec?.chart || '-'}
        </DefinitionItem>
        <DefinitionItem label="Version">
          {manifest.spec?.version || '-'}
        </DefinitionItem>
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
        <DefinitionItem label="Suspended">
          {manifest.spec && manifest.spec.suspend ? 'True' : 'False'}
        </DefinitionItem>
        <DefinitionItem label="Interval">
          {manifest.spec?.interval || '-'}
        </DefinitionItem>
        <DefinitionItem label="Reconcile Strategy">
          {manifest.spec?.reconcileStrategy || 'ChartVersion'}
        </DefinitionItem>
        <DefinitionItem label="Values Files">
          {manifest.spec?.valuesFiles?.join(', ') || '-'}
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
        <DefinitionItem label="Artifact Revision">
          {manifest.status?.artifact?.revision || '-'}
        </DefinitionItem>
        <DefinitionItem label="Artifact URL">
          {manifest.status?.artifact?.url || '-'}
        </DefinitionItem>
        <DefinitionItem label="Artifact Digest">
          {manifest.status?.artifact?.digest || '-'}
        </DefinitionItem>
        <DefinitionItem label="Artifact Last Update Time">
          {manifest.status?.artifact?.lastUpdateTime
            ? formatTimeString(manifest.status?.artifact?.lastUpdateTime)
            : '-'}
        </DefinitionItem>
      </DefinitionList>
    </>
  );
}
