import React from 'react';
import { Drawer } from '@grafana/ui';
import { VizConfigBuilders } from '@grafana/scenes';
import {
  SceneContextProvider,
  useQueryRunner,
  VizPanel,
} from '@grafana/scenes-react';

import datasourcePluginJson from '../../../plugin.json';

interface Props {
  title: string;
  datasource?: string;
  resourceId?: string;
  namespace?: string;
  parameterName?: string;
  parameterValue?: string;
  onClose: () => void;
}

export function Resources({
  title,
  datasource,
  resourceId,
  namespace,
  parameterName,
  parameterValue,
  onClose,
}: Props) {
  return (
    <Drawer title={title} scrollableContent={false} onClose={() => onClose()}>
      <SceneContextProvider
        timeRange={{ from: `now-1h`, to: 'now' }}
        withQueryController
      >
        <ResourcesTable
          title={title}
          datasource={datasource}
          resourceId={resourceId}
          namespace={namespace}
          parameterName={parameterName}
          parameterValue={parameterValue}
          onClose={onClose}
        />
      </SceneContextProvider>
    </Drawer>
  );
}

function ResourcesTable({
  title,
  datasource,
  resourceId,
  namespace,
  parameterName,
  parameterValue,
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
        parameterName: parameterName || '',
        parameterValue: parameterValue || '',
      },
    ],
  });

  const viz = VizConfigBuilders.table().build();

  return <VizPanel title={title} viz={viz} dataProvider={dataProvider} />;
}
