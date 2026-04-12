import { VizConfigBuilders } from '@grafana/scenes';
import {
  SceneContextProvider,
  useQueryRunner,
  VizPanel,
} from '@grafana/scenes-react';
import React from 'react';

import datasourcePluginJson from '../../../datasource/plugin.json';
import { KubernetesManifest } from '../../types/kubernetes';

interface Props {
  datasource?: string;
  resourceId?: string;
  namespace?: string;
  name?: string;
  manifest?: KubernetesManifest;
}

export function Top({ datasource, resourceId, namespace, manifest }: Props) {
  return (
    <SceneContextProvider
      timeRange={{ from: `now-1h`, to: 'now' }}
      withQueryController
    >
      <TopTable
        datasource={datasource}
        resourceId={resourceId}
        namespace={namespace}
        manifest={manifest}
      />
    </SceneContextProvider>
  );
}

export function TopTable({
  datasource,
  resourceId,
  namespace,
  manifest,
}: Props) {
  const selector = manifest?.spec?.selector?.matchLabels
    ? Object.keys(manifest?.spec.selector.matchLabels)
      .map((key) => `${key}=${manifest?.spec.selector.matchLabels[key]}`)
      .join(',')
    : '';

  const dataProvider = useQueryRunner({
    datasource: {
      type: datasourcePluginJson.id,
      uid: datasource || undefined,
    },
    queries: [
      {
        refId: 'A',
        queryType: 'kubernetes-resources',
        resourceId:
          resourceId === 'node'
            ? 'nodemetrics.metrics.k8s.io'
            : 'podmetrics.metrics.k8s.io',
        namespace: resourceId === 'node' ? '*' : namespace,
        parameterName: selector ? 'labelSelector' : 'fieldSelector',
        parameterValue: selector
          ? selector
          : `metadata.name=${manifest?.metadata?.name}`,
      },
    ],
  });

  const viz = VizConfigBuilders.table().build();

  return <VizPanel title="Top" viz={viz} dataProvider={dataProvider} />;
}
