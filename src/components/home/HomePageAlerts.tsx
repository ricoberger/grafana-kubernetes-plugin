import { VariableControl } from '@grafana/scenes-react';
import { Stack, useStyles2 } from '@grafana/ui';
import React from 'react';

import { getStyles } from '../../utils/utils.styles';
import { TableAlerts } from './TableAlerts';
import { TimeSeriesAlertsByNamespace } from './TimeSeriesAlertsByNamespace';
import { TimeSeriesAlertsBySeverity } from './TimeSeriesAlertsBySeverity';

export function HomePageAlerts() {
  const styles = useStyles2(getStyles);

  return (
    <Stack direction="column" gap={2}>
      <div className={styles.dashboard.header.container}>
        <VariableControl name="datasource" />
        <div className={styles.dashboard.header.spacer} />
      </div>
      <Stack direction="column" gap={2}>
        <div className={styles.dashboard.row.height400px}>
          <TimeSeriesAlertsBySeverity />
          <TimeSeriesAlertsByNamespace />
        </div>
        <div className={styles.dashboard.row.height400px}>
          <TableAlerts />
        </div>
      </Stack>
    </Stack>
  );
}
