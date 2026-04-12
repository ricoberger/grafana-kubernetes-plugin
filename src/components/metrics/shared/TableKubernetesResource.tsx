import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import { useStyles2 } from '@grafana/ui';
import React from 'react';

import datasourcePluginJson from '../../../datasource/plugin.json';
import { useVizPanelMenu } from '../../../hooks/useVizPanelMenu';
import { prometheusResourceToKubernetesResourceInfo } from '../../../utils/utils.resource';
import { getStyles } from '../../../utils/utils.styles';

export function TableKubernetesResource({ resource }: { resource: string }) {
  const styles = useStyles2(getStyles);
  const info = prometheusResourceToKubernetesResourceInfo(resource);

  if (!info) {
    return <></>;
  }

  return (
    <>
      <div className={styles.dashboard.header.container}>
        <h4>{info.title} Information</h4>
        <div className={styles.dashboard.header.spacer} />
      </div>
      <div className={styles.dashboard.row.height115px}>
        <TableKubernetesResourceInternal
          title={info.title}
          resourceId={info.resourceId}
          parameterName={info.parameterName}
          parameterValue={info.parameterValue}
        />
      </div>
    </>
  );
}

function TableKubernetesResourceInternal({
  title,
  resourceId,
  parameterName,
  parameterValue,
}: {
  title: string;
  resourceId: string;
  parameterName: string;
  parameterValue: string;
}) {
  const dataProvider = useQueryRunner({
    datasource: {
      type: datasourcePluginJson.id,
      uid: '$datasource',
    },
    queries: [
      {
        refId: 'A',
        queryType: 'kubernetes-resources',
        resourceId: resourceId,
        namespace: '$namespace',
        parameterName: parameterName,
        parameterValue: parameterValue,
      },
    ],
  });

  const viz = VizConfigBuilders.table().build();

  const menu = useVizPanelMenu({
    data: dataProvider.useState(),
    viz,
  });

  return (
    <VizPanel title={title} menu={menu} viz={viz} dataProvider={dataProvider} />
  );
}
