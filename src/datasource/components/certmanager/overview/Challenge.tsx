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

export function Challenge({ datasource, namespace, manifest }: Props) {
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
        {manifest?.spec?.dnsNames && (
          <DefinitionItem label="DNS Names">
            {manifest?.spec?.dnsNames.map((dnsName: string) => (
              <Badge key={dnsName} color="darkgrey" text={dnsName} />
            ))}
          </DefinitionItem>
        )}
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

      <DefinitionList title="Status">
        <DefinitionItem label="State">
          {manifest.status && manifest.status?.state
            ? manifest.status.state
            : '-'}
        </DefinitionItem>
      </DefinitionList>
    </>
  );
}
