import React, { useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  CodeEditor,
  Drawer,
  InteractiveTable,
  LoadingPlaceholder,
  Stack,
  Tab,
  TabsBar,
  Text,
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

import {
  getResource,
  getResourceManifest,
} from '../../../utils/utils.resource';
import datasourcePluginJson from '../../../datasource/plugin.json';
import {
  DefinitionItem,
  DefinitionList,
  DefinitionLists,
} from '../DefinitionList/DefinitionList';
import { formatTimeString, timeDifference } from '../../../utils/utils.time';

initPluginTranslations('ricoberger-kubernetes-app');

interface Props {
  datasource?: string;
  resource?: string;
  namespace?: string;
  name?: string;
  onClose: () => void;
}

/**
 * The DetailsAction component renders a drawer with more details for a Flux
 * resource.
 */
export function DetailsAction(props: Props) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [manifest, setManifest] = useState<any>();

  /**
   * Fetch the manifest of the reqources, which is identified by the
   * "datasource", "resource", "namespace" and "name". The fetched manifest is
   * saved in the "manifest" state (JSON object).
   */
  useEffect(() => {
    const fetchManifest = async () => {
      try {
        setIsLoading(true);

        const resource = await getResource(props.datasource, props.resource);
        const manifest = await getResourceManifest(
          props.datasource,
          resource,
          props.namespace,
          props.name,
        );
        setManifest(manifest);
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

    fetchManifest();
  }, [props.datasource, props.resource, props.namespace, props.name]);

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
              label="Yaml"
              active={activeTab === 'yaml'}
              onChangeTab={(ev) => {
                ev?.preventDefault();
                setActiveTab('yaml');
              }}
            />
            <Tab
              label="Events"
              active={activeTab === 'events'}
              onChangeTab={(ev) => {
                ev?.preventDefault();
                setActiveTab('events');
              }}
            />
          </TabsBar>
        )
      }
    >
      {isLoading ? (
        <LoadingPlaceholder text="Loading resource..." />
      ) : error ? (
        <Alert
          severity="error"
          title={`Failed to load ${props.namespace ? `${props.namespace}/${props.name}` : props.name}`}
        >
          {error}
        </Alert>
      ) : (
        <>
          {activeTab === 'overview' && (
            <DetailsActionOverview {...props} manifest={manifest} />
          )}
          {activeTab === 'yaml' && <DetailsActionYaml manifest={manifest} />}
          {activeTab === 'events' && <DetailsActionEvents {...props} />}
        </>
      )}
    </Drawer>
  );
}

/**
 * The DetailsActionYaml component fetches and displays the YAML manifest of a
 * Flux resource.
 */
function DetailsActionYaml(props: { manifest: any }) {
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
              value={YAML.stringify(props.manifest)}
            />
          );
        }}
      </AutoSizer>
    </Stack>
  );
}

/**
 * The DetailsActionEvents component fetches and displays the events which are
 * related to a Flux resource.
 */
function DetailsActionEvents(props: Props) {
  const queryRunner = new SceneQueryRunner({
    datasource: {
      type: datasourcePluginJson.id,
      uid: props.datasource || undefined,
    },
    queries: [
      {
        refId: 'A',
        queryType: 'kubernetes-resources',
        resource: 'events',
        namespace: props.namespace || '*',
        parameterName: 'fieldSelector',
        parameterValue: `involvedObject.name=${props.name}`,
      },
    ],
  });

  const scene = new EmbeddedScene({
    $data: queryRunner,
    body: new SceneFlexLayout({
      children: [
        new SceneFlexItem({
          body: PanelBuilders.table().setTitle('Events').build(),
        }),
      ],
    }),
  });

  return <scene.Component model={scene} />;
}

/**
 * The DetailsActionOverview component renders an overview of the with the most
 * important information of the Kubernetes resource.
 */
interface DetailsActionOverviewProps extends Props {
  manifest: any;
}

function DetailsActionOverview(props: DetailsActionOverviewProps) {
  return (
    <DefinitionLists>
      <DefinitionList title="Metadata">
        {props.name && (
          <DefinitionItem label="Name">{props.name}</DefinitionItem>
        )}
        {props.namespace && (
          <DefinitionItem label="Namespace">{props.namespace}</DefinitionItem>
        )}
        {props.manifest?.metadata?.labels && (
          <DefinitionItem label="Labels">
            {Object.keys(props.manifest?.metadata?.labels).map((key) => (
              <Badge
                key={key}
                color="darkgrey"
                text={`${key}: ${props.manifest?.metadata?.labels[key]}`}
              />
            ))}
          </DefinitionItem>
        )}
        {props.manifest?.metadata?.annotations && (
          <DefinitionItem label="Annotations">
            {Object.keys(props.manifest?.metadata?.annotations).map((key) => (
              <Badge
                key={key}
                color="darkgrey"
                text={`${key}: ${props.manifest?.metadata?.annotations[key]}`}
              />
            ))}
          </DefinitionItem>
        )}
        {props.manifest?.metadata?.creationTimestamp && (
          <DefinitionItem label="Age">
            {timeDifference(
              new Date().getTime(),
              new Date(
                props.manifest.metadata.creationTimestamp.toString(),
              ).getTime(),
            )}{' '}
            ({formatTimeString(props.manifest.metadata.creationTimestamp)})
          </DefinitionItem>
        )}
        {props.manifest?.metadata?.ownerReferences && (
          <DefinitionItem label="Owner">
            {props.manifest?.metadata?.ownerReferences.map(
              (owner: any, index: number) => (
                <Text key={index} element="span">
                  {owner.kind} ({owner.name})
                </Text>
              ),
            )}
          </DefinitionItem>
        )}
      </DefinitionList>

      {props.manifest &&
        props.manifest.status &&
        props.manifest.status.conditions &&
        Array.isArray(props.manifest.status.conditions) ? (
        <Conditions conditions={props.manifest.status.conditions} />
      ) : null}
    </DefinitionLists>
  );
}

function Conditions(props: { conditions: any[] }) {
  return (
    <DefinitionList title="Conditions">
      <InteractiveTable
        getRowId={(r) => r.id}
        columns={[
          {
            id: 'type',
            header: 'Type',
          },
          {
            id: 'status',
            header: 'Status',
          },
          {
            id: 'lastTransitionTime',
            header: 'Last Transition Time',
          },
          {
            id: 'reason',
            header: 'Reason',
          },
          {
            id: 'message',
            header: 'Message',
          },
        ]}
        data={props.conditions.map((condition) => ({
          id: condition.type,
          status: condition.status,
          type: condition.type,
          lastTransitionTime: condition.lastTransitionTime
            ? formatTimeString(condition.lastTransitionTime)
            : '-',
          reason: condition.reason || '-',
          message: condition.message || '-',
        }))}
      />
    </DefinitionList>
  );
}
