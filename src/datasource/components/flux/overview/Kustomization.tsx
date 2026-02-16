import React, { useState } from 'react';
import { Badge, InteractiveTable, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import {
  DefinitionList,
  DefinitionItem,
} from '../../shared/definitionlist/DefinitionList';
import { Resources } from '../../shared/details/Resources';
import { KubernetesManifest } from '../../../types/kubernetes';
import { fluxKindToResourceId } from '../utils';
import { formatTimeString } from '../../../../utils/utils.time';
import { getResourceId } from '../../../../utils/utils.resource';

interface Props {
  datasource?: string;
  namespace?: string;
  manifest: KubernetesManifest;
}

export function Kustomization({ datasource, namespace, manifest }: Props) {
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
  const [selectedKustomization, setSelectedKustomization] = useState<
    { namespace: string; name: string } | undefined
  >(undefined);
  const [selectedResource, setSelectedResource] = useState<
    | { kind: string; resourceId: string; namespace?: string; name: string }
    | undefined
  >(undefined);

  return (
    <>
      <DefinitionList title="Details">
        <DefinitionItem label="Force">
          {manifest.spec && manifest.spec.force ? 'True' : 'False'}
        </DefinitionItem>
        <DefinitionItem label="Prune">
          {manifest.spec && manifest.spec.prune ? 'True' : 'False'}
        </DefinitionItem>
        <DefinitionItem label="Suspended">
          {manifest.spec && manifest.spec.suspend ? 'True' : 'False'}
        </DefinitionItem>
        <DefinitionItem label="Interval">
          {manifest.spec && manifest.spec.interval
            ? manifest.spec.interval
            : '-'}
        </DefinitionItem>
        <DefinitionItem label="Path">
          {manifest.spec && manifest.spec.path ? manifest.spec.path : '-'}
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
        <DefinitionItem label="Depends On">
          {manifest.spec?.dependsOn
            ? manifest.spec?.dependsOn.map(
              (dependsOn: { namespace?: string; name: string }) => (
                <Badge
                  key={`${dependsOn.namespace}/${dependsOn.name}`}
                  className={styles.badge}
                  color="blue"
                  onClick={() =>
                    setSelectedKustomization({
                      namespace: dependsOn.namespace || namespace || '*',
                      name: dependsOn.name,
                    })
                  }
                  text={`${dependsOn.namespace ? `${dependsOn.namespace}/` : ''}${dependsOn.name}`}
                />
              ),
            )
            : '-'}
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
        {selectedKustomization && (
          <Resources
            title="Kustomization"
            datasource={datasource}
            resourceId="kustomization.kustomize.toolkit.fluxcd.io"
            namespace={selectedKustomization.namespace}
            parameterName="fieldSelector"
            parameterValue={`metadata.name=${selectedKustomization.name}`}
            onClose={() => setSelectedKustomization(undefined)}
          />
        )}
      </DefinitionList>

      <DefinitionList title="Status">
        <DefinitionItem label="Last Applied Revision">
          {manifest.status && manifest.status.lastAppliedRevision
            ? manifest.status.lastAppliedRevision
            : '-'}
        </DefinitionItem>
        <DefinitionItem label="Last Attempted Revision">
          {manifest.status && manifest.status.lastAttemptedRevision
            ? manifest.status.lastAttemptedRevision
            : '-'}
        </DefinitionItem>
        <DefinitionItem label="Inventory Entries">
          {manifest?.status?.inventory?.entries.map(
            (entry: { id: string; v: string }) => {
              const objMetadata = parseObjMetadata(entry.id);

              return (
                <Badge
                  className={styles.badge}
                  key={entry.id}
                  color="blue"
                  onClick={() =>
                    setSelectedResource({
                      kind: objMetadata?.groupKind?.kind || '',
                      resourceId: getResourceId(
                        objMetadata?.groupKind?.kind || '',
                        objMetadata?.groupKind?.group
                          ? `${objMetadata?.groupKind?.group}/${entry.v}`
                          : entry.v,
                      ),
                      namespace: objMetadata?.namespace,
                      name: objMetadata?.name || '',
                    })
                  }
                  text={`${objMetadata?.namespace ? `${objMetadata.namespace}/` : ''}${objMetadata?.name} (${objMetadata?.groupKind?.kind})`}
                />
              );
            },
          )}
        </DefinitionItem>

        {selectedResource && (
          <Resources
            title={selectedResource.kind}
            datasource={datasource}
            resourceId={selectedResource.resourceId}
            namespace={namespace || '*'}
            parameterName="fieldSelector"
            parameterValue={`metadata.name=${selectedResource.name}`}
            onClose={() => setSelectedResource(undefined)}
          />
        )}
      </DefinitionList>

      <DefinitionList title="History">
        <InteractiveTable
          getRowId={(r) => r.id}
          columns={[
            {
              id: 'lastReconciledStatus',
              header: 'Last Reconciled Status',
            },
            {
              id: 'firstReconciled',
              header: 'First Reconciled',
            },
            {
              id: 'lastReconciled',
              header: 'Last Reconciled',
            },
            {
              id: 'lastReconciledDuration',
              header: 'Last Reconciled Duration',
            },
            {
              id: 'totalReconciliations',
              header: 'Total Reconciliations',
            },
            {
              id: 'id',
              header: 'Digist',
            },
          ]}
          data={manifest?.status?.history?.map((history: any) => ({
            id: history.digest,
            firstReconciled: formatTimeString(history.firstReconciled),
            lastReconciled: formatTimeString(history.lastReconciled),
            lastReconciledDuration: history.lastReconciledDuration,
            lastReconciledStatus: history.lastReconciledStatus,
            totalReconciliations: history.totalReconciliations,
          }))}
        />
      </DefinitionList>
    </>
  );
}

interface ObjMetadata {
  namespace: string;
  name: string;
  groupKind: {
    group: string;
    kind: string;
  };
}

// Parse the object metadata from the provided inteventory entry id.
// See: https://github.com/fluxcd/cli-utils/blob/v0.37.1-flux.1/pkg/object/objmetadata.go
const parseObjMetadata = (s: string): ObjMetadata | undefined => {
  const fieldSeparator = '_';
  const colonTranscoded = '__';

  // Parse first field namespace.
  let index = s.indexOf(fieldSeparator);
  if (index === -1) {
    return undefined;
  }
  const namespace = s.slice(0, index);
  s = s.slice(index + 1);

  // Next, parse last field kind.
  index = s.lastIndexOf(fieldSeparator);
  if (index === -1) {
    return undefined;
  }
  const kind = s.slice(index + 1);
  s = s.slice(0, index);

  // Next, parse next to last field group.
  index = s.lastIndexOf(fieldSeparator);
  if (index === -1) {
    return undefined;
  }
  const group = s.slice(index + 1);

  // Finally, second field name. Name may contain colon transcoded as double
  // underscore.
  let name = s.slice(0, index);
  name = name.replace(new RegExp(colonTranscoded, 'g'), ':');

  // Check that there are no extra fields by search for fieldSeparator.
  if (name.includes(fieldSeparator)) {
    return undefined;
  }

  // Create the ObjMetadata object from the four parsed fields.
  return {
    namespace: namespace,
    name: name,
    groupKind: {
      group: group,
      kind: kind,
    },
  };
};
