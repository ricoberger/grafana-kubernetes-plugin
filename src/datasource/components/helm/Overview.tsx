import React, { useMemo, useState } from 'react';
import YAML from 'yaml';
import { Badge, ScrollContainer, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Release } from '../../types/helm';
import {
  DefinitionItem,
  DefinitionList,
  DefinitionLists,
} from '../shared/definitionlist/DefinitionList';
import { formatTimeString } from '../../../utils/utils.time';
import { KubernetesManifest } from '../../types/kubernetes';
import { getResourceId } from '../../../utils/utils.resource';
import { Resources } from '../shared/details/Resources';

interface Props {
  datasource?: string;
  namespace?: string;
  release: Release | undefined;
}

export function Overview({ datasource, namespace, release }: Props) {
  const styles = useStyles2(() => {
    return {
      badge: css({
        cursor: 'pointer',
      }),
    };
  });

  const [selectedResource, setSelectedResource] = useState<
    | { kind: string; resourceId: string; namespace?: string; name: string }
    | undefined
  >(undefined);

  const { manifests } = useMemo(() => {
    const parsedManifests: KubernetesManifest[] = [];

    try {
      if (release?.manifest) {
        const documents = YAML.parseAllDocuments(release?.manifest);
        for (const document of documents) {
          const jsonDocument = document.toJSON() as KubernetesManifest;
          parsedManifests.push(jsonDocument);
        }
      }
    } catch (_) { }

    return { manifests: parsedManifests };
  }, [release?.manifest]);

  return (
    <ScrollContainer height="100%">
      <DefinitionLists>
        <DefinitionList title="Details">
          <DefinitionItem label="Name">{release?.name || '-'}</DefinitionItem>
          <DefinitionItem label="Namespace">
            {release?.namespace || '-'}
          </DefinitionItem>
          <DefinitionItem label="Version">
            {release?.version || '-'}
          </DefinitionItem>
          <DefinitionItem label="Status">
            {release?.info?.status || '-'}
          </DefinitionItem>
          <DefinitionItem label="Description">
            {release?.info?.description || '-'}
          </DefinitionItem>
          <DefinitionItem label="First Deployed">
            {release?.info?.first_deployed
              ? formatTimeString(release?.info.first_deployed)
              : '-'}
          </DefinitionItem>
          <DefinitionItem label="Last Deployed">
            {release?.info?.last_deployed
              ? formatTimeString(release?.info.last_deployed)
              : '-'}
          </DefinitionItem>
          <DefinitionItem label="Notes">
            {release?.info?.notes || '-'}
          </DefinitionItem>
          <DefinitionItem label="Manifests">
            {manifests.map((manifest) => {
              return (
                <Badge
                  className={styles.badge}
                  key={`${manifest.kind}-${manifest.metadata?.name}`}
                  color="blue"
                  onClick={() =>
                    setSelectedResource({
                      kind: manifest.kind || '',
                      resourceId: getResourceId(
                        manifest.kind || '',
                        manifest.apiVersion || '',
                      ),
                      namespace: manifest.metadata?.namespace || namespace,
                      name: manifest.metadata?.name || '',
                    })
                  }
                  text={`${manifest.metadata?.namespace || namespace}/${manifest.metadata?.name} (${manifest.kind})`}
                />
              );
            })}
          </DefinitionItem>
        </DefinitionList>
      </DefinitionLists>

      {selectedResource && (
        <Resources
          title={selectedResource.kind}
          datasource={datasource}
          resourceId={selectedResource.resourceId}
          namespace={selectedResource.namespace || '*'}
          parameterName="fieldSelector"
          parameterValue={`metadata.name=${selectedResource.name}`}
          onClose={() => setSelectedResource(undefined)}
        />
      )}
    </ScrollContainer>
  );
}
