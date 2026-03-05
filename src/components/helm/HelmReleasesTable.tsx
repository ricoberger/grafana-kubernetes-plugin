import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';

import datasourcePluginJson from '../../datasource/plugin.json';

export const HelmReleasesTable = () => {
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
};
