import React from 'react';
import { ScrollContainer } from '@grafana/ui';

import { DefinitionLists } from '../shared/definitionlist/DefinitionList';
import { KubernetesManifest } from '../../types/kubernetes';
import { Conditions } from '../shared/details/Conditions';
import { Metadata } from '../shared/details/Metadata';
import { Certificate } from './overview/Certificate';
import { CertificateRequest } from './overview/CertificateRequest';
import { Order } from './overview/Order';
import { Challenge } from './overview/Challenge';

interface Props {
  datasource?: string;
  resourceId?: string;
  namespace?: string;
  name?: string;
  manifest: KubernetesManifest | undefined;
}

export function Overview({
  datasource,
  resourceId,
  namespace,
  name,
  manifest,
}: Props) {
  return (
    <ScrollContainer height="100%">
      <DefinitionLists>
        <Metadata
          datasource={datasource}
          namespace={namespace}
          name={name}
          manifest={manifest}
        />

        {manifest &&
          manifest.status &&
          manifest.status.conditions &&
          Array.isArray(manifest.status.conditions) ? (
          <Conditions conditions={manifest.status.conditions} />
        ) : null}

        {manifest && resourceId === 'certificate.cert-manager.io' && (
          <Certificate manifest={manifest} />
        )}
        {manifest && resourceId === 'certificaterequest.cert-manager.io' && (
          <CertificateRequest manifest={manifest} />
        )}
        {manifest && resourceId === 'order.acme.cert-manager.io' && (
          <Order manifest={manifest} />
        )}
        {manifest && resourceId === 'challenge.acme.cert-manager.io' && (
          <Challenge manifest={manifest} />
        )}
      </DefinitionLists>
    </ScrollContainer>
  );
}
