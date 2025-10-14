import React, { ReactNode } from 'react';
import { PanelChrome, Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

export function DefinitionItem(props: {
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <Stack direction="row">
      <Text element="span" variant="body">
        <strong>{props.label}:</strong>
      </Text>
      <Text element="span" variant="body">
        <Stack direction="row" wrap="wrap">
          {props.children}
        </Stack>
      </Text>
    </Stack>
  );
}

export function DefinitionList(props: { title: string; children: ReactNode }) {
  const styles = useStyles2(getStyles);

  return (
    <PanelChrome title={props.title}>
      <div className={styles.content}>
        <Stack direction="column" columnGap={6}>
          {props.children}
        </Stack>
      </div>
    </PanelChrome>
  );
}

export function DefinitionLists(props: { children: ReactNode }) {
  return (
    <Stack direction="column" rowGap={3}>
      {props.children}
    </Stack>
  );
}

const getStyles = () => {
  return {
    content: css({
      width: '100%',
      maxWidth: '100%',
      overflow: 'hidden',
      whiteSpace: 'pre-wrap',
    }),
  };
};
