import React, { ReactNode, useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Box,
  CodeEditor,
  Drawer,
  InteractiveTable,
  LoadingPlaceholder,
  Stack,
  Tab,
  TabsBar,
  Text,
  TextLink,
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
  V1Condition,
  V1ContainerPort,
  V1ContainerState,
  V1ContainerStatus,
  V1CronJob,
  V1EnvVar,
  V1EnvVarSource,
  V1DaemonSet,
  V1Deployment,
  V1DeploymentCondition,
  V1Job,
  V1JobCondition,
  V1LabelSelector,
  V1NodeCondition,
  V1OwnerReference,
  V1PersistentVolumeClaimCondition,
  V1Pod,
  V1PodCondition,
  V1Probe,
  V1ReplicaSetCondition,
  V1ReplicationControllerCondition,
  V1StatefulSet,
  V1StatefulSetCondition,
} from '@kubernetes/client-node';

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
import {
  formatTime,
  formatTimeString,
  timeDifference,
} from '../../../utils/utils.time';
import { KubernetesManifest } from '../../types/kubernetes';

initPluginTranslations('ricoberger-kubernetes-app');

interface Props {
  datasource?: string;
  resource?: string;
  namespace?: string;
  name?: string;
  onClose: () => void;
}

/**
 * The DetailsAction component renders a drawer with more details for a
 * Kubernetes resource.
 */
export function DetailsAction(props: Props) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [manifest, setManifest] = useState<KubernetesManifest>();

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
            {[
              'daemonsets',
              'deployments',
              'jobs',
              'nodes',
              'statefulsets',
            ].includes(props.resource || '') && (
                <Tab
                  label="Pods"
                  active={activeTab === 'pods'}
                  onChangeTab={(ev) => {
                    ev?.preventDefault();
                    setActiveTab('pods');
                  }}
                />
              )}
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
          {activeTab === 'pods' && (
            <DetailsActionPods {...props} manifest={manifest} />
          )}
        </>
      )}
    </Drawer>
  );
}

/**
 * The DetailsActionYaml component fetches and displays the YAML manifest of a
 * Kubernetes resource.
 */
function DetailsActionYaml(props: { manifest?: KubernetesManifest }) {
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
 * related to a Kubernetes resource.
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
 * The DetailsActionPods component fetches and displays the pods which are
 * related to a Kubernetes resource.
 */
interface DetailsActionPodsProps extends Props {
  manifest?: KubernetesManifest;
}

function DetailsActionPods(props: DetailsActionPodsProps) {
  /**
   * Create the selector which can be used to get the pods for all resources
   * except nodes. Therefore we check if the selector is defined in the query
   * and if not we use a different parameter name and value, to get the pods,
   * which are running on a node.
   */
  const selector = props.manifest?.spec?.selector?.matchLabels
    ? Object.keys(props.manifest?.spec.selector.matchLabels)
      .map(
        (key) => `${key}=${props.manifest?.spec.selector.matchLabels[key]}`,
      )
      .join(',')
    : '';

  const queryRunner = new SceneQueryRunner({
    datasource: {
      type: datasourcePluginJson.id,
      uid: props.datasource || undefined,
    },
    queries: [
      {
        refId: 'A',
        queryType: 'kubernetes-resources',
        resource: 'pods',
        namespace: selector ? props.namespace : '*',
        parameterName: selector ? 'labelSelector' : 'fieldSelector',
        parameterValue: selector
          ? selector
          : `spec.nodeName=${props.manifest?.metadata?.name}`,
      },
    ],
  });

  const scene = new EmbeddedScene({
    $data: queryRunner,
    body: new SceneFlexLayout({
      children: [
        new SceneFlexItem({
          body: PanelBuilders.table().setTitle('Pods').build(),
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
  manifest?: KubernetesManifest;
}

function DetailsActionOverview(props: DetailsActionOverviewProps) {
  return (
    <DefinitionLists>
      {props.manifest && (
        <DefinitionList title="Metadata">
          {props.name && (
            <DefinitionItem label="Name">{props.name}</DefinitionItem>
          )}
          {props.namespace && (
            <DefinitionItem label="Namespace">{props.namespace}</DefinitionItem>
          )}
          {props.manifest.metadata?.labels && (
            <DefinitionItem label="Labels">
              {Object.keys(props.manifest.metadata?.labels).map((key) => (
                <Badge
                  key={key}
                  color="darkgrey"
                  text={`${key}: ${props.manifest?.metadata?.labels![key]}`}
                />
              ))}
            </DefinitionItem>
          )}
          {props.manifest.metadata?.annotations && (
            <DefinitionItem label="Annotations">
              {Object.keys(props.manifest.metadata?.annotations).map((key) => (
                <Badge
                  key={key}
                  color="darkgrey"
                  text={`${key}: ${props.manifest?.metadata?.annotations![key]}`}
                />
              ))}
            </DefinitionItem>
          )}
          {props.manifest.metadata?.creationTimestamp && (
            <DefinitionItem label="Age">
              {timeDifference(
                new Date().getTime(),
                new Date(
                  /**
                   * The "lastTransitionTime" field in the condition is returned
                   * as string not date from the API. For that we have to call
                   * "toString()" to avoid type errors.
                   */
                  props.manifest.metadata.creationTimestamp.toString(),
                ).getTime(),
              )}{' '}
              (
              {formatTimeString(
                props.manifest?.metadata.creationTimestamp.toString(),
              )}
              )
            </DefinitionItem>
          )}
          {props.manifest.metadata?.ownerReferences && (
            <DefinitionItem label="Owner">
              {props.manifest.metadata?.ownerReferences.map(
                (owner: V1OwnerReference, index: number) => (
                  <Text key={index} element="span">
                    {owner.kind} ({owner.name})
                  </Text>
                ),
              )}
            </DefinitionItem>
          )}
        </DefinitionList>
      )}

      {props.manifest &&
        props.manifest.status &&
        props.manifest.status.conditions &&
        Array.isArray(props.manifest.status.conditions) ? (
        <Conditions conditions={props.manifest.status.conditions} />
      ) : null}

      {props.manifest && props.resource === 'cronjobs' && (
        <CronJob {...props} manifest={props.manifest as V1CronJob} />
      )}
      {props.manifest && props.resource === 'daemonsets' && (
        <DaemonSet {...props} manifest={props.manifest as V1DaemonSet} />
      )}
      {props.manifest && props.resource === 'deployments' && (
        <Deployment {...props} manifest={props.manifest as V1Deployment} />
      )}
      {props.manifest && props.resource === 'jobs' && (
        <Job {...props} manifest={props.manifest as V1Job} />
      )}
      {props.manifest && props.resource === 'pods' && (
        <Pod {...props} manifest={props.manifest as V1Pod} />
      )}
      {props.manifest && props.resource === 'statefulsets' && (
        <StatefulSet {...props} manifest={props.manifest as V1StatefulSet} />
      )}
    </DefinitionLists>
  );
}

type Condition =
  | V1Condition
  | V1DeploymentCondition
  | V1JobCondition
  | V1NodeCondition
  | V1PodCondition
  | V1PersistentVolumeClaimCondition
  | V1ReplicaSetCondition
  | V1ReplicationControllerCondition
  | V1StatefulSetCondition;

function Conditions(props: { conditions: Condition[] }) {
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
            ? /**
               * The "lastTransitionTime" field in the condition is returned as
               * string not date from the API. For that we have to call
               * "toString()" to avoid type errors.
               */
            formatTimeString(condition.lastTransitionTime.toString())
            : '-',
          reason: condition.reason || '-',
          message: condition.message || '-',
        }))}
      />
    </DefinitionList>
  );
}

function Selector(props: {
  datasource: string;
  namespace: string;
  selector: V1LabelSelector;
}) {
  return (
    <DefinitionItem label="Selector">
      {props.selector.matchLabels &&
        Object.keys(props.selector.matchLabels).map((key) => (
          <Badge
            key={key}
            color="darkgrey"
            text={
              <TextLink
                href={`/explore?schemaVersion=1&panes={"ncx":{"datasource":"${props.datasource}","queries":[{"queryType":"kubernetes-resources","namespace":"${props.namespace}","resource":"pods","parameterName":"labelSelector","parameterValue":"${key}=${props.selector.matchLabels ? props.selector.matchLabels[key] : ''}","wide":false,"refId":"A","datasource":{"type":"${datasourcePluginJson.id}","uid":"${props.datasource}"}}],"range":{"from":"now-1h","to":"now"}}}`}
                color="secondary"
                variant="bodySmall"
              >
                {key}=
                {props.selector.matchLabels
                  ? props.selector.matchLabels[key]
                  : ''}
              </TextLink>
            }
          />
        ))}
    </DefinitionItem>
  );
}

interface CronJobProps extends Props {
  manifest: V1CronJob;
}

function CronJob(props: CronJobProps) {
  return (
    <DefinitionList title="Details">
      <DefinitionItem label="Schedule">
        {props.manifest.spec?.schedule ? props.manifest.spec?.schedule : '-'}
      </DefinitionItem>
      <DefinitionItem label="Suspended">
        {props.manifest.spec?.suspend ? 'True' : 'False'}
      </DefinitionItem>
      <DefinitionItem label="History Limit">
        <Badge
          color="darkgrey"
          text={`success=${props.manifest.spec?.successfulJobsHistoryLimit ? props.manifest.spec?.successfulJobsHistoryLimit : 0}`}
        />
        <Badge
          color="darkgrey"
          text={`failed=${props.manifest.spec?.failedJobsHistoryLimit ? props.manifest.spec?.failedJobsHistoryLimit : 0}`}
        />
      </DefinitionItem>
      <DefinitionItem label="Active">
        {props.manifest.status?.active ? 'True' : 'False'}
      </DefinitionItem>
      {props.manifest.status?.lastScheduleTime && (
        <DefinitionItem label="Last Schedule">
          {timeDifference(
            new Date().getTime(),
            new Date(
              props.manifest.status.lastScheduleTime.toString(),
            ).getTime(),
          )}{' '}
          ({formatTime(new Date(props.manifest.status.lastScheduleTime))})
        </DefinitionItem>
      )}
    </DefinitionList>
  );
}

interface DaemonSetProps extends Props {
  manifest: V1DaemonSet;
}

function DaemonSet(props: DaemonSetProps) {
  return (
    <DefinitionList title="Details">
      <DefinitionItem label="Replicas">
        <Badge
          color="darkgrey"
          text={`${props.manifest.status?.desiredNumberScheduled ? props.manifest.status?.desiredNumberScheduled : 0} desired`}
        />
        <Badge
          color="darkgrey"
          text={`${props.manifest.status?.currentNumberScheduled ? props.manifest.status?.currentNumberScheduled : 0} current`}
        />
        <Badge
          color="darkgrey"
          text={`${props.manifest.status?.numberMisscheduled ? props.manifest.status?.numberMisscheduled : 0} misscheduled`}
        />
        <Badge
          color="darkgrey"
          text={`${props.manifest.status?.numberReady ? props.manifest.status?.numberReady : 0} ready`}
        />
        <Badge
          color="darkgrey"
          text={`${props.manifest.status?.updatedNumberScheduled ? props.manifest.status?.updatedNumberScheduled : 0} updated`}
        />
        <Badge
          color="darkgrey"
          text={`${props.manifest.status?.numberAvailable ? props.manifest.status?.numberAvailable : 0} available`}
        />
        <Badge
          color="darkgrey"
          text={`${props.manifest.status?.numberUnavailable ? props.manifest.status?.numberUnavailable : 0} unavailable`}
        />
      </DefinitionItem>
      {props.manifest.spec?.updateStrategy?.type && (
        <DefinitionItem label="Strategy">
          {props.manifest.spec.updateStrategy.type}
        </DefinitionItem>
      )}
      {props.datasource && props.namespace && props.manifest.spec?.selector && (
        <Selector
          datasource={props.datasource}
          namespace={props.namespace}
          selector={props.manifest.spec.selector}
        />
      )}
    </DefinitionList>
  );
}

interface DeploymentProps extends Props {
  manifest: V1Deployment;
}

function Deployment(props: DeploymentProps) {
  return (
    <DefinitionList title="Details">
      <DefinitionItem label="Replicas">
        <Badge
          color="darkgrey"
          text={`${props.manifest.status?.replicas ? props.manifest.status?.replicas : 0} desired`}
        />
        <Badge
          color="darkgrey"
          text={`${props.manifest.status?.updatedReplicas ? props.manifest.status?.updatedReplicas : 0} updated`}
        />
        <Badge
          color="darkgrey"
          text={`${props.manifest.status?.readyReplicas ? props.manifest.status?.readyReplicas : 0} ready`}
        />
        <Badge
          color="darkgrey"
          text={`${props.manifest.status?.availableReplicas ? props.manifest.status?.availableReplicas : 0} available`}
        />
        <Badge
          color="darkgrey"
          text={`${props.manifest.status?.unavailableReplicas ? props.manifest.status?.unavailableReplicas : 0} unavailable`}
        />
      </DefinitionItem>
      {props.manifest.spec?.strategy?.type && (
        <DefinitionItem label="Strategy">
          {props.manifest.spec.strategy.type}
        </DefinitionItem>
      )}
      {props.datasource && props.namespace && props.manifest.spec?.selector && (
        <Selector
          datasource={props.datasource}
          namespace={props.namespace}
          selector={props.manifest.spec.selector}
        />
      )}
    </DefinitionList>
  );
}

interface JobProps extends Props {
  manifest: V1Job;
}

function Job(props: JobProps) {
  return (
    <DefinitionList title="Details">
      <DefinitionItem label="Completions">
        {props.manifest.spec?.completions
          ? props.manifest.spec?.completions
          : 0}
      </DefinitionItem>
      <DefinitionItem label="Backoff Limit">
        {props.manifest.spec?.backoffLimit
          ? props.manifest.spec?.backoffLimit
          : 0}
      </DefinitionItem>
      <DefinitionItem label="Active">
        {props.manifest.status?.active ? 'True' : 'False'}
      </DefinitionItem>
      <DefinitionItem label="Status">
        <Badge
          color="darkgrey"
          text={`succeeded=${props.manifest.status?.succeeded ? props.manifest.status?.succeeded : 0}`}
        />
        <Badge
          color="darkgrey"
          text={`failed=${props.manifest.status?.failed ? props.manifest.status?.failed : 0}`}
        />
      </DefinitionItem>
      {props.datasource && props.namespace && props.manifest.spec?.selector && (
        <Selector
          datasource={props.datasource}
          namespace={props.namespace}
          selector={props.manifest.spec.selector}
        />
      )}
    </DefinitionList>
  );
}

interface StatefulSetProps extends Props {
  manifest: V1StatefulSet;
}

function StatefulSet(props: StatefulSetProps) {
  return (
    <DefinitionList title="Details">
      <DefinitionItem label="Replicas">
        <Badge
          color="darkgrey"
          text={`${props.manifest.status?.replicas ? props.manifest.status?.replicas : 0} desired`}
        />
        <Badge
          color="darkgrey"
          text={`${props.manifest.status?.currentReplicas ? props.manifest.status?.currentReplicas : 0} current`}
        />
        <Badge
          color="darkgrey"
          text={`${props.manifest.status?.readyReplicas ? props.manifest.status?.readyReplicas : 0} ready`}
        />
        <Badge
          color="darkgrey"
          text={`${props.manifest.status?.updatedReplicas ? props.manifest.status?.updatedReplicas : 0} updated`}
        />
      </DefinitionItem>
      {props.manifest.spec?.updateStrategy?.type && (
        <DefinitionItem label="Strategy">
          {props.manifest.spec.updateStrategy.type}
        </DefinitionItem>
      )}
      {props.datasource && props.namespace && props.manifest.spec?.selector && (
        <Selector
          datasource={props.datasource}
          namespace={props.namespace}
          selector={props.manifest.spec.selector}
        />
      )}
    </DefinitionList>
  );
}

interface PodProps extends Props {
  manifest: V1Pod;
}

function Pod(props: PodProps) {
  const phase =
    props.manifest.status && props.manifest.status.phase
      ? props.manifest.status.phase
      : 'Unknown';
  let reason =
    props.manifest.status && props.manifest.status.reason
      ? props.manifest.status.reason
      : '';
  let shouldReady = 0;
  let isReady = 0;
  let restarts = 0;

  if (props.manifest.status && props.manifest.status.containerStatuses) {
    for (const container of props.manifest.status.containerStatuses) {
      shouldReady = shouldReady + 1;
      if (container.ready) {
        isReady = isReady + 1;
      }

      restarts = restarts + container.restartCount;

      if (container.state && container.state.waiting) {
        reason = container.state.waiting.reason
          ? container.state.waiting.reason
          : '';
        break;
      }

      if (container.state && container.state.terminated) {
        reason = container.state.terminated.reason
          ? container.state.terminated.reason
          : '';
        break;
      }
    }
  }

  return (
    <>
      <DefinitionList title="Details">
        <DefinitionItem label="Ready">
          {isReady}/{shouldReady}
        </DefinitionItem>
        <DefinitionItem label="Restarts">{restarts}</DefinitionItem>
        <DefinitionItem label="Status">
          {reason ? reason : phase}
        </DefinitionItem>
        <DefinitionItem label="Priority Class">
          {props.manifest.spec && props.manifest.spec.priorityClassName
            ? props.manifest.spec.priorityClassName
            : '-'}
        </DefinitionItem>
        <DefinitionItem label="QoS Class">
          {props.manifest.status && props.manifest.status.qosClass
            ? props.manifest.status.qosClass
            : '-'}
        </DefinitionItem>
        <DefinitionItem label="Node">
          {props.manifest.spec?.nodeName ? (
            <TextLink
              href={`/explore?schemaVersion=1&panes={"ncx":{"datasource":"${props.datasource}","queries":[{"queryType":"kubernetes-resources","namespace":"${props.namespace}","resource":"nodes","parameterName":"fieldSelector","parameterValue":"metadata.name=${props.manifest.spec.nodeName}","wide":false,"refId":"A","datasource":{"type":"${datasourcePluginJson.id}","uid":"${props.datasource}"}}],"range":{"from":"now-1h","to":"now"}}}`}
              color="secondary"
              variant="body"
            >
              {props.manifest.spec.nodeName}
            </TextLink>
          ) : (
            '-'
          )}
        </DefinitionItem>
      </DefinitionList>

      <DefinitionList title="Containers">
        <InteractiveTable
          getRowId={(r) => r.id}
          columns={[
            {
              id: 'name',
              header: 'Name',
            },
            {
              id: 'ready',
              header: 'Ready',
            },
            {
              id: 'restarts',
              header: 'Restarts',
            },
            {
              id: 'status',
              header: 'Status',
            },
          ]}
          data={[
            ...(props.manifest.spec?.initContainers || []),
            ...(props.manifest.spec?.containers || []),
          ].map((container) => {
            const containerStatus = getContainerStatus(container.name, [
              ...(props.manifest.status?.initContainerStatuses || []),
              ...(props.manifest.status?.containerStatuses || []),
            ]);

            return {
              id: container.name,
              name: container.name,
              ready:
                containerStatus && containerStatus.ready ? 'True' : 'False',
              restarts: containerStatus ? containerStatus.restartCount : 0,
              status:
                containerStatus && containerStatus.state
                  ? getContainerState(containerStatus.state)
                  : '-',
              container: container,
              containerStatus: containerStatus,
            };
          })}
          renderExpandedRow={(row) => (
            <DefinitionList title="Details">
              {row.containerStatus && row.containerStatus.state && (
                <DefinitionItem label="State">
                  {getContainerState(row.containerStatus.state)}
                </DefinitionItem>
              )}
              {row.containerStatus && row.containerStatus.lastState && (
                <DefinitionItem label="Last State">
                  {getContainerState(row.containerStatus.lastState)}
                </DefinitionItem>
              )}
              <DefinitionItem label="Image">
                {row.container.image}
              </DefinitionItem>
              <DefinitionItem label="Resources">
                <Stack direction="column" rowGap={0}>
                  {row.container.resources &&
                    row.container.resources.requests && (
                      <>
                        <Box>
                          CPU Requests:{' '}
                          {row.container.resources.requests.cpu
                            ? row.container.resources.requests.cpu
                            : '-'}
                        </Box>
                        <Box>
                          Memory Requests:{' '}
                          {row.container.resources.requests.memory
                            ? row.container.resources.requests.memory
                            : '-'}
                        </Box>
                      </>
                    )}
                  {row.container.resources &&
                    row.container.resources.limits && (
                      <>
                        <Box>
                          CPU Limits:{' '}
                          {row.container.resources.limits.cpu
                            ? row.container.resources.limits.cpu
                            : '-'}
                        </Box>
                        <Box>
                          Memory Limits:{' '}
                          {row.container.resources.limits.memory
                            ? row.container.resources.limits.memory
                            : '-'}
                        </Box>
                      </>
                    )}
                </Stack>
              </DefinitionItem>
              {row.container.command && (
                <DefinitionItem label="Command">
                  {row.container.command.map((command: string) => (
                    <Badge key={command} color="darkgrey" text={command} />
                  ))}
                </DefinitionItem>
              )}
              {row.container.args && (
                <DefinitionItem label="Args">
                  {row.container.args.map((arg: string) => (
                    <Badge key={arg} color="darkgrey" text={arg} />
                  ))}
                </DefinitionItem>
              )}
              {row.container.ports && (
                <DefinitionItem label="Ports">
                  <Stack direction="column" rowGap={0}>
                    {row.container.ports.map(
                      (port: V1ContainerPort, index: number) => (
                        <Box key={index}>
                          {port.containerPort}
                          {port.protocol ? `/${port.protocol}` : ''}
                          {port.name ? ` (${port.name})` : ''}
                        </Box>
                      ),
                    )}
                  </Stack>
                </DefinitionItem>
              )}
              {row.container.env && (
                <DefinitionItem label="Environment">
                  <Stack direction="column" rowGap={0}>
                    {row.container.env.map((env: V1EnvVar, index: number) => (
                      <Box key={index}>
                        {env.name}:{' '}
                        {env.value
                          ? env.value
                          : env.valueFrom
                            ? getValueFrom(env.valueFrom)
                            : '-'}
                      </Box>
                    ))}
                  </Stack>
                </DefinitionItem>
              )}
              {row.container.livenessProbe &&
                getProbe('Liveness Probe', row.container.livenessProbe)}
              {row.container.readinessProbe &&
                getProbe('Readiness Probe', row.container.readinessProbe)}
              {row.container.startupProbe &&
                getProbe('Startup Probe', row.container.startupProbe)}
            </DefinitionList>
          )}
        />
      </DefinitionList>
    </>
  );
}

const getProbe = (title: string, probe: V1Probe): ReactNode => {
  return (
    <DefinitionItem label={title}>
      {probe.exec && (
        <>
          <Badge color="darkgrey" text="exec" />
          {probe.exec.command && (
            <Badge color="darkgrey" text={probe.exec.command?.join(' ')} />
          )}
        </>
      )}
      {probe.httpGet && (
        <>
          <Badge color="darkgrey" text="httpGet" />
          {probe.httpGet.scheme && (
            <Badge
              color="darkgrey"
              text={`scheme=${probe.httpGet.scheme?.toLowerCase()}`}
            />
          )}
          {probe.httpGet.host && (
            <Badge color="darkgrey" text={`host=${probe.httpGet.host}`} />
          )}
          {probe.httpGet.port && (
            <Badge color="darkgrey" text={`port=${probe.httpGet.port}`} />
          )}
          {probe.httpGet.path && (
            <Badge color="darkgrey" text={`path=${probe.httpGet.path}`} />
          )}
        </>
      )}
      {probe.tcpSocket && (
        <>
          <Badge color="darkgrey" text="tcpSocket" />
          {probe.tcpSocket.port && (
            <Badge color="darkgrey" text={`port=${probe.tcpSocket.port}`} />
          )}
        </>
      )}
      {probe.initialDelaySeconds && (
        <Badge color="darkgrey" text={`delay=${probe.initialDelaySeconds}s`} />
      )}
      {probe.timeoutSeconds && (
        <Badge color="darkgrey" text={`timeout=${probe.timeoutSeconds}s`} />
      )}
      {probe.periodSeconds && (
        <Badge color="darkgrey" text={`period=${probe.periodSeconds}s`} />
      )}
      {probe.successThreshold && (
        <Badge color="darkgrey" text={`#success=${probe.successThreshold}`} />
      )}
      {probe.failureThreshold && (
        <Badge color="darkgrey" text={`#failure=${probe.failureThreshold}`} />
      )}
    </DefinitionItem>
  );
};

/**
 * `getContainerStatus` returns the container status for the container with the
 * provided `name` form a list of `status`.
 */
export const getContainerStatus = (
  name: string,
  status?: V1ContainerStatus[],
): V1ContainerStatus | undefined => {
  if (!status) {
    return undefined;
  }

  for (const s of status) {
    if (s.name === name) {
      return s;
    }
  }

  return undefined;
};

/**
 * `getContainerState` formates the provided container state.
 */
export const getContainerState = (state: V1ContainerState): string => {
  if (state?.running) {
    return `Started at ${state?.running?.startedAt}`;
  } else if (state?.waiting) {
    return state?.waiting?.message
      ? `Waiting: ${state?.waiting?.message}`
      : 'Waiting';
  } else if (state?.terminated) {
    return `Terminated with ${state?.terminated?.exitCode} at ${state?.terminated?.finishedAt}: ${state?.terminated?.reason}`;
  }

  return 'Indeterminate';
};

/**
 * `getValueFrom` formates the `valueFrom` property for our UI.
 */
export const getValueFrom = (valueFrom: V1EnvVarSource): string => {
  if (valueFrom.configMapKeyRef) {
    return `configMapKeyRef(${valueFrom.configMapKeyRef.name}: ${valueFrom.configMapKeyRef.key})`;
  }

  if (valueFrom.fieldRef) {
    return `fieldRef(${valueFrom.fieldRef.apiVersion}: ${valueFrom.fieldRef.fieldPath})`;
  }

  if (valueFrom.secretKeyRef) {
    return `secretKeyRef(${valueFrom.secretKeyRef.name}: ${valueFrom.secretKeyRef.key})`;
  }

  return '-';
};
