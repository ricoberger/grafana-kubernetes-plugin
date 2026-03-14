import React, { useState } from 'react';
import { RadioButtonGroup, Stack, useStyles2 } from '@grafana/ui';
import {
  VariableControl,
  useQueryRunner,
  VizPanel,
} from '@grafana/scenes-react';
import { VizConfigBuilders } from '@grafana/scenes';

import datasourcePluginJson from '../../../datasource/plugin.json';
import { getStyles } from '../../../utils/utils.styles';
import { useVizPanelMenu } from '../../../hooks/useVizPanelMenu';
import { TablePersistentVolumeClaimsUsage } from './TablePersistentVolumeClaimsUsage';

export function SectionPersistentVolumeClaimsForPods() {
  const styles = useStyles2(getStyles);
  const [selected, setSelected] = useState('usage');

  return (
    <div className={styles.pluginPage.section}>
      <h4>PersistentVolumeClaims</h4>
      <Stack direction="column" gap={2}>
        <div className={styles.dashboard.header.container}>
          <RadioButtonGroup
            options={[
              { label: 'Usage', value: 'usage' },
              { label: 'Info', value: 'info' },
            ]}
            value={selected}
            onChange={(value) => setSelected(value)}
          />
          <VariableControl name="pvc" />
          <div className={styles.dashboard.header.spacer} />
        </div>
        <div className={styles.dashboard.row.height400px}>
          {selected === 'usage' && <TablePersistentVolumeClaimsUsage />}
          {selected === 'info' && <TableKubernetesPersistentVolumeClaims />}
        </div>
      </Stack>
    </div>
  );
}

function TableKubernetesPersistentVolumeClaims() {
  const dataProvider = useQueryRunner({
    datasource: {
      type: datasourcePluginJson.id,
      uid: '$datasource',
    },
    queries: [
      {
        refId: 'A',
        queryType: 'kubernetes-resources',
        resourceId: 'persistentvolumeclaim',
        namespace: '$namespace',
        parameterName: 'regex',
        parameterValue: '${pvc:regex}',
      },
    ],
  });

  const viz = VizConfigBuilders.table().build();

  const menu = useVizPanelMenu({
    data: dataProvider.useState(),
    viz,
  });

  return (
    <VizPanel
      title="PersistentVolumeClaims"
      menu={menu}
      viz={viz}
      dataProvider={dataProvider}
    />
  );
}
