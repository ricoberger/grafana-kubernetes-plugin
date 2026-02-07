import React, { useState } from 'react';
import { Badge, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import {
  DefinitionList,
  DefinitionItem,
} from '../../shared/definitionlist/DefinitionList';
import { Resources } from '../../shared/details/Resources';
import { KubernetesManifest } from '../../../types/kubernetes';
import { formatTimeString } from '../../../../utils/utils.time';

interface Props {
  datasource?: string;
  namespace?: string;
  manifest: KubernetesManifest;
}

export function Certificate({ datasource, namespace, manifest }: Props) {
  const styles = useStyles2(() => {
    return {
      badge: css({
        cursor: 'pointer',
      }),
    };
  });

  const [selectedSecret, setSelectedSecret] = useState<string>('');
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
        <DefinitionItem label="Private Key Rotation Policy">
          {manifest.spec && manifest.spec.privateKey?.rotationPolicy
            ? manifest.spec.privateKey.rotationPolicy
            : '-'}
        </DefinitionItem>
        <DefinitionItem label="Private Key Size">
          {manifest.spec && manifest.spec.privateKey?.size
            ? manifest.spec.privateKey.size
            : '-'}
        </DefinitionItem>
        <DefinitionItem label="Secret">
          {manifest.spec?.secretName ? (
            <Badge
              className={styles.badge}
              color="blue"
              onClick={() => setSelectedSecret(manifest.spec!.secretName!)}
              text={manifest.spec.secretName}
            />
          ) : (
            '-'
          )}
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

        {selectedSecret && (
          <Resources
            title="Secret"
            datasource={datasource}
            resourceId="secret"
            namespace={namespace}
            parameterName="fieldSelector"
            parameterValue={`metadata.name=${selectedSecret}`}
            onClose={() => setSelectedSecret('')}
          />
        )}

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
        <DefinitionItem label="Renewal Time">
          {manifest.status && manifest.status?.renewalTime
            ? formatTimeString(manifest.status.renewalTime)
            : '-'}
        </DefinitionItem>
        <DefinitionItem label="Not Before">
          {manifest.status && manifest.status?.notBefore
            ? formatTimeString(manifest.status.notBefore)
            : '-'}
        </DefinitionItem>
        <DefinitionItem label="Not After">
          {manifest.status && manifest.status?.notAfter
            ? formatTimeString(manifest.status.notAfter)
            : '-'}
        </DefinitionItem>
      </DefinitionList>
    </>
  );
}
