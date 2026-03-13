import React from 'react';
import { GrafanaTheme2, VariableRefresh, VariableSort } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import {
  QueryVariable,
  DataSourceVariable,
  SceneContextProvider,
  RefreshPicker,
  VariableControl,
} from '@grafana/scenes-react';

import datasourcePluginJson from '../../datasource/plugin.json';
import resourcesImg from '../../img/logo.svg';
import { DEFAULT_QUERIES } from '../../datasource/types/query';
import { ResourcesTable } from './ResourcesTable';

export const ResourcesPage = () => {
  const styles = useStyles2((theme: GrafanaTheme2) => {
    return {
      title: {
        image: css({
          width: '32px',
          height: '32px',
          marginRight: '16px',
        }),
      },
      header: css({
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1),
        containerType: 'inline-size',
        flexWrap: 'wrap',
      }),
      spacer: css({
        flex: 1,
      }),
      table: css({
        height: '100%',
      }),
    };
  });

  return (
    <PluginPage
      renderTitle={() => (
        <Stack gap={0} alignItems="center" direction="row">
          <img
            className={styles.title.image}
            alt="Resources"
            src={resourcesImg}
          />
          <h1>Resources</h1>
        </Stack>
      )}
      subTitle="Manage your Kubernetes resources."
    >
      <SceneContextProvider
        timeRange={{ from: `now-1h`, to: 'now' }}
        withQueryController
      >
        <DataSourceVariable
          name="datasource"
          label="Cluster"
          pluginId={datasourcePluginJson.id}
          refresh={VariableRefresh.onDashboardLoad}
        >
          <QueryVariable
            name="resourceId"
            label="Resource"
            datasource={{ type: datasourcePluginJson.id, uid: '${datasource}' }}
            query={{
              refId: 'kubernetes-resourceids',
              queryType: 'kubernetes-resourceids',
            }}
            refresh={VariableRefresh.onDashboardLoad}
            sort={VariableSort.alphabeticalCaseInsensitiveAsc}
            initialValue={DEFAULT_QUERIES['kubernetes-resources'].resourceId}
          >
            <QueryVariable
              name="namespace"
              label="Namespace"
              datasource={{
                type: datasourcePluginJson.id,
                uid: '${datasource}',
              }}
              query={{
                refId: 'kubernetes-namespaces',
                queryType: 'kubernetes-namespaces',
              }}
              refresh={VariableRefresh.onDashboardLoad}
              sort={VariableSort.alphabeticalCaseInsensitiveAsc}
              initialValue={DEFAULT_QUERIES['kubernetes-resources'].namespace}
            >
              <Stack direction="column" gap={2} height="100%">
                <div className={styles.header}>
                  <VariableControl name="datasource" />
                  <VariableControl name="resourceId" />
                  <VariableControl name="namespace" />
                  <div className={styles.spacer} />
                  <RefreshPicker />
                </div>
                <div className={styles.table}>
                  <ResourcesTable />
                </div>
              </Stack>
            </QueryVariable>
          </QueryVariable>
        </DataSourceVariable>
      </SceneContextProvider>
    </PluginPage>
  );
};
