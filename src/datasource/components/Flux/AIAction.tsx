import React from 'react';
import { EventsV1EventList } from '@kubernetes/client-node';

import { getResourceManifest, getEvents } from '../../../utils/utils.resource';
import { Message, getSystemMessage } from '../../../utils/utils.llm';
import { KubernetesManifest } from '../../types/kubernetes';
import { AI } from '../AI/AI';

interface Props {
  datasource?: string;
  resource?: string;
  namespace?: string;
  name?: string;
  onClose: () => void;
}

export function AIAction(props: Props) {
  const getInitialMessages = async (): Promise<Message[]> => {
    const manifest = await getResourceManifest(
      props.datasource,
      props.resource,
      props.namespace,
      props.name,
    );
    const events = await getEvents(
      props.datasource,
      props.namespace,
      props.name,
    );

    return [getSystemMessage(), getInitialUserPrompt(manifest, events)];
  };

  return <AI getInitialMessages={getInitialMessages} onClose={props.onClose} />;
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
