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

export function CertificateRequest({ datasource, namespace, manifest }: Props) {
  const styles = useStyles2(() => {
    return {
      badge: css({
        cursor: 'pointer',
      }),
    };
  });

  const [selectedIssuer, setSelectedIssuer] = useState<
    { kind: string; name: string } | undefined
  >(undefined);

  return (
    <>
      <DefinitionList title="Details">
        {manifest?.spec?.groups && (
          <DefinitionItem label="Groups">
            {manifest?.spec?.groups.map((group: string) => (
              <Badge key={group} color="darkgrey" text={group} />
            ))}
          </DefinitionItem>
        )}
        <DefinitionItem label="Username">
          {manifest.spec && manifest.spec.username
            ? manifest.spec.username
            : '-'}
        </DefinitionItem>
        <DefinitionItem label={manifest.spec?.issuerRef?.kind || 'Issuer'}>
          {manifest.spec?.issuerRef?.name ? (
            <Badge
              className={styles.badge}
              color="blue"
              onClick={() => setSelectedIssuer(manifest.spec.issuerRef)}
              text={manifest.spec.issuerRef.name}
            />
          ) : (
            '-'
          )}
        </DefinitionItem>

        {selectedIssuer && (
          <Resources
            title={selectedIssuer.kind}
            datasource={datasource}
            resourceId={
              selectedIssuer.kind === 'ClusterIssuer'
                ? 'clusterissuer.cert-manager.io'
                : 'issuer.cert-manager.io'
            }
            namespace={
              selectedIssuer.kind === 'ClusterIssuer' ? undefined : namespace
            }
            parameterName="fieldSelector"
            parameterValue={`metadata.name=${selectedIssuer.name}`}
            onClose={() => setSelectedIssuer(undefined)}
          />
        )}
      </DefinitionList>
    </>
  );
}
