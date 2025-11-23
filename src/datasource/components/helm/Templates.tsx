import React, { useState } from 'react';
import {
  CodeEditor,
  Combobox,
  ComboboxOption,
  Stack,
  useStyles2,
} from '@grafana/ui';
import AutoSizer from 'react-virtualized-auto-sizer';
import { css } from '@emotion/css';

import { Release } from '../../types/helm';

interface Props {
  release: Release | undefined;
}

export function Templates({ release }: Props) {
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

  const [selectedTemplate, setSelectedTemplate] = useState(0);

  if (!release?.chart?.templates || release.chart.templates.length === 0) {
    return null;
  }

  return (
    <Stack
      direction="column"
      gap={2}
      justifyContent="space-between"
      height="100%"
    >
      <div>
        <Combobox<number>
          value={selectedTemplate}
          options={release.chart.templates.map((template, index) => {
            return { label: template.name, value: index };
          })}
          onChange={(option: ComboboxOption<number>) =>
            setSelectedTemplate(option.value)
          }
        />
      </div>

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
                value={atob(release.chart!.templates![selectedTemplate].data)}
              />
            );
          }}
        </AutoSizer>
      </div>
    </Stack>
  );
}
