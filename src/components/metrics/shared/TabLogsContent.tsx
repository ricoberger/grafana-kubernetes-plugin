import { VariableRefresh, VariableSort } from '@grafana/data';
import { VizConfigBuilders } from '@grafana/scenes';
import {
  QueryVariable,
  VariableControl,
  VizPanel,
  useQueryRunner,
  useVariables,
} from '@grafana/scenes-react';
import { Stack, useStyles2 } from '@grafana/ui';
import React from 'react';

import datasourcePluginJson from '../../../datasource/plugin.json';
import { useVizPanelMenu } from '../../../hooks/useVizPanelMenu';
import { prometheusResourceToKubernetesResourceInfo } from '../../../utils/utils.resource';
import { getStyles } from '../../../utils/utils.styles';
import { queries, variableQuery } from '../queries';

interface Props {
  page: string;
  resource: string;
}

export function TabLogsContent({ page, resource }: Props) {
  const variables = useVariables();
  const settingsVariable = variables.find((v) => v.state.name === 'logs');
  // @ts-expect-error
  const settings = settingsVariable?.state.text;

  if (settings) {
    return <LogsCustomDatasource page={page} settings={settings} />;
  }

  return <LogsKubernetesDatasource resource={resource} />;
}

function LogsCustomDatasource({
  page,
  settings,
}: {
  page: string;
  settings: string;
}) {
  const styles = useStyles2(getStyles);
  const parsedSettings = JSON.parse(settings);

  if (!parsedSettings[page]) {
    return <></>;
  }

  return (
    <Stack direction="column" gap={2} height="calc(100% - 54px)">
      <div className={styles.dashboard.row.height100percent}>
        <LogsPanel query={parsedSettings[page]} />
      </div>
    </Stack>
  );
}

function LogsKubernetesDatasource({ resource }: { resource: string }) {
  const styles = useStyles2(getStyles);
  const info = prometheusResourceToKubernetesResourceInfo(resource);

  if (!info) {
    return <></>;
  }

  return (
    <QueryVariable
      name="container"
      label="Container"
      datasource={{
        type: 'prometheus',
        uid: '$prometheus',
      }}
      query={{
        refId: 'containers',
        query: variableQuery(queries.containers.labelsByClusterNamespacePod),
      }}
      refresh={VariableRefresh.onTimeRangeChanged}
      isMulti={false}
      includeAll={false}
      sort={VariableSort.alphabeticalCaseInsensitiveAsc}
    >
      <Stack direction="column" gap={2} height="calc(100% - 54px)">
        <div className={styles.dashboard.header.container}>
          <VariableControl name="container" />
          <div className={styles.dashboard.header.spacer} />
        </div>
        <div className={styles.dashboard.row.height100percent}>
          <LogsPanel
            query={{
              datasource: {
                type: datasourcePluginJson.id,
                uid: '$datasource',
              },
              queries: [
                {
                  refId: 'A',
                  queryType: 'kubernetes-logs',
                  resourceId: info.resourceId,
                  namespace: '$namespace',
                  name: resource === 'pod' ? '$pod' : '$workload',
                  container: '$container',
                  filter: '',
                  tail: 0,
                  previous: false,
                },
              ],
            }}
          />
        </div>
      </Stack>
    </QueryVariable>
  );
}

function LogsPanel({ query }: { query: any }) {
  const dataProvider = useQueryRunner(query);

  const viz = VizConfigBuilders.logs()
    .setOption('showTime', true)
    .setOption('showControls', true)
    .setOption('enableLogDetails', true)
    .build();

  const menu = useVizPanelMenu({
    data: dataProvider.useState(),
    viz,
  });

  return (
    <VizPanel title="Logs" menu={menu} viz={viz} dataProvider={dataProvider} />
  );
}
