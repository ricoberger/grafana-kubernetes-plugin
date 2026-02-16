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

interface Props {
  datasource?: string;
  namespace?: string;
  manifest: KubernetesManifest;
}

export function HelmRelease({ datasource, namespace, manifest }: Props) {
  const styles = useStyles2(() => {
    return {
      badge: css({
        cursor: 'pointer',
      }),
    };
  });

  const [selectedChart, setSelectedChart] = useState<
    { kind: string; name: string; namespace?: string } | undefined
  >(undefined);
  const [selectedHelmRelease, setSelectedHelmRelease] = useState<
    { namespace: string; name: string } | undefined
  >(undefined);

  return (
    <>
      <DefinitionList title="Details">
        <DefinitionItem label="Chart">
          {manifest.spec?.chart?.spec?.chart || '-'}
        </DefinitionItem>
        <DefinitionItem label="Chart Source">
          {manifest.spec?.chart?.spec?.sourceRef?.name ? (
            <Badge
              className={styles.badge}
              color="blue"
              onClick={() =>
                setSelectedChart({
                  kind: manifest.spec.chart.spec.sourceRef.kind,
                  name: manifest.spec.chart.spec.sourceRef.name,
                  namespace:
                    manifest.spec.chart.spec.sourceRef.namespace || namespace,
                })
              }
              text={`${manifest.spec.chart.spec.sourceRef.name} (${manifest.spec.chart.spec.sourceRef.kind})`}
            />
          ) : manifest.spec?.chartRef?.name ? (
            <Badge
              className={styles.badge}
              color="blue"
              onClick={() =>
                setSelectedChart({
                  kind: 'HelmChart',
                  name: manifest.spec.chartRef.name,
                  namespace: manifest.spec.chartRef.namespace || namespace,
                })
              }
              text={`${manifest.spec.chartRef.name} (HelmChart)`}
            />
          ) : (
            '-'
          )}
        </DefinitionItem>
        <DefinitionItem label="Version">
          {manifest.spec?.chart?.spec?.version || '-'}
        </DefinitionItem>
        <DefinitionItem label="Suspended">
          {manifest.spec && manifest.spec.suspend ? 'True' : 'False'}
        </DefinitionItem>
        <DefinitionItem label="Interval">
          {manifest.spec?.interval || '-'}
        </DefinitionItem>
        <DefinitionItem label="Target Namespace">
          {manifest.spec?.targetNamespace || '-'}
        </DefinitionItem>
        <DefinitionItem label="Install">
          {manifest.spec?.install ? 'True' : 'False'}
        </DefinitionItem>
        <DefinitionItem label="Upgrade">
          {manifest.spec?.upgrade ? 'True' : 'False'}
        </DefinitionItem>
        <DefinitionItem label="Timeout">
          {manifest.spec?.timeout || '-'}
        </DefinitionItem>
        <DefinitionItem label="Max History">
          {manifest.spec?.maxHistory || '-'}
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
                    setSelectedHelmRelease({
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

        {selectedChart && (
          <Resources
            title={selectedChart.kind}
            datasource={datasource}
            resourceId={fluxKindToResourceId[selectedChart.kind]}
            namespace={selectedChart.namespace || namespace}
            parameterName="fieldSelector"
            parameterValue={`metadata.name=${selectedChart.name}`}
            onClose={() => setSelectedChart(undefined)}
          />
        )}
        {selectedHelmRelease && (
          <Resources
            title="HelmRelease"
            datasource={datasource}
            resourceId="helmrelease.helm.toolkit.fluxcd.io"
            namespace={selectedHelmRelease.namespace}
            parameterName="fieldSelector"
            parameterValue={`metadata.name=${selectedHelmRelease.name}`}
            onClose={() => setSelectedHelmRelease(undefined)}
          />
        )}
      </DefinitionList>

      <DefinitionList title="Status">
        <DefinitionItem label="Last Applied Revision">
          {manifest.status?.lastAppliedRevision || '-'}
        </DefinitionItem>
        <DefinitionItem label="Last Attempted Revision">
          {manifest.status?.lastAttemptedRevision || '-'}
        </DefinitionItem>
        <DefinitionItem label="Last Attempted Values Checksum">
          {manifest.status?.lastAttemptedValuesChecksum || '-'}
        </DefinitionItem>
        <DefinitionItem label="Helm Chart">
          {manifest.status?.helmChart || '-'}
        </DefinitionItem>
        <DefinitionItem label="Install Failures">
          {manifest.status?.installFailures || '0'}
        </DefinitionItem>
        <DefinitionItem label="Upgrade Failures">
          {manifest.status?.upgradeFailures || '0'}
        </DefinitionItem>
      </DefinitionList>
    </>
  );
}
