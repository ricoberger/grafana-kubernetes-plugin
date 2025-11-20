import React from 'react';
import { InteractiveTable } from '@grafana/ui';
import { V1Condition } from '@kubernetes/client-node';

import { formatTimeString } from '../../../../utils/utils.time';
import { DefinitionList } from '../definitionlist/DefinitionList';

interface Props {
  conditions: V1Condition[];
}

export function Conditions({ conditions }: Props) {
  return (
    <DefinitionList title="Conditions">
      <InteractiveTable
        getRowId={(r) => r.id}
        columns={[
          {
            id: 'type',
            header: 'Type',
          },
          {
            id: 'status',
            header: 'Status',
          },
          {
            id: 'lastTransitionTime',
            header: 'Last Transition Time',
          },
          {
            id: 'reason',
            header: 'Reason',
          },
          {
            id: 'message',
            header: 'Message',
          },
        ]}
        data={conditions.map((condition) => ({
          id: condition.type,
          status: condition.status,
          type: condition.type,
          lastTransitionTime: condition.lastTransitionTime
            ? formatTimeString(condition.lastTransitionTime.toString())
            : '-',
          reason: condition.reason || '-',
          message: condition.message || '-',
        }))}
      />
    </DefinitionList>
  );
}
