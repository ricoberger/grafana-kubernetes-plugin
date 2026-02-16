import React, { useState } from 'react';
import { Badge, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import {
  DefinitionList,
  DefinitionItem,
} from '../../shared/definitionlist/DefinitionList';
import { Resources } from '../../shared/details/Resources';
import { KubernetesManifest } from '../../../types/kubernetes';

interface Props {
  datasource?: string;
  namespace?: string;
  manifest: KubernetesManifest;
}

export function Alert({ datasource, namespace, manifest }: Props) {
  const styles = useStyles2(() => {
    return {
      badge: css({
        cursor: 'pointer',
      }),
    };
  });

  const [selectedProvider, setSelectedProvider] = useState<
    { name: string } | undefined
  >(undefined);

  return (
    <>
      <DefinitionList title="Details">
        <DefinitionItem label="Provider">
          {manifest.spec?.providerRef?.name ? (
            <Badge
              className={styles.badge}
              color="blue"
              onClick={() =>
                setSelectedProvider({ name: manifest.spec.providerRef.name })
              }
              text={manifest.spec.providerRef.name}
            />
          ) : (
            '-'
          )}
        </DefinitionItem>
        <DefinitionItem label="Event Severity">
          {manifest.spec?.eventSeverity || 'info'}
        </DefinitionItem>
        <DefinitionItem label="Event Sources">
          {manifest.spec?.eventSources
            ? manifest.spec.eventSources
              .map(
                (source: {
                  kind: string;
                  name?: string;
                  namespace?: string;
                }) =>
                  `${source.kind}${source.name ? `/${source.name}` : ''}${source.namespace ? ` (${source.namespace})` : ''}`,
              )
              .join(', ')
            : '-'}
        </DefinitionItem>
        <DefinitionItem label="Exclusion List">
          {manifest.spec?.exclusionList?.join(', ') || '-'}
        </DefinitionItem>
        <DefinitionItem label="Summary">
          {manifest.spec?.summary || '-'}
        </DefinitionItem>
        <DefinitionItem label="Suspended">
          {manifest.spec?.suspend ? 'True' : 'False'}
        </DefinitionItem>

        {selectedProvider && (
          <Resources
            title="Provider"
            datasource={datasource}
            resourceId="provider.notification.toolkit.fluxcd.io"
            namespace={namespace}
            parameterName="fieldSelector"
            parameterValue={`metadata.name=${selectedProvider.name}`}
            onClose={() => setSelectedProvider(undefined)}
          />
        )}
      </DefinitionList>
    </>
  );
}
