import React from 'react';
import { CustomCellRendererProps, TableCellDisplayMode } from '@grafana/ui';
import { DataFrame, FieldType } from '@grafana/data';

import { Query } from '../types/query';
import { Actions } from '../components/certmanager/Actions';

export const certManagerResourcesTransformation = (query: Query, frame: DataFrame) => {
  return {
    ...frame,
    fields: [
      ...frame.fields,
      {
        name: 'Actions',
        type: FieldType.other,
        values: [],
        config: {
          decimals: 0,
          custom: {
            cellOptions: {
              type: TableCellDisplayMode.Custom,
              cellComponent: (props: CustomCellRendererProps) => {
                return (
                  <Actions
                    query={query}
                    frame={props.frame}
                    rowIndex={props.rowIndex}
                  />
                );
              },
            },
          },
        },
        display: () => ({
          text: '',
          numeric: 0,
        }),
      },
    ],
  };
};
