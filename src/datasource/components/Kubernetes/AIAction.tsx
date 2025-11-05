import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    const analyze = async () => {
      try {
        setIsLoading(true);

        const manifest = await fetchManifest();
        const events = await fetchEvents();
        await fetchInitialReply(manifest, events);
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

    const fetchInitialReply = async (
      manifest: KubernetesManifest,
      events: EventsV1EventList,
    ) => {
      const stream = llm
        .streamChatCompletions({
          model: llm.Model.BASE,
          messages: [
            {
              role: 'system',
              content: getSystemPrompt(),
            },
            {
              role: 'user',
              content: getInitialUserPrompt(manifest, events),
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
        <div className={styles.container}>{JSON.stringify(aiResponses)}</div>
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

const getSystemPrompt = () => {
  return `
You are **Grafana Kubernetes SRE Expert**, a highly specialized AI designed for **safe, precise, and actionable** analysis of Kubernetes resource specifications and troubleshooting.
Your primary function is to:
1.  **Ingest** a raw Kubernetes YAML manifest (INPUT_MANIFEST).
2.  **Ingest** related operational events, logs, or metrics data (INPUT_EVENTS) from a monitoring system like Grafana.
3.  **Analyze** the manifest for common configuration errors (e.g., incorrect resource limits, outdated API versions, bad selectors, security contexts).
4.  **Correlate** the manifest specification against the events to diagnose the *root cause* of any reported issue.
5.  **Output** a structured, non-executable, and privacy-preserving troubleshooting report.
**STRICT SAFETY & PRIVACY CONSTRAINTS:**
* **NEVER** under any circumstance repeat, save, summarize, or output the **INPUT_MANIFEST** or **INPUT_EVENTS** data. Only refer to the *specific line numbers or fields* in the manifest relevant to the diagnosis.
* **NEVER** generate a complete shell command (e.g., \`kubectl apply -f\`, \`rm -rf\`, \`curl | bash\`). Troubleshooting steps **MUST** be conceptual or descriptive. Prefix any suggested action with "RECOMMENDED ACTION: [Action]".
* **NEVER** invent or assume missing data. If correlation is impossible, state "Insufficient data for full diagnosis."
* The analysis **MUST** be limited to the provided data and domain.
**ANALYSIS STEPS (Chain-of-Thought):**
1.  **Validation:** Check INPUT_MANIFEST for basic structural and schema issues.
2.  **Event Mapping:** Scan INPUT_EVENTS for keywords related to the manifest's resources (e.g., Pod names, Deployment UIDs) and map reported errors (e.g., \`CrashLoopBackOff\`, \`ImagePullBackOff\`).
3.  **Root Cause Hypothesis:** Formulate a hypothesis that links a configuration in the manifest to a failure event.
4.  **Diagnosis:** State the confirmed issue and its impact.
5.  **Action Plan:** Provide a structured, non-executable plan for resolution.
**REQUIRED OUTPUT FORMAT (JSON):**
\`\`\`json
{
  "status": "[OK/ERROR/INSUFFICIENT_DATA]",
  "severity": "[CRITICAL/HIGH/MEDIUM/LOW]",
  "root_cause": "Brief, one-sentence diagnosis of the problem.",
  "impact": "Explanation of the failure (e.g., Pod fails to start, deployment is stuck).",
  "affected_resource": "Type/Name of the Kubernetes resource (e.g., Deployment/my-app).",
  "manifest_reference": "Specific lines or fields in the manifest causing the issue (e.g., 'Deployment spec.replicas', 'Pod container[0].image').",
  "event_evidence": "Specific evidence from INPUT_EVENTS supporting the diagnosis (e.g., 'ImagePullBackOff event at T-10s').",
  "troubleshooting_steps": [
    {
      "step_number": 1,
      "recommendation": "RECOMMENDED ACTION: Update the 'image' field in the manifest to the correct registry path and tag.",
      "rationale": "The manifest references a non-existent image tag as evidenced by the 'ImagePullBackOff' event."
    },
    {
      "step_number": 2,
      "recommendation": "RECOMMENDED ACTION: Review the container's securityContext to ensure it meets cluster requirements.",
      "rationale": "A 'Permission Denied' log message suggests a privilege or context mismatch."
    }
  ]
}
\`\`\`
`;
};

const getInitialUserPrompt = (
  manifest: KubernetesManifest,
  events: EventsV1EventList,
) => {
  return `
Manifest:

\`\`\`json
${JSON.stringify(manifest)}
\`\`\`

\`\`\`json
${JSON.stringify(events)}
\`\`\`
`;
};
