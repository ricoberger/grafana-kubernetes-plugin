import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import { useStyles2 } from '@grafana/ui';

import datasourcePluginJson from '../../../datasource/plugin.json';
import { useVizPanelMenu } from '../../../hooks/useVizPanelMenu';
import { getStyles } from '../../../utils/utils.styles';

function getResourceInfo(resource: string):
  | {
    title: string;
    resourceId: string;
    parameterName: string;
    parameterValue: string;
  }
  | undefined {
  switch (resource.toLowerCase()) {
    case 'node':
      return {
        title: 'Node',
        resourceId: 'node',
        parameterName: 'fieldSelector',
        parameterValue: `metadata.name=$node`,
      };
    case 'namespace':
      return {
        title: 'Namespace',
        resourceId: 'namespace',
        parameterName: 'fieldSelector',
        parameterValue: `metadata.name=$namespace`,
      };
    case 'deployment':
      return {
        title: 'Deployment',
        resourceId: 'deployment.apps',
        parameterName: 'fieldSelector',
        parameterValue: `metadata.name=$workload`,
      };
    case 'statefulset':
      return {
        title: 'StatefulSet',
        resourceId: 'statefulset.apps',
        parameterName: 'fieldSelector',
        parameterValue: `metadata.name=$workload`,
      };
    case 'daemonset':
      return {
        title: 'DaemonSet',
        resourceId: 'daemonset.apps',
        parameterName: 'fieldSelector',
        parameterValue: `metadata.name=$workload`,
      };
    case 'replicaset':
      return {
        title: 'ReplicaSet',
        resourceId: 'replicaset.apps',
        parameterName: 'fieldSelector',
        parameterValue: `metadata.name=$workload`,
      };
    case 'cronjob':
      return {
        title: 'CronJob',
        resourceId: 'cronjob.batch',
        parameterName: 'fieldSelector',
        parameterValue: `metadata.name=$workload`,
      };
    case 'job':
      return {
        title: 'Job',
        resourceId: 'job.batch',
        parameterName: 'fieldSelector',
        parameterValue: `metadata.name=$workload`,
      };
    case 'pod':
      return {
        title: 'Pod',
        resourceId: 'pod',
        parameterName: 'fieldSelector',
        parameterValue: `metadata.name=$pod`,
      };
    case 'persistentvolumeclaim':
      return {
        title: 'PersistentVolumeClaim',
        resourceId: 'persistentvolumeclaim',
        parameterName: 'fieldSelector',
        parameterValue: `metadata.name=$pvc`,
      };
    /**
     * The following resource types are none default Kubernetes resources, but
     * we want to support them as well, when the corresponding project is well
     * known and widely used.
     */
    case 'strimzipodset':
      return {
        title: 'StrimziPodSet',
        resourceId: 'strimzipodset.core.strimzi.io',
        parameterName: 'fieldSelector',
        parameterValue: `metadata.name=$workload`,
      };

    default:
      return undefined;
  }
}

export const TableKubernetesResource = ({ resource }: { resource: string }) => {
  const styles = useStyles2(getStyles);
  const info = getResourceInfo(resource);

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
};

const TableKubernetesResourceInternal = ({
  title,
  resourceId,
  parameterName,
  parameterValue,
}: {
  title: string;
  resourceId: string;
  parameterName: string;
  parameterValue: string;
}) => {
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
};
