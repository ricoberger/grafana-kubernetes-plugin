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
import helmImg from '../../img/helm.svg';
import { DEFAULT_QUERIES } from '../../datasource/types/query';
import { HelmReleasesTable } from './HelmReleasesTable';

export const HelmPage = () => {
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
          <img className={styles.title.image} alt="Helm" src={helmImg} />
          <h1>Helm</h1>
        </Stack>
      )}
      subTitle="Manage your Helm releases."
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
            initialValue={DEFAULT_QUERIES['helm-releases'].namespace}
          >
            <Stack direction="column" gap={2} height="100%">
              <div className={styles.header}>
                <VariableControl name="datasource" />
                <VariableControl name="namespace" />
                <div className={styles.spacer} />
                <RefreshPicker />
              </div>
              <div className={styles.table}>
                <HelmReleasesTable />
              </div>
            </Stack>
          </QueryVariable>
        </DataSourceVariable>
      </SceneContextProvider>
    </PluginPage>
  );
};
