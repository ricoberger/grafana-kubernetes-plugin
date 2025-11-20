import React, { useState } from 'react';
import { Box, CodeEditor, Combobox, ComboboxOption, Stack } from '@grafana/ui';
import AutoSizer from 'react-virtualized-auto-sizer';

import { Release } from '../../types/helm';

interface Props {
  release: Release | undefined;
}

export function Templates({ release }: Props) {
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

      <Box height="100%">
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
                value={atob(release.chart!.templates![selectedTemplate].data)}
              />
            );
          }}
        </AutoSizer>
      </Box>
    </Stack>
  );
}
