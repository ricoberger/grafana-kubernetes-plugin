import { useVariables } from '@grafana/scenes-react';
import { Tab } from '@grafana/ui';
import React from 'react';

interface Props {
  resource: string;
  active: boolean;
  onChangeTab: (ev: React.MouseEvent<HTMLElement>) => void;
}

export function TabLogs({ resource, active, onChangeTab }: Props) {
  const variables = useVariables();
  const settingsVariable = variables.find((v) => v.state.name === 'logs');
  // @ts-expect-error
  const settings = settingsVariable?.state.text;

  if (
    settings ||
    resource === 'pod' ||
    resource === 'daemonset' ||
    resource === 'statefulset' ||
    resource === 'deployment' ||
    resource === 'job'
  ) {
    return <Tab label="Logs" active={active} onChangeTab={onChangeTab} />;
  }

  return <></>;
}
