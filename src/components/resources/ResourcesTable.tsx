import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';

import datasourcePluginJson from '../../datasource/plugin.json';

export const ResourcesTable = () => {
  const dataProvider = useQueryRunner({
    datasource: {
      type: datasourcePluginJson.id,
      uid: '${datasource}',
    },
    queries: [
      {
        refId: 'A',
        queryType: 'kubernetes-resources',
        resourceId: '${resourceId}',
        namespace: '${namespace}',
      },
    ],
  });

  const viz = VizConfigBuilders.table().build();

  return <VizPanel title="Resources" viz={viz} dataProvider={dataProvider} />;
};
