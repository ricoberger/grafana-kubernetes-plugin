import React from 'react';
import { ScrollContainer } from '@grafana/ui';

import { DefinitionLists } from '../shared/definitionlist/DefinitionList';
import { KubernetesManifest } from '../../types/kubernetes';
import { Conditions } from '../shared/details/Conditions';
import { Metadata } from '../shared/details/Metadata';
import { Kustomization } from './overview/Kustomization';
import { GitRepository } from './overview/GitRepository';
import { HelmRelease } from './overview/HelmRelease';
import { HelmRepository } from './overview/HelmRepository';
import { Bucket } from './overview/Bucket';
import { HelmChart } from './overview/HelmChart';
import { OCIRepository } from './overview/OCIRepository';
import { ImagePolicy } from './overview/ImagePolicy';
import { ImageRepository } from './overview/ImageRepository';
import { ImageUpdateAutomation } from './overview/ImageUpdateAutomation';
import { Alert } from './overview/Alert';
import { Provider } from './overview/Provider';
import { Receiver } from './overview/Receiver';

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

        {manifest &&
          resourceId === 'kustomization.kustomize.toolkit.fluxcd.io' && (
            <Kustomization
              datasource={datasource}
              namespace={namespace}
              manifest={manifest}
            />
          )}

        {manifest &&
          resourceId === 'gitrepository.source.toolkit.fluxcd.io' && (
            <GitRepository
              datasource={datasource}
              namespace={namespace}
              manifest={manifest}
            />
          )}

        {manifest && resourceId === 'helmrelease.helm.toolkit.fluxcd.io' && (
          <HelmRelease
            datasource={datasource}
            namespace={namespace}
            manifest={manifest}
          />
        )}

        {manifest &&
          resourceId === 'helmrepository.source.toolkit.fluxcd.io' && (
            <HelmRepository
              datasource={datasource}
              namespace={namespace}
              manifest={manifest}
            />
          )}

        {manifest && resourceId === 'bucket.source.toolkit.fluxcd.io' && (
          <Bucket
            datasource={datasource}
            namespace={namespace}
            manifest={manifest}
          />
        )}

        {manifest && resourceId === 'helmchart.source.toolkit.fluxcd.io' && (
          <HelmChart
            datasource={datasource}
            namespace={namespace}
            manifest={manifest}
          />
        )}

        {manifest &&
          resourceId === 'ocirepository.source.toolkit.fluxcd.io' && (
            <OCIRepository
              datasource={datasource}
              namespace={namespace}
              manifest={manifest}
            />
          )}

        {manifest && resourceId === 'imagepolicy.image.toolkit.fluxcd.io' && (
          <ImagePolicy
            datasource={datasource}
            namespace={namespace}
            manifest={manifest}
          />
        )}

        {manifest &&
          resourceId ===
          'imagerepository.imagerepositories.image.toolkit.fluxcd.io' && (
            <ImageRepository
              datasource={datasource}
              namespace={namespace}
              manifest={manifest}
            />
          )}

        {manifest &&
          resourceId === 'imageupdateautomation.image.toolkit.fluxcd.io' && (
            <ImageUpdateAutomation
              datasource={datasource}
              namespace={namespace}
              manifest={manifest}
            />
          )}

        {manifest && resourceId === 'alert.notification.toolkit.fluxcd.io' && (
          <Alert
            datasource={datasource}
            namespace={namespace}
            manifest={manifest}
          />
        )}

        {manifest &&
          resourceId === 'provider.notification.toolkit.fluxcd.io' && (
            <Provider
              datasource={datasource}
              namespace={namespace}
              manifest={manifest}
            />
          )}

        {manifest &&
          resourceId === 'receiver.notification.toolkit.fluxcd.io' && (
            <Receiver
              datasource={datasource}
              namespace={namespace}
              manifest={manifest}
            />
          )}
      </DefinitionLists>
    </ScrollContainer>
  );
}
