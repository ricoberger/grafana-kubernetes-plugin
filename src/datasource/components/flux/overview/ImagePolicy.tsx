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

export function ImagePolicy({ datasource, namespace, manifest }: Props) {
  const styles = useStyles2(() => {
    return {
      badge: css({
        cursor: 'pointer',
      }),
    };
  });

  const [selectedImageRepository, setSelectedImageRepository] = useState<
    { name: string } | undefined
  >(undefined);

  return (
    <>
      <DefinitionList title="Details">
        <DefinitionItem label="Image Repository">
          {manifest.spec?.imageRepositoryRef?.name ? (
            <Badge
              className={styles.badge}
              color="blue"
              onClick={() =>
                setSelectedImageRepository({
                  name: manifest.spec.imageRepositoryRef.name,
                })
              }
              text={manifest.spec.imageRepositoryRef.name}
            />
          ) : (
            '-'
          )}
        </DefinitionItem>
        <DefinitionItem label="Policy">
          {manifest.spec?.policy?.semver
            ? `SemVer: ${manifest.spec.policy.semver.range}`
            : manifest.spec?.policy?.alphabetical
              ? 'Alphabetical'
              : manifest.spec?.policy?.numerical
                ? 'Numerical'
                : '-'}
        </DefinitionItem>
        <DefinitionItem label="Filter Tags">
          {manifest.spec?.filterTags?.pattern || '-'}
        </DefinitionItem>

        {selectedImageRepository && (
          <Resources
            title="ImageRepository"
            datasource={datasource}
            resourceId="imagerepository.imagerepositories.image.toolkit.fluxcd.io"
            namespace={namespace}
            parameterName="fieldSelector"
            parameterValue={`metadata.name=${selectedImageRepository.name}`}
            onClose={() => setSelectedImageRepository(undefined)}
          />
        )}
      </DefinitionList>

      <DefinitionList title="Status">
        <DefinitionItem label="Latest Image">
          {manifest.status?.latestImage || '-'}
        </DefinitionItem>
      </DefinitionList>
    </>
  );
}
