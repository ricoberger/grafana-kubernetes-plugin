import React, { useEffect, useState } from 'react';
import {
  SceneComponentProps,
  SceneObjectBase,
  SceneObjectState,
} from '@grafana/scenes';
import { Card, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { DataSourceSettings, GrafanaTheme2 } from '@grafana/data';

import datasourcePluginJson from '../../datasource/plugin.json';
import { Kubeconfig } from './Kubeconfig';

interface DatasourcesState extends SceneObjectState { }

export class Datasources extends SceneObjectBase<DatasourcesState> {
  static Component = DatasourcesRenderer;
}

function DatasourcesRenderer({ }: SceneComponentProps<Datasources>) {
  const styles = useStyles2(getStyles);
  const [datasources, setDatasources] = useState<DataSourceSettings[]>([]);
  const [datasource, setDatasource] = useState('');

  useEffect(() => {
    const fetchDataSources = async () => {
      const response = await fetch('/api/datasources');
      const data = await response.json();
      const filteredDatasources = data.filter(
        (ds: DataSourceSettings) => ds.type === datasourcePluginJson.id,
      );

      setDatasources(filteredDatasources);
    };

    fetchDataSources();
  }, []);

  return (
    <>
      <div className={styles.container}>
        <ul className={styles.list}>
          {datasources.map((ds) => (
            <li key={ds.id}>
              <Card noMargin onClick={() => setDatasource(ds.uid)}>
                <Card.Heading>{ds.name}</Card.Heading>
                <Card.Figure>
                  <img
                    src={ds.typeLogoUrl}
                    alt={`${ds.name} logo`}
                    width="40"
                    height="40"
                  />
                </Card.Figure>
              </Card>
            </li>
          ))}
        </ul>
      </div>

      {datasource && (
        <Kubeconfig datasource={datasource} onClose={() => setDatasource('')} />
      )}
    </>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    container: css({
      width: '100%',
    }),
    list: css({
      padding: '20px',
      listStyle: 'none',
      display: 'grid',
      gap: theme.spacing(1),
    }),
  };
};
