import { DataFrame, FieldType } from '@grafana/data';
import { CustomCellRendererProps, TableCellDisplayMode } from '@grafana/ui';
import React from 'react';

import { Actions as CertManagerActions } from '../components/certmanager/Actions';
import { Actions as FluxActions } from '../components/flux/Actions';
import { Actions } from '../components/kubernetes/Actions';
import { Query } from '../types/query';

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
                if (
                  [
                    'bucket.source.toolkit.fluxcd.io',
                    'gitrepository.source.toolkit.fluxcd.io',
                    'helmchart.source.toolkit.fluxcd.io',
                    'helmrepository.source.toolkit.fluxcd.io',
                    'ocirepository.source.toolkit.fluxcd.io',
                    'kustomization.kustomize.toolkit.fluxcd.io',
                    'helmrelease.helm.toolkit.fluxcd.io',
                    'imagerepository.image.toolkit.fluxcd.io',
                    'imageupdateautomation.image.toolkit.fluxcd.io',
                    'receiver.notification.toolkit.fluxcd.io',
                  ].includes(query.resourceId || '')
                ) {
                  return (
                    <FluxActions
                      query={query}
                      frame={props.frame}
                      rowIndex={props.rowIndex}
                    />
                  );
                }

                if (
                  [
                    'issuer.cert-manager.io',
                    'order.acme.cert-manager.io',
                    'challenge.acme.cert-manager.io',
                    'clusterissuer.cert-manager.io',
                    'certificaterequest.cert-manager.io',
                    'certificate.cert-manager.io',
                  ].includes(query.resourceId || '')
                ) {
                  return (
                    <CertManagerActions
                      query={query}
                      frame={props.frame}
                      rowIndex={props.rowIndex}
                    />
                  );
                }

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

export const kubernetesLogsTransformation = (
  frame: DataFrame,
  tracesQuery: string,
) => {
  const labels = frame.fields.find((field) => field.name === 'labels')?.values;
  if (!labels) {
    return frame;
  }

  return {
    ...frame,
    fields: [
      ...frame.fields,
      {
        name: 'Trace',
        type: FieldType.string,
        values: labels.map((labels) => {
          for (const [key, value] of Object.entries(labels)) {
            if (key.toLowerCase() === 'traceid') {
              return value;
            } else if (key.toLowerCase() === 'trace_id') {
              return value;
            }
          }

          return null;
        }),
        config: {
          links: [
            {
              title: 'View Trace',
              url: `/explore?left=${tracesQuery}`,
              targetBlank: true,
            },
          ],
        },
      },
    ],
  };
};
