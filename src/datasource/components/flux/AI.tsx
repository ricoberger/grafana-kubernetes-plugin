import React from 'react';
import { EventsV1EventList } from '@kubernetes/client-node';

import { getResourceManifest, getEvents } from '../../../utils/utils.resource';
import { Message, getSystemMessage } from '../../../utils/utils.llm';
import { KubernetesManifest } from '../../types/kubernetes';
import { AIChat } from '../shared/ai/AIChat';

interface Props {
  datasource?: string;
  resourceId?: string;
  namespace?: string;
  name?: string;
}

export function AI({ datasource, resourceId, namespace, name }: Props) {
  const getInitialMessages = async (): Promise<Message[]> => {
    const manifest = await getResourceManifest(
      datasource,
      resourceId,
      namespace,
      name,
    );
    const events = await getEvents(datasource, namespace, name);

    return [getSystemMessage(), getInitialUserPrompt(manifest, events)];
  };

  return <AIChat getInitialMessages={getInitialMessages} />;
}

const getInitialUserPrompt = (
  manifest: KubernetesManifest,
  events: EventsV1EventList,
): Message => {
  return {
    hide: true,
    role: 'user',
    message: `
Hello Site Reliability Engineer Agent,

Can you please analyse the Flux \`${manifest.metadata?.name}\` \`${manifest.kind}\` in the \`${manifest.metadata?.namespace}\`. I need your expertise to analyze the situation and provide actionable recommendations.

Below is the Kubernetes manifest for the resource and the latest events associated with the resource.

---

### **1. Kubernetes Manifest**

\`\`\`json
${JSON.stringify(manifest)}
\`\`\`

### **2. Kubernetes Events**

\`\`\`json
${JSON.stringify(events)}
\`\`\`
`,
  };
};
