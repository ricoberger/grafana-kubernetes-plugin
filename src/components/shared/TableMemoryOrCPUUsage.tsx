import { DataTransformerID } from '@grafana/data';
import { SceneDataQuery, VizConfigBuilders } from '@grafana/scenes';
import {
  useDataTransformer,
  useQueryRunner,
  VizPanel,
} from '@grafana/scenes-react';
import React from 'react';

import { ROUTES } from '../../constants';
import { useVizPanelMenu } from '../../hooks/useVizPanelMenu';
import { prefixRoute } from '../../utils/utils.routing';

interface Props {
  title: string;
  unit: string;
  infoExpr?: string;
  infoContainerExpr?: string;
  usageExpr?: string;
  requestsExpr?: string;
  requestsPercentExpr?: string;
  limitsExpr?: string;
  limitsPercentExpr?: string;
}

export function TableMemoryOrCPUUsage({
  title,
  unit,
  infoExpr,
  infoContainerExpr,
  usageExpr,
  requestsExpr,
  requestsPercentExpr,
  limitsExpr,
  limitsPercentExpr,
}: Props) {
  const queries: SceneDataQuery[] = [];

  if (infoExpr) {
    queries.push({
      refId: 'info',
      format: 'table',
      instant: true,
      expr: infoExpr,
    });
  }
  if (infoContainerExpr) {
    queries.push({
      refId: 'info_container',
      format: 'table',
      instant: true,
      expr: infoContainerExpr,
    });
  }
  if (usageExpr) {
    queries.push({
      refId: 'usage',
      format: 'table',
      instant: true,
      expr: usageExpr,
    });
  }
  if (requestsExpr) {
    queries.push({
      refId: 'requests',
      format: 'table',
      instant: true,
      expr: requestsExpr,
    });
  }
  if (requestsPercentExpr) {
    queries.push({
      refId: 'requests_percent',
      format: 'table',
      instant: true,
      expr: requestsPercentExpr,
    });
  }
  if (limitsExpr) {
    queries.push({
      refId: 'limits',
      format: 'table',
      instant: true,
      expr: limitsExpr,
    });
  }
  if (limitsPercentExpr) {
    queries.push({
      refId: 'limits_percent',
      format: 'table',
      instant: true,
      expr: limitsPercentExpr,
    });
  }

  const dataProvider = useQueryRunner({
    datasource: {
      type: 'prometheus',
      uid: '$prometheus',
    },
    queries: queries,
  });

  const dataTransformer = useDataTransformer({
    data: dataProvider,
    transformations: [
      {
        id: DataTransformerID.joinByField,
        options: {
          byField: 'join_key',
          mode: 'outer',
        },
      },
      {
        id: DataTransformerID.organize,
        options: {
          includeByName: {
            ['node 1']: infoContainerExpr ? false : true,
            ['namespace 1']: infoContainerExpr ? false : true,
            ['workload 1']: infoContainerExpr ? false : true,
            ['workload_type 1']: infoContainerExpr ? false : true,
            ['pod 1']: infoContainerExpr ? false : true,
            ['container 1']: infoContainerExpr ? true : false,
            ['Value #usage']: true,
            ['Value #requests']: true,
            ['Value #requests_percent']: true,
            ['Value #limits']: true,
            ['Value #limits_percent']: true,
          },
          indexByName: {
            ['namespace 1']: 0,
            ['pod 1']: 1,
            ['container 1']: 2,
            ['node 1']: 3,
            ['workload 1']: 4,
            ['workload_type 1']: 5,
            ['Value #usage']: 6,
            ['Value #requests']: 7,
            ['Value #requests_percent']: 8,
            ['Value #limits']: 9,
            ['Value #limits_percent']: 10,
          },
          renameByName: {
            ['node 1']: 'NODE',
            ['namespace 1']: 'NAMESPACE',
            ['workload 1']: 'WORKLOAD',
            ['workload_type 1']: 'WORKLOAD TYPE',
            ['pod 1']: 'POD',
            ['container 1']: 'CONTAINER',
            ['Value #usage']: 'USAGE',
            ['Value #requests']: 'REQUESTS',
            ['Value #requests_percent']: 'REQUESTS %',
            ['Value #limits']: 'LIMITS',
            ['Value #limits_percent']: 'LIMITS %',
          },
        },
      },
    ],
  });

  const viz = VizConfigBuilders.table()
    .setOption('sortBy', [
      {
        desc: false,
        displayName: 'NAMESPACE',
      },
      {
        desc: false,
        displayName: 'POD',
      },
      {
        desc: false,
        displayName: 'NODE',
      },
      {
        desc: false,
        displayName: 'WORKLOAD',
      },
      {
        desc: false,
        displayName: 'WORKLOAD TYPE',
      },
    ])
    .setOverrides((b) => {
      return b
        .matchFieldsWithName('node')
        .overrideCustomFieldConfig('width', 300)
        .overrideLinks([
          {
            title: '',
            url: `${prefixRoute(ROUTES.MetricsNodes)}/\${__value.raw}\${__url.params:exclude:var-node,var-namespace,var-workloadtype,var-workload,var-pod,var-pvc}`,
          },
        ])
        .build();
    })
    .setOverrides((b) => {
      return b
        .matchFieldsWithName('namespace')
        .overrideCustomFieldConfig('width', 300)
        .overrideLinks([
          {
            title: '',
            url: `${prefixRoute(ROUTES.MetricsNamespaces)}/\${__value.raw}\${__url.params:exclude:var-node,var-namespace,var-workloadtype,var-workload,var-pod,var-pvc}`,
          },
        ])
        .build();
    })
    .setOverrides((b) => {
      return b
        .matchFieldsWithName('workload')
        .overrideCustomFieldConfig('width', 300)
        .overrideLinks([
          {
            title: '',
            url: `${prefixRoute(ROUTES.MetricsWorkloads)}/\${__data.fields["namespace"].text}/\${__data.fields["workload_type"].text}/\${__value.raw}\${__url.params:exclude:var-node,var-namespace,var-workloadtype,var-workload,var-pod,var-pvc}`,
          },
        ])
        .build();
    })
    .setOverrides((b) => {
      return b
        .matchFieldsWithName('workload_type')
        .overrideCustomFieldConfig('width', 150)
        .build();
    })
    .setOverrides((b) => {
      return b
        .matchFieldsWithName('pod')
        .overrideCustomFieldConfig('width', 300)
        .overrideLinks([
          {
            title: '',
            url: `${prefixRoute(ROUTES.MetricsPods)}/\${__data.fields["namespace"].text}/\${__value.raw}\${__url.params:exclude:var-node,var-namespace,var-workloadtype,var-workload,var-pod,var-pvc}`,
          },
        ])
        .build();
    })
    .setOverrides((b) => {
      return b
        .matchFieldsWithName('container')
        .overrideCustomFieldConfig('width', 200)
        .build();
    })
    .setOverrides((b) =>
      b.matchFieldsWithName('Value #usage').overrideUnit(unit),
    )
    .setOverrides((b) =>
      b.matchFieldsWithName('Value #requests').overrideUnit(unit),
    )
    .setOverrides((b) =>
      b
        .matchFieldsWithName('Value #requests_percent')
        .overrideUnit('percentunit')
        .overrideCustomFieldConfig('width', 150),
    )
    .setOverrides((b) =>
      b.matchFieldsWithName('Value #limits').overrideUnit(unit),
    )
    .setOverrides((b) =>
      b
        .matchFieldsWithName('Value #limits_percent')
        .overrideUnit('percentunit')
        .overrideCustomFieldConfig('width', 150),
    )
    .build();

  const menu = useVizPanelMenu({
    data: dataProvider.useState(),
    viz,
  });

  return (
    <VizPanel
      title={title}
      menu={menu}
      viz={viz}
      dataProvider={dataTransformer}
    />
  );
}
