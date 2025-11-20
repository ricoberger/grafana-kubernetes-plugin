import React from 'react';
import { V1CronJob } from '@kubernetes/client-node';
import { Badge } from '@grafana/ui';

import {
  DefinitionList,
  DefinitionItem,
} from '../../shared/definitionlist/DefinitionList';
import { formatTime, timeDifference } from '../../../../utils/utils.time';

interface Props {
  manifest: V1CronJob;
}

export function CronJob(props: Props) {
  return (
    <DefinitionList title="Details">
      <DefinitionItem label="Schedule">
        {props.manifest.spec?.schedule ? props.manifest.spec?.schedule : '-'}
      </DefinitionItem>
      <DefinitionItem label="Suspended">
        {props.manifest.spec?.suspend ? 'True' : 'False'}
      </DefinitionItem>
      <DefinitionItem label="History Limit">
        <Badge
          color="darkgrey"
          text={`success=${props.manifest.spec?.successfulJobsHistoryLimit ? props.manifest.spec?.successfulJobsHistoryLimit : 0}`}
        />
        <Badge
          color="darkgrey"
          text={`failed=${props.manifest.spec?.failedJobsHistoryLimit ? props.manifest.spec?.failedJobsHistoryLimit : 0}`}
        />
      </DefinitionItem>
      <DefinitionItem label="Active">
        {props.manifest.status?.active ? 'True' : 'False'}
      </DefinitionItem>
      {props.manifest.status?.lastScheduleTime && (
        <DefinitionItem label="Last Schedule">
          {timeDifference(
            new Date().getTime(),
            new Date(
              props.manifest.status.lastScheduleTime.toString(),
            ).getTime(),
          )}{' '}
          ({formatTime(new Date(props.manifest.status.lastScheduleTime))})
        </DefinitionItem>
      )}
    </DefinitionList>
  );
}
