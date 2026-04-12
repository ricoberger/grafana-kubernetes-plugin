import { css } from '@emotion/css';
import { CodeEditor, Stack, useStyles2 } from '@grafana/ui';
import React from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import YAML from 'yaml';

interface Props {
  value: any;
}

export function Yaml({ value }: Props) {
  const styles = useStyles2(() => {
    return {
      editorWrapper: css({
        flex: 1,
      }),
      editorContainer: css({
        width: 'fit-content',
        border: 'none',
      }),
    };
  });

  return (
    <Stack direction="column" height="100%">
      <div className={styles.editorWrapper}>
        <AutoSizer>
          {({ width, height }) => {
            return (
              <CodeEditor
                containerStyles={styles.editorContainer}
                width={width}
                height={height}
                language="yaml"
                showLineNumbers={true}
                showMiniMap={true}
                readOnly={true}
                value={YAML.stringify(value)}
              />
            );
          }}
        </AutoSizer>
      </div>
    </Stack>
  );
}
