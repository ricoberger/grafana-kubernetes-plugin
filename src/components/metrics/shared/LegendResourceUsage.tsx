import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

export function LegendResourceUsage() {
  const styles = useStyles2((theme: GrafanaTheme2) => {
    return {
      container: css({
        display: 'flex',
        gap: theme.spacing(2),
        alignItems: 'center',
        flexWrap: 'wrap',
      }),
      low: css({
        display: 'flex',
        WebkitBoxAlign: 'center',
        alignItems: 'center',
        gap: '8px',
        color: theme.visualization.getColorByName('orange'),
      }),
      med: css({
        display: 'flex',
        WebkitBoxAlign: 'center',
        alignItems: 'center',
        gap: '8px',
        color: theme.visualization.getColorByName('green'),
      }),
      high: css({
        display: 'flex',
        WebkitBoxAlign: 'center',
        alignItems: 'center',
        gap: '8px',
        color: theme.visualization.getColorByName('red'),
      }),
      icon: {
        container: css({
          display: 'flex',
          WebkitBoxAlign: 'center',
          alignItems: 'center',
          gap: '8px',
          width: 'max-content',
        }),
        containerInner: css({
          width: '10px',
          height: '10px',
          position: 'relative',
        }),
        border: css({
          width: '100%',
          height: '100%',
          backgroundColor: 'transparent',
          position: 'relative',
          borderWidth: 'medium 1px 1px',
          borderStyle: 'none solid solid',
          borderColor: `currentcolor ${theme.colors.text.primary} ${theme.colors.text.primary}`,
          borderImage: 'none',
        }),
        inner: css({
          position: 'absolute',
          bottom: '1px',
          left: '1px',
          width: 'calc(100% - 2px)',
          backgroundColor: 'rgb(204, 204, 220)',
        }),
      },
    };
  });

  const renderIcon = (percent: number) => {
    return (
      <div className={styles.icon.container}>
        <div className={styles.icon.containerInner}>
          <div className={styles.icon.border}>
            <div
              className={styles.icon.inner}
              style={{ height: `calc(${percent}% - 2px)` }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <span>Resource usage: </span>
      <Tooltip content="Usage is under 60% (underutilized)">
        <div className={styles.low}>
          {renderIcon(35)}
          <span>low</span>
        </div>
      </Tooltip>
      <Tooltip content="Usage is between 60% and 90% (well utilized)">
        <div className={styles.med}>
          {renderIcon(70)}
          <span>med</span>
        </div>
      </Tooltip>
      <Tooltip content="Usage is over 90% (overutilized)">
        <div className={styles.high}>
          {renderIcon(97)}
          <span>high</span>
        </div>
      </Tooltip>
    </div>
  );
}
