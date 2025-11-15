import React from 'react';
import { EventsV1EventList } from '@kubernetes/client-node';

import {
  Logs,
  getResourceManifest,
  getEvents,
  getLogs,
} from '../../../utils/utils.resource';
import { Message, getSystemMessage } from '../../../utils/utils.llm';
import { KubernetesManifest } from '../../types/kubernetes';
import { AI } from '../AI/AI';

interface Props {
  datasource?: string;
  resourceId?: string;
  namespace?: string;
  name?: string;
  onClose: () => void;
}

export function AIAction(props: Props) {
  const getInitialMessages = async (): Promise<Message[]> => {
    const manifest = await getResourceManifest(
      props.datasource,
      props.resourceId,
      props.namespace,
      props.name,
    );
    const events = await getEvents(
      props.datasource,
      props.namespace,
      props.name,
    );

    let logs: Logs[] = [];
    try {
      if (props.resourceId === 'pod') {
        logs = await getLogs(
          props.datasource,
          props.namespace,
          props.name,
          manifest,
        );
      }
    } catch (_) { }

    return [getSystemMessage(), getInitialUserPrompt(manifest, events, logs)];
  };

  return <AI getInitialMessages={getInitialMessages} onClose={props.onClose} />;
}

const getInitialUserPrompt = (
  manifest: KubernetesManifest,
  events: EventsV1EventList,
  logs: Logs[],
): Message => {
  return {
    hide: true,
    role: 'user',
    message: `
Hello Site Reliability Engineer Agent,

Can you please analyse the \`${manifest.metadata?.name}\` \`${manifest.kind}\` in the \`${manifest.metadata?.namespace}\`. I need your expertise to analyze the situation and provide actionable recommendations.

Below is the Kubernetes manifest for the resource, the latest events associated with the resource${logs.length > 0 ? `, and the corresponding logs from all containers in that pod.` : `.`}

---

### **1. Kubernetes Manifest**

\`\`\`json
${JSON.stringify(manifest)}
\`\`\`

### **2. Kubernetes Events**

\`\`\`json
${JSON.stringify(events)}
\`\`\`

### **3. Container Logs**

${logs.map(
      (log) => `
#### **Logs from \`${log.container}\` container:**

\`\`\`log
${log.logs}
\`\`\`
`,
    )}
`,
  };
};
