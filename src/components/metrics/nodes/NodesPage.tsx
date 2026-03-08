import React from 'react';
import { VariableHide } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Stack, useStyles2 } from '@grafana/ui';
import {
  SceneContextProvider,
  DataSourceVariable,
  QueryVariable,
  VariableControl,
  TimeRangePicker,
  RefreshPicker,
} from '@grafana/scenes-react';

import pluginJson from '../../../plugin.json';
import datasourcePluginJson from '../../../datasource/plugin.json';
import resourcesImg from '../../../img/logo.svg';
import { getStyles } from '../../../utils/utils.styles';
import { LegendResourceUsage } from '../shared/LegendResourceUsage';
import { TableResourceUsage } from '../shared/TableResourceUsage';
import { queries } from '../queries';

export function NodesPage() {
  const styles = useStyles2(getStyles);

  return (
    <SceneContextProvider
      timeRange={{ from: `now-1h`, to: 'now' }}
      withQueryController
    >
      <DataSourceVariable
        name="datasource"
        label="Cluster"
        pluginId={datasourcePluginJson.id}
      >
        <QueryVariable
          name="prometheus"
          label="Prometheus"
          datasource={{ type: datasourcePluginJson.id, uid: '$datasource' }}
          query={{
            refId: 'settings',
            queryType: 'settings',
            setting: 'integrationsMetricsDatasourceUid',
            variableField: 'values',
          }}
          hide={VariableHide.hideVariable}
        >
          <QueryVariable
            name="cluster"
            label="Cluster Label"
            datasource={{ type: datasourcePluginJson.id, uid: '$datasource' }}
            query={{
              refId: 'settings',
              queryType: 'settings',
              setting: 'integrationsMetricsClusterLabel',
              variableField: 'values',
            }}
            hide={VariableHide.hideVariable}
          >
            <PluginPage
              renderTitle={() => (
                <Stack gap={0}>
                  <img
                    className={styles.pluginPage.title.image}
                    alt="Nodes"
                    src={resourcesImg}
                  />
                  <h1>Nodes</h1>
                </Stack>
              )}
              subTitle={pluginJson.info.description}
              actions={
                <>
                  <TimeRangePicker />
                  <RefreshPicker />
                </>
              }
            >
              <Stack direction="column" gap={2} height="100%">
                <div className={styles.dashboard.header.container}>
                  <VariableControl name="datasource" />
                  <VariableControl name="prometheus" />
                  <VariableControl name="cluster" />
                  <div className={styles.dashboard.header.spacer} />
                  <LegendResourceUsage />
                </div>
                <div className={styles.dashboard.row.height100percent}>
                  <TableResourceUsage
                    title="Nodes"
                    infoNodeExpr={queries.nodes.info}
                    cpuUsageAvgExpr={queries.nodes.cpuUsageAvgOverTime}
                    cpuUsageAvgPercentExpr={
                      queries.nodes.cpuUsageAvgPercentOverTime
                    }
                    cpuUsageMaxExpr={queries.nodes.cpuUsageMaxOverTime}
                    cpuUsageMaxPercentExpr={
                      queries.nodes.cpuUsageMaxPercentOverTime
                    }
                    memoryUsageAvgExpr={queries.nodes.memoryUsageAvgOverTime}
                    memoryUsageAvgPercentExpr={
                      queries.nodes.memoryUsageAvgPercentOverTime
                    }
                    memoryUsageMaxExpr={queries.nodes.memoryUsageMaxOverTime}
                    memoryUsageMaxPercentExpr={
                      queries.nodes.memoryUsageMaxPercentOverTime
                    }
                    alertsExpr={queries.nodes.alertsCount}
                  />
                </div>
              </Stack>
            </PluginPage>
          </QueryVariable>
        </QueryVariable>
      </DataSourceVariable>
    </SceneContextProvider>
  );
}
