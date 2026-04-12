import { VizConfigBuilders } from '@grafana/scenes';
import {
  SceneContextProvider,
  useQueryRunner,
  VizPanel,
} from '@grafana/scenes-react';
import React from 'react';

import datasourcePluginJson from '../../../datasource/plugin.json';

interface Props {
  datasource?: string;
  namespace?: string;
  name?: string;
}

export function Jobs({ datasource, namespace, name }: Props) {
  return (
    <SceneContextProvider
      timeRange={{ from: `now-1h`, to: 'now' }}
      withQueryController
    >
      <JobsTable datasource={datasource} namespace={namespace} name={name} />
    </SceneContextProvider>
  );
}

function JobsTable({ datasource, namespace, name }: Props) {
  const dataProvider = useQueryRunner({
    datasource: {
      type: datasourcePluginJson.id,
      uid: datasource || undefined,
    },
    queries: [
      {
        refId: 'A',
        queryType: 'kubernetes-resources',
        resourceId: 'job.batch',
        namespace: namespace,
        parameterName: 'jsonPath',
        parameterValue: `{.items[?(@.metadata.ownerReferences[0].name=='${name}')]}`,
      },
    ],
  });

  const viz = VizConfigBuilders.table().build();

  return <VizPanel title="Jobs" viz={viz} dataProvider={dataProvider} />;
}
