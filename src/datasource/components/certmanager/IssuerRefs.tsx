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
  resourceId: string;
  namespace?: string;
  name?: string;
  title: string;
}

export function IssuerRefs({
  datasource,
  resourceId,
  namespace,
  name,
  title,
}: Props) {
  return (
    <SceneContextProvider
      timeRange={{ from: `now-1h`, to: 'now' }}
      withQueryController
    >
      <IssuerRefsTable
        datasource={datasource}
        resourceId={resourceId}
        namespace={namespace}
        name={name}
        title={title}
      />
    </SceneContextProvider>
  );
}

function IssuerRefsTable({
  datasource,
  resourceId,
  namespace,
  name,
  title,
}: Props) {
  const dataProvider = useQueryRunner({
    datasource: {
      type: datasourcePluginJson.id,
      uid: datasource || undefined,
    },
    queries: [
      {
        refId: 'A',
        queryType: 'kubernetes-resources',
        resourceId: resourceId,
        namespace: namespace || '*',
        parameterName: 'jsonPath',
        parameterValue: `{.items[?(@.spec.issuerRef.name=='${name}')]}`,
      },
    ],
  });

  const viz = VizConfigBuilders.table().build();

  return <VizPanel title={title} viz={viz} dataProvider={dataProvider} />;
}
