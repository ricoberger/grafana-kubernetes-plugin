import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  Drawer,
  Field,
  LoadingPlaceholder,
  ScrollContainer,
  Stack,
  TextArea,
  useStyles2,
} from '@grafana/ui';
import { renderTextPanelMarkdown } from '@grafana/data';
import DangerouslySetHtmlContent from 'dangerously-set-html-content';
import { css } from '@emotion/css';
import { EventsV1EventList } from '@kubernetes/client-node';

import {
  Logs,
  getResourceManifest,
  getEvents,
  getLogs,
} from '../../../utils/utils.resource';
import { Message, getSystemMessage, getReply } from '../../../utils/utils.llm';
import { KubernetesManifest } from '../../types/kubernetes';
import { DataSourceOptions } from '../../types/settings';

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const submitPrompt = async () => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { hide: false, role: 'user', message: prompt },
    ]);

    setPrompt('');

    setTimeout(() => {
      scrollRef.current?.scrollTo(0, scrollRef.current?.scrollHeight);
    }, 100);
  };

  useEffect(() => {
    const setInitialMessages = async () => {
      try {
        setIsLoading(true);

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

        let logs: Logs[] = [];
        try {
          if (props.resource === 'pods') {
            logs = await getLogs(
              props.datasource,
              props.namespace,
              props.name,
              manifest,
            );
          }
        } catch (_) { }

        setMessages([
          getSystemMessage(),
          getInitialUserPrompt(manifest, events, logs),
        ]);
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

    setInitialMessages();
  }, [props.datasource, props.resource, props.namespace, props.name]);

  useEffect(() => {
    const fetchReply = async () => {
      try {
        if (
          messages.length === 0 ||
          messages[messages.length - 1].role === 'assistant'
        ) {
          return;
        }

        setIsLoading(true);

        const reply = await getReply(messages);
        setMessages((prevMessages) => [...prevMessages, reply]);

        setTimeout(() => {
          scrollRef.current?.scrollTo(0, scrollRef.current?.scrollHeight);
        }, 100);
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

    fetchReply();
  }, [messages]);

  return (
    <Drawer
      title="AI"
      scrollableContent={false}
      onClose={() => props.onClose()}
    >
      <Stack
        direction="column"
        gap={2}
        justifyContent="space-between"
        height="100%"
      >
        <ScrollContainer ref={scrollRef} height="100%">
          {messages
            .filter((message) => !message.hide)
            .map((message, index) => (
              <Box
                key={index}
                paddingRight={message.role === 'assistant' ? 8 : 0}
                paddingLeft={message.role === 'user' ? 8 : 0}
              >
                <Card isCompact={true}>
                  <DangerouslySetHtmlContent
                    allowRerender={true}
                    html={renderTextPanelMarkdown(message.message)}
                    className="markdown-html"
                  />
                </Card>
              </Box>
            ))}

          {isLoading && (
            <LoadingPlaceholder className={styles.loading} text="Thinking..." />
          )}

          {error && (
            <Alert severity="error" title="Error fetching AI reply">
              {error}
            </Alert>
          )}
        </ScrollContainer>

        <div>
          <Field label="Prompt" disabled={isLoading}>
            <TextArea
              rows={3}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && event.shiftKey) {
                  event.preventDefault();
                  submitPrompt();
                }
              }}
              value={prompt}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
                setPrompt(event.target.value);
              }}
            />
          </Field>
        </div>
      </Stack>
    </Drawer>
  );
}

const getStyles = () => {
  return {
    loading: css({
      marginBottom: 0,
    }),
  };
};

const getInitialUserPrompt = (
  manifest: KubernetesManifest,
  events: EventsV1EventList,
  logs: Logs[],
): Message => {
  return {
    hide: true,
    role: 'user',
    message: `
Hello SRE Agent,

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
