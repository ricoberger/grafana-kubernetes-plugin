import { VariableHide, VariableRefresh } from '@grafana/data';
import { VizConfigBuilders } from '@grafana/scenes';
import {
  CustomVariable,
  QueryVariable,
  SceneContextProvider,
  useQueryRunner,
  useVariableValue,
  VizPanel,
} from '@grafana/scenes-react';
import React from 'react';

import { useVizPanelMenu } from '../../../../hooks/useVizPanelMenu';
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
      <QueryVariable
        skipUrlSync={true}
        name="settings"
        label="Settings"
        datasource={{
          type: datasourcePluginJson.id,
          uid: datasource || undefined,
        }}
        query={{
          refId: 'settings',
          queryType: 'settings',
          setting: 'integrationsMetricsLogs',
          variableField: 'values',
        }}
        refresh={VariableRefresh.onDashboardLoad}
        hide={VariableHide.hideVariable}
      >
        <CustomVariable
          skipUrlSync={true}
          name="namespace"
          label="Namespace"
          query={namespace || ''}
          initialValue={namespace || ''}
          hide={VariableHide.hideVariable}
        >
          <CustomVariable
            skipUrlSync={true}
            name="name"
            label="Name"
            query={name || ''}
            initialValue={name || ''}
            hide={VariableHide.hideVariable}
          >
            <EventsContent
              datasource={datasource}
              namespace={namespace}
              name={name}
            />
          </CustomVariable>
        </CustomVariable>
      </QueryVariable>
    </SceneContextProvider>
  );
}

function EventsContent({ datasource, namespace, name }: Props) {
  const [settings] = useVariableValue<string>('settings');

  let eventsQuery: any = undefined;
  if (settings) {
    try {
      eventsQuery = JSON.parse(settings).events;
    } catch {
      eventsQuery = undefined;
    }
  }

  if (eventsQuery) {
    return <EventsLogs query={eventsQuery} />;
  }

  return (
    <EventsTable datasource={datasource} namespace={namespace} name={name} />
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

function EventsLogs({ query }: { query: any }) {
  const dataProvider = useQueryRunner(query);

  const viz = VizConfigBuilders.logs()
    .setOption('showTime', true)
    .setOption('showControls', true)
    .setOption('enableLogDetails', true)
    .build();

  const menu = useVizPanelMenu({
    data: dataProvider.useState(),
    viz,
    variables: ['namespace', 'name'],
  });

  return (
    <VizPanel
      title="Events"
      menu={menu}
      viz={viz}
      dataProvider={dataProvider}
    />
  );
}
