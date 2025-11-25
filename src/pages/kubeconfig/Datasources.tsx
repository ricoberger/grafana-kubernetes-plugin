import React from 'react';
import {
  SceneComponentProps,
  SceneObjectBase,
  SceneObjectState,
} from '@grafana/scenes';
import { Alert, LoadingPlaceholder, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { DataSourceSettings, GrafanaTheme2 } from '@grafana/data';
import { useAsync } from 'react-use';

import datasourcePluginJson from '../../datasource/plugin.json';
import { Datasource } from './Datasource';

interface DatasourcesState extends SceneObjectState { }

export class Datasources extends SceneObjectBase<DatasourcesState> {
  static Component = DatasourcesRenderer;
}

function DatasourcesRenderer({ }: SceneComponentProps<Datasources>) {
  const styles = useStyles2((theme: GrafanaTheme2) => {
    return {
      container: css({
        width: '100%',
      }),
      list: css({
        listStyle: 'none',
        display: 'grid',
        gap: theme.spacing(1),
      }),
    };
  });

  const state = useAsync(async (): Promise<DataSourceSettings[]> => {
    const response = await fetch('/api/datasources');
    const data = await response.json();
    const filteredDatasources = data.filter(
      (ds: DataSourceSettings) => ds.type === datasourcePluginJson.id,
    );
    return filteredDatasources;
  }, []);

  return (
    <>
      <div className={styles.container}>
        {state.loading ? (
          <LoadingPlaceholder text={'Loading data sources...'} />
        ) : state.error ? (
          <Alert severity="error" title="Failed to load data sources">
            {state.error.message}
          </Alert>
        ) : (
          <ul className={styles.list}>
            {state.value?.map((ds) => (
              <Datasource key={ds.id} datasource={ds} />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
