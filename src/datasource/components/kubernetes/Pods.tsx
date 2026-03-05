import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import {
  SceneContextProvider,
  useQueryRunner,
  VizPanel,
} from '@grafana/scenes-react';

import datasourcePluginJson from '../../../datasource/plugin.json';
import { KubernetesManifest } from '../../types/kubernetes';

interface Props {
  datasource?: string;
  namespace?: string;
  manifest?: KubernetesManifest;
}

export function Pods({ datasource, namespace, manifest }: Props) {
  return (
    <SceneContextProvider
      timeRange={{ from: `now-1h`, to: 'now' }}
      withQueryController
    >
      <PodsTable
        datasource={datasource}
        namespace={namespace}
        manifest={manifest}
      />
    </SceneContextProvider>
  );
}
function PodsTable({ datasource, namespace, manifest }: Props) {
  /**
   * Create the selector which can be used to get the pods for all resources
   * except nodes. Therefore we check if the selector is defined in the query
   * and if not we use a different parameter name and value, to get the pods,
   * which are running on a node.
   */
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
        resourceId: 'pod',
        namespace: selector ? namespace : '*',
        parameterName: selector ? 'labelSelector' : 'fieldSelector',
        parameterValue: selector
          ? selector
          : `spec.nodeName=${manifest?.metadata?.name}`,
      },
    ],
  });

  const viz = VizConfigBuilders.table().build();

  return <VizPanel title="Pods" viz={viz} dataProvider={dataProvider} />;
}
