import React from 'react';
import { CustomCellRendererProps, TableCellDisplayMode } from '@grafana/ui';
import { DataFrame, FieldType } from '@grafana/data';

import { Query } from '../../types/query';
import { Actions } from './Actions';

/**
 * This transformation adds an "Actions" column to the provided data frame. The
 * "Actions" column contains all the actions for a Kubernetes resource, like
 * viewing the YAML manifest, editing the resource, deleting the resource etc.
 */
export const kubernetesResourcesTransformation = (
  query: Query,
  frame: DataFrame,
) => {
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
