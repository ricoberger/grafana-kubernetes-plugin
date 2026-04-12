import { VizConfigBuilders } from '@grafana/scenes';
import {
  SceneContextProvider,
  useQueryRunner,
  VizPanel,
} from '@grafana/scenes-react';
import React from 'react';

import datasourcePluginJson from '../../../plugin.json';

interface Props {
  datasource?: string;
  namespace?: string;
  name?: string;
}

export function Events({ datasource, namespace, name }: Props) {
  return (
    <SceneContextProvider
      timeRange={{ from: `now-1h`, to: 'now' }}
      withQueryController
    >
      <EventsTable datasource={datasource} namespace={namespace} name={name} />
    </SceneContextProvider>
  );
}

function EventsTable({ datasource, namespace, name }: Props) {
  const dataProvider = useQueryRunner({
    datasource: {
      type: datasourcePluginJson.id,
      uid: datasource || undefined,
    },
    queries: [
      {
        refId: 'A',
        queryType: 'kubernetes-resources',
        resourceId: 'event',
        namespace: namespace || '*',
        parameterName: 'fieldSelector',
        parameterValue: `involvedObject.name=${name}`,
      },
    ],
  });

  const viz = VizConfigBuilders.table().build();

  return <VizPanel title="Events" viz={viz} dataProvider={dataProvider} />;
}
