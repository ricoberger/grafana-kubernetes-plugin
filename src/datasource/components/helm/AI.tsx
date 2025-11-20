import React from 'react';

import { Message, getSystemMessage } from '../../../utils/utils.llm';
import { AIChat } from '../shared/ai/AIChat';
import { Release } from '../../types/helm';

interface Props {
  datasource?: string;
  namespace?: string;
  name?: string;
  version?: number;
}

export function AI({ datasource, namespace, name, version }: Props) {
  const getInitialMessages = async (): Promise<Message[]> => {
    const response = await fetch(
      `/api/datasources/uid/${datasource}/resources/helm/${namespace}/${name}/${version}`,
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

    const release = await response.json();

    return [getSystemMessage(), getInitialUserPrompt(release)];
  };

  return <AIChat getInitialMessages={getInitialMessages} />;
}

const getInitialUserPrompt = (release: Release): Message => {
  return {
    hide: true,
    role: 'user',
    message: `
Hello Site Reliability Engineer Agent,

Can you please analyse the Helm release \`${release.name}\` in the \`${release.namespace}\`. I need your expertise to analyze the situation and provide actionable recommendations.

Below is the Kubernetes manifest for the resource and the latest events associated with the resource.

---

### **1. Helm Release Manifest**

\`\`\`json
${JSON.stringify(release)}
\`\`\`
`,
  };
};
