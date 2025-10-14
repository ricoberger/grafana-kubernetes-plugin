import React, { useEffect, useState } from 'react';
import {
  Alert,
  CodeEditor,
  Collapse,
  Drawer,
  LoadingPlaceholder,
  Stack,
  Tab,
  TabsBar,
} from '@grafana/ui';
import YAML from 'yaml';
import AutoSizer from 'react-virtualized-auto-sizer';
import {
  EmbeddedScene,
  PanelBuilders,
  SceneFlexItem,
  SceneFlexLayout,
  SceneQueryRunner,
} from '@grafana/scenes';
import { initPluginTranslations } from '@grafana/i18n';

import datasourcePluginJson from '../../../datasource/plugin.json';
import { Release } from './types';
import {
  DefinitionItem,
  DefinitionList,
  DefinitionLists,
} from '../DefinitionList/DefinitionList';
import { formatTimeString } from '../../../utils/utils.time';

initPluginTranslations('ricoberger-kubernetes-app');

interface Props {
  datasource?: string;
  namespace?: string;
  name?: string;
  version?: number;
  onClose: () => void;
}

/**
 * The DetailsAction component renders a drawer with more details for a
 * Helm release.
 */
export function DetailsAction(props: Props) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [release, setRelease] = useState<Release>();

  /**
   * Fetch the Helm release, which is identified by the "datasource",
   * "namespace" and "name" and "version". The fetched released is saved in the
   * "release" state.
   */
  useEffect(() => {
    const fetchRelease = async () => {
      try {
        setIsLoading(true);

        const response = await fetch(
          `/api/datasources/uid/${props.datasource}/resources/helm/${props.namespace}/${props.name}/${props.version}`,
          {
            method: 'get',
            headers: {
              Accept: 'application/json, */*',
              'Content-Type': 'application/json',
            },
          },
        );
        if (!response.ok) {
          throw new Error(await response.text());
        }

        setRelease(await response.json());
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchRelease();
  }, [props.datasource, props.namespace, props.name, props.version]);

  return (
    <Drawer
      title="Details"
      scrollableContent={true}
      onClose={() => props.onClose()}
      tabs={
        !isLoading &&
        !error && (
          <TabsBar>
            <Tab
              label="Overview"
              active={activeTab === 'overview'}
              onChangeTab={(ev) => {
                ev?.preventDefault();
                setActiveTab('overview');
              }}
            />
            <Tab
              label="History"
              active={activeTab === 'history'}
              onChangeTab={(ev) => {
                ev?.preventDefault();
                setActiveTab('history');
              }}
            />
            <Tab
              label="Values"
              active={activeTab === 'values'}
              onChangeTab={(ev) => {
                ev?.preventDefault();
                setActiveTab('values');
              }}
            />
            <Tab
              label="Default Values"
              active={activeTab === 'defaultvalues'}
              onChangeTab={(ev) => {
                ev?.preventDefault();
                setActiveTab('defaultvalues');
              }}
            />
            <Tab
              label="Templates"
              active={activeTab === 'templates'}
              onChangeTab={(ev) => {
                ev?.preventDefault();
                setActiveTab('templates');
              }}
            />
          </TabsBar>
        )
      }
    >
      {isLoading ? (
        <LoadingPlaceholder text="Loading release..." />
      ) : error ? (
        <Alert
          severity="error"
          title={`Failed to load ${props.namespace}/${props.name}`}
        >
          {error}
        </Alert>
      ) : (
        <>
          {activeTab === 'overview' && (
            <DetailsActionOverview {...props} release={release} />
          )}
          {activeTab === 'history' && <DetailsActionHistory {...props} />}
          {activeTab === 'values' && <DetailsActionValues release={release} />}
          {activeTab === 'defaultvalues' && (
            <DetailsActionDefaultValues release={release} />
          )}
          {activeTab === 'templates' && (
            <DetailsActionTemplates release={release} />
          )}
        </>
      )}
    </Drawer>
  );
}

/**
 * The DetailsActionOverview component renders an overview of the with the most
 * important information of the Helm release.
 */
interface DetailsActionOverviewProps extends Props {
  release: Release | undefined;
}

function DetailsActionOverview(props: DetailsActionOverviewProps) {
  return (
    <DefinitionLists>
      <DefinitionList title="Details">
        <DefinitionItem label="Name">
          {props.release?.name || '-'}
        </DefinitionItem>
        <DefinitionItem label="Namespace">
          {props.release?.namespace || '-'}
        </DefinitionItem>
        <DefinitionItem label="Version">
          {props.release?.version || '-'}
        </DefinitionItem>
        <DefinitionItem label="Status">
          {props.release?.info?.status || '-'}
        </DefinitionItem>
        <DefinitionItem label="Description">
          {props.release?.info?.description || '-'}
        </DefinitionItem>
        <DefinitionItem label="First Deployed">
          {props.release?.info?.first_deployed
            ? formatTimeString(props.release?.info.first_deployed)
            : '-'}
        </DefinitionItem>
        <DefinitionItem label="Last Deployed">
          {props.release?.info?.last_deployed
            ? formatTimeString(props.release?.info.last_deployed)
            : '-'}
        </DefinitionItem>
        <DefinitionItem label="Notes">
          {props.release?.info?.notes || '-'}
        </DefinitionItem>
      </DefinitionList>
    </DefinitionLists>
  );
}

/**
 * The DetailsActionHistory component fetches and displays the history for a
 * Helm release.
 */
function DetailsActionHistory(props: Props) {
  const queryRunner = new SceneQueryRunner({
    datasource: {
      type: datasourcePluginJson.id,
      uid: props.datasource || undefined,
    },
    queries: [
      {
        refId: 'A',
        queryType: 'helm-release-history',
        namespace: props.namespace,
        name: props.name,
      },
    ],
  });

  const scene = new EmbeddedScene({
    $data: queryRunner,
    body: new SceneFlexLayout({
      children: [
        new SceneFlexItem({
          body: PanelBuilders.table().setTitle('History').build(),
        }),
      ],
    }),
  });

  return <scene.Component model={scene} />;
}

/**
 * The DetailsActionValues component renders the user applied values of the Helm
 * release.
 */
function DetailsActionValues(props: { release: Release | undefined }) {
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
              value={YAML.stringify(props.release?.config)}
            />
          );
        }}
      </AutoSizer>
    </Stack>
  );
}

/**
 * The DetailsActionDefaultValues component renders the default values of the
 * Helm chart.
 */
function DetailsActionDefaultValues(props: { release: Release | undefined }) {
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
              value={YAML.stringify(props.release?.chart?.values)}
            />
          );
        }}
      </AutoSizer>
    </Stack>
  );
}

/**
 * The DetailsActionTemplates component renders the templates of the Helm chart.
 */
function DetailsActionTemplates(props: { release: Release | undefined }) {
  const [selectedTemplate, setSelectedTemplate] = useState(-1);

  return (
    <Stack direction="column" height="100%">
      {props.release?.chart?.templates?.map((template, index) => (
        <Collapse
          key={template.name}
          label={template.name}
          isOpen={selectedTemplate === index}
          onToggle={() =>
            setSelectedTemplate(selectedTemplate === index ? -1 : index)
          }
        >
          <CodeEditor
            width="100%"
            height="250px"
            language="yaml"
            showLineNumbers={true}
            showMiniMap={true}
            readOnly={true}
            value={atob(template.data)}
          />
        </Collapse>
      ))}
    </Stack>
  );
}
