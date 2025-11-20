import React, { ReactNode } from 'react';
import { PanelChrome, Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

export function DefinitionItem({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <Stack direction="row">
      <Text element="span" variant="body">
        <strong>{label}:</strong>
      </Text>
      <Text element="span" variant="body">
        <Stack direction="row" wrap="wrap">
          {children}
        </Stack>
      </Text>
    </Stack>
  );
}

export function DefinitionList({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const styles = useStyles2(() => {
    return {
      content: css({
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        whiteSpace: 'pre-wrap',
      }),
    };
  });

  return (
    <PanelChrome title={title}>
      <div className={styles.content}>
        <Stack direction="column" columnGap={6}>
          {children}
        </Stack>
      </div>
    </PanelChrome>
  );
}

export function DefinitionLists({ children }: { children: ReactNode }) {
  return (
    <Stack direction="column" rowGap={3}>
      {children}
    </Stack>
  );
}
