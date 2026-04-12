import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import React from 'react';

import datasourcePluginJson from '../../datasource/plugin.json';

export function HelmReleasesTable() {
  const dataProvider = useQueryRunner({
    datasource: {
      type: datasourcePluginJson.id,
      uid: '${datasource}',
    },
    queries: [
      {
        refId: 'A',
        queryType: 'helm-releases',
        namespace: '${namespace}',
      },
    ],
  });

  const viz = VizConfigBuilders.table().build();

  return <VizPanel title="Releases" viz={viz} dataProvider={dataProvider} />;
}
