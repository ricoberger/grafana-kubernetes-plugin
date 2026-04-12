import { VizConfigBuilders } from '@grafana/scenes';
import {
  SceneContextProvider,
  useQueryRunner,
  VizPanel,
} from '@grafana/scenes-react';
import React from 'react';

import datasourcePluginJson from '../../../datasource/plugin.json';

interface Props {
  datasource?: string;
  namespace?: string;
  name?: string;
}

export function CertificateRequests({ datasource, namespace, name }: Props) {
  return (
    <SceneContextProvider
      timeRange={{ from: `now-1h`, to: 'now' }}
      withQueryController
    >
      <CertificateRequestsTable
        datasource={datasource}
        namespace={namespace}
        name={name}
      />
    </SceneContextProvider>
  );
}

function CertificateRequestsTable({ datasource, namespace, name }: Props) {
  const dataProvider = useQueryRunner({
    datasource: {
      type: datasourcePluginJson.id,
      uid: datasource || undefined,
    },
    queries: [
      {
        refId: 'A',
        queryType: 'kubernetes-resources',
        resourceId: 'certificaterequest.cert-manager.io',
        namespace: namespace,
        parameterName: 'jsonPath',
        parameterValue: `{.items[?(@.metadata.annotations.cert-manager\\.io/certificate-name=='${name}')]}`,
      },
    ],
  });

  const viz = VizConfigBuilders.table().build();

  return (
    <VizPanel
      title="CertificateRequests"
      viz={viz}
      dataProvider={dataProvider}
    />
  );
}
