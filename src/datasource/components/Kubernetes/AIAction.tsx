import React, { useEffect, useState, useRef } from 'react';
import { Alert, Drawer, LoadingPlaceholder, useStyles2 } from '@grafana/ui';
import { llm } from '@grafana/llm';
import { scan } from 'rxjs/operators';
import { css } from '@emotion/css';
import { EventsV1EventList } from '@kubernetes/client-node';

import {
  getResource,
  getResourceManifest,
} from '../../../utils/utils.resource';
import { KubernetesManifest } from '../../types/kubernetes';
import { DataSourceOptions } from '../../types/settings';

interface AIResponse {
  status: string;
  severity: string;
  root_cause: string;
  impact: string;
  affected_resource: string;
  manifest_reference: string;
  event_evidence: string;
  troubleshooting_steps: Array<{
    step_number: number;
    recommendation: string;
    rationale: string;
  }>;
}

interface Props {
  settings: DataSourceOptions;
  datasource?: string;
  resource?: string;
  namespace?: string;
  name?: string;
  onClose: () => void;
}

export function AIAction(props: Props) {
  const styles = useStyles2(getStyles);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [reply, setReply] = useState('');
  const [aiResponses, setAiResponses] = useState<AIResponse[]>([]);
  // Kyverno policies cache: datasource -> { fetchedAt: number, policies: any, summary: string }
  const kyvernoCacheRef = useRef<Record<string, { fetchedAt: number; policies: any; summary: string }>>({});

  useEffect(() => {
    const analyze = async () => {
      try {
        setIsLoading(true);

        const manifest = await fetchManifest();
        const events = await fetchEvents();
        let kyvernoPolicies: any | undefined = undefined;
        // Kyverno caching logic
        const cacheKey = props.datasource || 'unknown';
        const now = Date.now();
        const ttlMs = 5 * 60 * 1000; // 5 minutes
        const cached = kyvernoCacheRef.current[cacheKey];
        if (cached && now - cached.fetchedAt < ttlMs) {
          kyvernoPolicies = cached.policies;
        } else {
          try {
            kyvernoPolicies = await fetchKyvernoPolicies();
            // Summarize once and store
            const summary = summarizeKyvernoPolicies(kyvernoPolicies);
            kyvernoCacheRef.current[cacheKey] = {
              fetchedAt: now,
              policies: kyvernoPolicies,
              summary,
            };
          } catch (e) {
            kyvernoPolicies = { error: e instanceof Error ? e.message : 'Failed to fetch Kyverno policies' };
            // Store error too (so we don't refetch aggressively for transient failures)
            kyvernoCacheRef.current[cacheKey] = {
              fetchedAt: now,
              policies: kyvernoPolicies,
              summary: 'No Kyverno policies (error in fetch)',
            };
          }
        }
        // Only attempt log retrieval for Pod resources (could extend to other types in future)
        let logs: string | undefined = undefined;
        try {
          if (manifest.kind === 'Pod') {
            logs = await fetchLogs(manifest);
          }
        } catch (e) {
          // Swallow log errors so main analysis still works; append note to logs variable
          logs = `Failed to retrieve logs: ${e instanceof Error ? e.message : 'Unknown error'}`;
        }
        await fetchInitialReply(manifest, events, logs, kyvernoPolicies);
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

    const fetchManifest = async (): Promise<KubernetesManifest> => {
      const resource = await getResource(props.datasource, props.resource);
      const manifest = await getResourceManifest(
        props.datasource,
        resource,
        props.namespace,
        props.name,
      );
      return manifest;
    };

    const fetchEvents = async (): Promise<EventsV1EventList> => {
      const response = await fetch(
        `/api/datasources/uid/${props.datasource}/resources/kubernetes/proxy/api/v1${props.namespace ? `/namespaces/${props.namespace}` : ''}/events?fieldSelector=involvedObject.name=${props.name}`,
        {
          method: 'get',
          headers: {
            Accept: 'application/json, */*',
            'Content-Type': 'application/json',
          },
        },
      );
      return await response.json();
    };

    const fetchLogs = async (manifest: KubernetesManifest): Promise<string> => {
      if (!props.datasource || !props.namespace || !props.name) {
        throw new Error('Missing identifiers for log retrieval');
      }
      // Default: fetch combined pod logs. For multi-container pods, Kubernetes requires a container param.
      // We attempt to fetch logs for each container if containers are defined to give broader context.
      const containers: string[] = manifest?.spec?.containers?.map((c: any) => c.name) || [];
      const baseUrl = `/api/datasources/uid/${props.datasource}/resources/kubernetes/proxy/api/v1/namespaces/${props.namespace}/pods/${props.name}/log`;
      const tailLines = 200; // limit output size
      if (containers.length === 0) {
        const resp = await fetch(`${baseUrl}?tailLines=${tailLines}`);
        if (!resp.ok) {
          throw new Error(await resp.text());
        }
        return await resp.text();
      }
      const logsByContainer: Record<string, string> = {};
      for (const container of containers) {
        const resp = await fetch(`${baseUrl}?container=${encodeURIComponent(container)}&tailLines=${tailLines}`);
        if (!resp.ok) {
          logsByContainer[container] = `Error: ${await resp.text()}`;
          continue;
        }
        logsByContainer[container] = await resp.text();
      }
      return JSON.stringify(logsByContainer);
    };

    const fetchKyvernoPolicies = async (): Promise<any> => {
      if (!props.datasource) {
        throw new Error('Missing datasource for Kyverno policies retrieval');
      }
      // Kyverno ClusterPolicies are cluster-scoped custom resources at /apis/kyverno.io/v1/clusterpolicies
      const response = await fetch(
        `/api/datasources/uid/${props.datasource}/resources/kubernetes/proxy/apis/kyverno.io/v1/clusterpolicies`,
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
      return await response.json();
    };

    const fetchInitialReply = async (
      manifest: KubernetesManifest,
      events: EventsV1EventList,
      logs?: string,
      kyvernoPolicies?: any,
    ) => {
      const stream = llm
        .streamChatCompletions({
          model: llm.Model.BASE,
          messages: [
            {
              role: 'system',
              content: getSystemPrompt(
                kyvernoCacheRef.current[props.datasource || 'unknown']?.summary ||
                  summarizeKyvernoPolicies(kyvernoPolicies),
              ),
            },
            {
              role: 'user',
              content: getInitialUserPrompt(manifest, events, logs, kyvernoPolicies),
            },
          ],
        })
        .pipe(
          scan((acc, delta) => {
            console.log(delta);
            const content = delta.choices.map(
              (choice) => (choice.delta as any).content || '',
            );
            return acc + content;
          }, ''),
        );

      stream.subscribe(setReply);
    };

    analyze();
  }, [props.datasource, props.resource, props.namespace, props.name]);

  useEffect(() => {
    try {
      if (reply.trim().startsWith('```json') && reply.trim().endsWith('```')) {
        const jsonStart = reply.indexOf('```json') + 7;
        const jsonEnd = reply.lastIndexOf('```');
        const replyJson = reply.substring(jsonStart, jsonEnd).trim();

        const parsed: AIResponse = JSON.parse(replyJson);
        const newAiResponses = [...aiResponses];
        newAiResponses.push(parsed);
        setAiResponses(newAiResponses);
      }
    } catch (err) { }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reply]);

  console.log(reply);

  return (
    <Drawer
      title="Details"
      scrollableContent={true}
      onClose={() => props.onClose()}
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
        <div className={styles.container}>
          <pre>
            {JSON.stringify(
              aiResponses.length === 1 ? aiResponses[0] : aiResponses,
              null,
              2,
            )}
          </pre>
        </div>
      )}
    </Drawer>
  );
}

const getStyles = () => {
  return {
    container: css({
      whiteSpace: 'pre-wrap',
    }),
  };
};

const summarizeKyvernoPolicies = (policies: any): string => {
  try {
    if (!policies || policies.error) {
      return 'No Kyverno policies or error fetching policies';
    }
    // Assume list form: { items: [ { metadata: { name }, spec: { validationFailureAction, rules: [...] } } ] }
    const items = policies.items || [];
    if (!Array.isArray(items) || items.length === 0) {
      return 'No Kyverno policies found';
    }
    const summary = items.slice(0, 25).map((p: any) => {
      const name = p?.metadata?.name || 'unknown';
      const action = p?.spec?.validationFailureAction || 'Audit';
      const ruleCount = Array.isArray(p?.spec?.rules) ? p.spec.rules.length : 0;
      return `${name} (action=${action}, rules=${ruleCount})`;
    });
    const truncated = items.length > 25 ? ' (truncated)' : '';
    return `${summary.join('; ')}${truncated}`;
  } catch (e) {
    return 'Failed to summarize Kyverno policies';
  }
};

const getSystemPrompt = (kyvernoSummary: string) => {
  return `
You are Kubernetes SRE Expert, a specialized AI for safe, precise, actionable troubleshooting.

INPUTS
  INPUT_MANIFEST: Raw Kubernetes resource manifest (NOT to be echoed back)
  INPUT_EVENTS: Kubernetes events relevant to the resource (NOT to be echoed)
  INPUT_LOGS: Recent pod logs (if applicable) (NOT to be echoed)
  INPUT_POLICIES: Kyverno ClusterPolicies (NOT to be echoed)\n  Kyverno Summary: ${kyvernoSummary}

CORE DIRECTIVES
  Goal: Correlate manifest misconfiguration with failure evidence (events/logs/policies) to determine root cause.
  Never recommend actions conflicting with listed Kyverno policies.

SAFETY / PRIVACY
  Do NOT quote or reproduce full input data. Refer only to manifest fields (e.g., spec.template.spec.containers[0].resources.limits.memory).
  No executable shell commands. Every action starts with: RECOMMENDED ACTION:
  If insufficient evidence: status = INSUFFICIENT_DATA.

ANALYSIS STEPS
  1. Validate manifest basics & status.conditions.
  2. Consider Kyverno policy summary for constraints (image, security, resources, networking).
  3. Map failure events (CrashLoopBackOff, OOMKilled, ImagePullBackOff, Pending, Permission, DNS, Node issues).
  4. Extract most suspicious single log line (if logs present) or state 'No critical logs found'.
  5. Formulate root cause referencing exact manifest field.
  6. Produce concise action plan consistent with Kyverno policies.

OUTPUT JSON FORMAT:
\n\n\`\`\`json
{
  "status": "[OK/ERROR/INSUFFICIENT_DATA]",
  "severity": "[CRITICAL/HIGH/MEDIUM/LOW/INFO]",
  "root_cause": "One-sentence root cause",
  "impact": "Operational impact description",
  "affected_resource": "Kind/name",
  "manifest_reference": "Field path causing issue",
  "k8s_api_links": {
    "status": "<status-endpoint>", 
    "logs": "<logs-endpoint or N/A>"
  },
  "suspicious_logs": "Single key log line or 'No critical logs found'",
  "involved_kyverno_policies": "Short list of policy names influencing issue or 'None'",
  "event_evidence": "Most specific event message",
  "troubleshooting_steps": [
    { "step_number": 1, "recommendation": "RECOMMENDED ACTION: <action>", "rationale": "Why this helps" }
  ]
}
\`\`\`
`;
};

const getInitialUserPrompt = (
  manifest: KubernetesManifest,
  events: EventsV1EventList,
  logs?: string,
  kyvernoPolicies?: any,
) => {
  return `
Manifest:

\`\`\`json
${JSON.stringify(manifest)}
\`\`\`

\`\`\`json
${JSON.stringify(events)}
\`\`\`

\`\`\`json
${JSON.stringify(logs)}
\`\`\`

\n(Policies summarized in system prompt; raw omitted to reduce token usage.)

`;
};
