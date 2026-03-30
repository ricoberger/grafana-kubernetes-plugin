import React, { useMemo, useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import {
  CodeEditor,
  Combobox,
  ComboboxOption,
  Stack,
  useStyles2,
} from '@grafana/ui';
import YAML from 'yaml';
import { css } from '@emotion/css';

import { Release } from '../../types/helm';
import { KubernetesManifest } from '../../types/kubernetes';

interface Props {
  namespace?: string;
  release: Release | undefined;
}

export function Manifests({ namespace, release }: Props) {
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
  const { manifests } = useMemo(() => {
    const parsedManifests: KubernetesManifest[] = [];

    try {
      if (release?.manifest) {
        const documents = YAML.parseAllDocuments(release?.manifest);
        for (const document of documents) {
          const jsonDocument = document.toJSON() as KubernetesManifest;
          parsedManifests.push(jsonDocument);
        }
      }
    } catch (_) { }

    return { manifests: parsedManifests };
  }, [release?.manifest]);

  return (
    <Stack
      direction="column"
      gap={2}
      justifyContent="space-between"
      height="100%"
    >
      <div></div>
      <div>
        <Combobox<number>
          value={selectedTemplate}
          options={manifests.map((manifest, index) => {
            return {
              label: `${manifest.metadata?.namespace || namespace}/${manifest.metadata?.name} (${manifest.kind})`,
              value: index,
            };
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
                value={YAML.stringify(manifests[selectedTemplate])}
              />
            );
          }}
        </AutoSizer>
      </div>
    </Stack>
  );
}
