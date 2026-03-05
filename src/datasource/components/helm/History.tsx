import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import {
  SceneContextProvider,
  useQueryRunner,
  VizPanel,
} from '@grafana/scenes-react';

import datasourcePluginJson from '../../../datasource/plugin.json';

interface Props {
  datasource?: string;
  namespace?: string;
  name?: string;
}

export function History({ datasource, namespace, name }: Props) {
  return (
    <SceneContextProvider
      timeRange={{ from: `now-1h`, to: 'now' }}
      withQueryController
    >
      <HistoryTable datasource={datasource} namespace={namespace} name={name} />
    </SceneContextProvider>
  );
}

function HistoryTable({ datasource, namespace, name }: Props) {
  const dataProvider = useQueryRunner({
    datasource: {
      type: datasourcePluginJson.id,
      uid: datasource || undefined,
    },
    queries: [
      {
        refId: 'A',
        queryType: 'helm-release-history',
        namespace: namespace,
        name: name,
      },
    ],
  });

  const viz = VizConfigBuilders.table().build();

  return <VizPanel title="History" viz={viz} dataProvider={dataProvider} />;
}
