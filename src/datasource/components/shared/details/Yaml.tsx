import React from 'react';
import { CodeEditor, Stack } from '@grafana/ui';
import YAML from 'yaml';
import AutoSizer from 'react-virtualized-auto-sizer';

interface Props {
  value: any;
}

export function Yaml({ value }: Props) {
  return (
    <Stack direction="column" height="100%">
      <AutoSizer>
        {({ width, height }) => {
          return (
            <CodeEditor
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
    </Stack>
  );
}
