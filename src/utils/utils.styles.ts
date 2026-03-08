import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';

export function getStyles(theme: GrafanaTheme2) {
  return {
    pluginPage: {
      title: {
        image: css({
          width: '32px',
          height: '32px',
          marginRight: '16px',
        }),
      },
      section: css({
        marginTop: theme.spacing(4),
      }),
    },
    list: css({
      listStyle: 'none',
      display: 'grid',
      gap: theme.spacing(1),
    }),
    modal: {
      body: css({
        marginTop: theme.spacing(2),
      }),
    },
    dashboard: {
      tabsBar: css({
        marginBottom: theme.spacing(2),
      }),
      header: {
        container: css({
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing(1),
          containerType: 'inline-size',
          flexWrap: 'wrap',
          h4: {
            margin: 0,
          },
        }),
        spacer: css({
          flex: 1,
        }),
      },
      row: {
        height100percent: css({
          height: '100%',
        }),
        height100px: css({
          display: 'flex',
          flexFlow: 'row',
          height: '100px',
          alignSelf: 'stretch',
          gap: theme.spacing(1),
          alignContent: 'baseline',
        }),
        height115px: css({
          display: 'flex',
          flexFlow: 'row',
          height: '115px',
          alignSelf: 'stretch',
          gap: theme.spacing(1),
          alignContent: 'baseline',
        }),
        height400px: css({
          display: 'flex',
          flexFlow: 'row',
          height: '400px',
          alignSelf: 'stretch',
          gap: theme.spacing(1),
          alignContent: 'baseline',
        }),
      },
    },
  };
}
