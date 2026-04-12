import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import { FieldColorModeId, MappingType } from '@grafana/schema';
import React from 'react';

import { useVizPanelMenu } from '../../hooks/useVizPanelMenu';

interface Props {
  title: string;
  description: string;
  refId: string;
  expr: string;
}

export function StatCosts({ title, description, refId, expr }: Props) {
  const dataProvider = useQueryRunner({
    datasource: {
      type: 'prometheus',
      uid: '$prometheus',
    },
    queries: [
      {
        refId: refId,
        format: 'time_series',
        instant: true,
        expr: expr,
      },
    ],
  });

  const viz = VizConfigBuilders.stat()
    .setUnit('currencyUSD')
    .setColor({
      mode: FieldColorModeId.Fixed,
      fixedColor: 'text',
    })
    .setMappings([
      {
        options: {
          from: null,
          to: 0,
          result: {
            text: 'Undersized',
            index: 0,
          },
        },
        type: MappingType.RangeToText,
      },
    ])
    .build();

  const menu = useVizPanelMenu({
    data: dataProvider.useState(),
    viz,
  });

  return (
    <VizPanel
      title={title}
      description={description}
      menu={menu}
      viz={viz}
      dataProvider={dataProvider}
    />
  );
}
