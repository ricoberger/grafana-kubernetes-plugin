import React, { ReactNode, useMemo, useState } from 'react';
import {
  V1ContainerPort,
  V1ContainerState,
  V1ContainerStatus,
  V1EnvVar,
  V1EnvVarSource,
  V1Pod,
  V1Probe,
} from '@kubernetes/client-node';
import { Badge, Box, InteractiveTable, Stack } from '@grafana/ui';

import {
  DefinitionList,
  DefinitionItem,
} from '../../shared/definitionlist/DefinitionList';
import { Resources } from '../../shared/details/Resources';

interface Props {
  datasource?: string;
  namespace?: string;
  manifest: V1Pod;
}

export function Pod({ datasource, namespace, manifest }: Props) {
  const [selectedNode, setSelectedNode] = useState<string>('');

  const { phase, reason, isReady, shouldReady, restarts } = useMemo(() => {
    const phase =
      manifest.status && manifest.status.phase
        ? manifest.status.phase
        : 'Unknown';
    let reason =
      manifest.status && manifest.status.reason ? manifest.status.reason : '';
    let shouldReady = 0;
    let isReady = 0;
    let restarts = 0;

    if (manifest.status && manifest.status.containerStatuses) {
      for (const container of manifest.status.containerStatuses) {
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

    return { phase, reason, isReady, shouldReady, restarts };
  }, [manifest]);

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
          {manifest.spec && manifest.spec.priorityClassName
            ? manifest.spec.priorityClassName
            : '-'}
        </DefinitionItem>
        <DefinitionItem label="QoS Class">
          {manifest.status && manifest.status.qosClass
            ? manifest.status.qosClass
            : '-'}
        </DefinitionItem>
        <DefinitionItem label="Node">
          {manifest.spec?.nodeName ? (
            <Badge
              color="blue"
              onClick={() => setSelectedNode(manifest.spec!.nodeName!)}
              text={manifest.spec.nodeName}
            />
          ) : (
            '-'
          )}
        </DefinitionItem>

        {selectedNode && (
          <Resources
            title="Node"
            datasource={datasource}
            resourceId="node"
            namespace={namespace}
            parameterName="fieldSelector"
            parameterValue={`metadata.name=${selectedNode}`}
            onClose={() => setSelectedNode('')}
          />
        )}
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
            ...(manifest.spec?.initContainers || []),
            ...(manifest.spec?.containers || []),
          ].map((container) => {
            const containerStatus = getContainerStatus(container.name, [
              ...(manifest.status?.initContainerStatuses || []),
              ...(manifest.status?.containerStatuses || []),
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

const getContainerStatus = (
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

const getContainerState = (state: V1ContainerState): string => {
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

const getValueFrom = (valueFrom: V1EnvVarSource): string => {
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
