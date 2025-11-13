import React from 'react';

import { Message, getSystemMessage } from '../../../utils/utils.llm';
import { AI } from '../AI/AI';
import { Release } from './types';

interface Props {
  datasource?: string;
  namespace?: string;
  name?: string;
  version?: number;
  onClose: () => void;
}

export function AIAction(props: Props) {
  const getInitialMessages = async (): Promise<Message[]> => {
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

    const release = await response.json();

    return [getSystemMessage(), getInitialUserPrompt(release)];
  };

  return <AI getInitialMessages={getInitialMessages} onClose={props.onClose} />;
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
