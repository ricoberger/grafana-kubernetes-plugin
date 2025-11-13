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

import { Message, getReply } from '../../../utils/utils.llm';

interface Props {
  getInitialMessages: () => Promise<Message[]>;
  onClose: () => void;
}

export function AI(props: Props) {
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

        const initialMessages = await props.getInitialMessages();

        setMessages(initialMessages);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
