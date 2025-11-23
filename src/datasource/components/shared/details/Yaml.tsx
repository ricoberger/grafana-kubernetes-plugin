import React from 'react';
import { CodeEditor, Stack, useStyles2 } from '@grafana/ui';
import YAML from 'yaml';
import AutoSizer from 'react-virtualized-auto-sizer';
import { css } from '@emotion/css';

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
