import React, { useState } from 'react';
import { Alert, Drawer, LoadingPlaceholder, Tab, TabsBar } from '@grafana/ui';
import { initPluginTranslations } from '@grafana/i18n';
import { useAsync } from 'react-use';

import { Release } from '../../types/helm';
import { Overview } from './Overview';
import { History } from './History';
import { Yaml } from '../shared/details/Yaml';
import { Templates } from './Templates';
import { llm } from '@grafana/llm';
import { AI } from './AI';

initPluginTranslations('ricoberger-kubernetes-app');

interface Props {
  datasource?: string;
  namespace?: string;
  name?: string;
  version?: number;
  onClose: () => void;
}

export function Details({
  datasource,
  namespace,
  name,
  version,
  onClose,
}: Props) {
  const [activeTab, setActiveTab] = useState('overview');

  const state = useAsync(async (): Promise<Release> => {
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

    const result = await response.json();
    return result;
  }, [datasource, namespace, name, version]);

  const ai = useAsync(async (): Promise<boolean> => {
    const enabled = await llm.enabled();
    if (!enabled) {
      return false;
    }
    return true;
  }, []);

  return (
    <Drawer
      title="Details"
      scrollableContent={false}
      onClose={() => onClose()}
      tabs={
        !state.loading &&
        !state.error && (
          <TabsBar>
            <Tab
              label="Overview"
              active={activeTab === 'overview'}
              onChangeTab={(ev) => {
                ev?.preventDefault();
                setActiveTab('overview');
              }}
            />
            <Tab
              label="History"
              active={activeTab === 'history'}
              onChangeTab={(ev) => {
                ev?.preventDefault();
                setActiveTab('history');
              }}
            />
            <Tab
              label="Values"
              active={activeTab === 'values'}
              onChangeTab={(ev) => {
                ev?.preventDefault();
                setActiveTab('values');
              }}
            />
            <Tab
              label="Default Values"
              active={activeTab === 'defaultvalues'}
              onChangeTab={(ev) => {
                ev?.preventDefault();
                setActiveTab('defaultvalues');
              }}
            />
            <Tab
              label="Templates"
              active={activeTab === 'templates'}
              onChangeTab={(ev) => {
                ev?.preventDefault();
                setActiveTab('templates');
              }}
            />
            {ai.value && (
              <Tab
                label="AI"
                active={activeTab === 'ai'}
                onChangeTab={(ev) => {
                  ev?.preventDefault();
                  setActiveTab('ai');
                }}
              />
            )}
          </TabsBar>
        )
      }
    >
      {state.loading ? (
        <LoadingPlaceholder text="Loading release..." />
      ) : state.error ? (
        <Alert severity="error" title={`Failed to load ${namespace}/${name}`}>
          {state.error.message}
        </Alert>
      ) : (
        <>
          {activeTab === 'overview' && <Overview release={state.value} />}
          {activeTab === 'history' && (
            <History
              datasource={datasource}
              namespace={namespace}
              name={name}
            />
          )}
          {activeTab === 'values' && <Yaml value={state.value?.config} />}
          {activeTab === 'defaultvalues' && (
            <Yaml value={state.value?.chart?.values} />
          )}
          {activeTab === 'templates' && <Templates release={state.value} />}
          {activeTab === 'ai' && (
            <AI
              datasource={datasource}
              namespace={namespace}
              name={name}
              version={version}
            />
          )}
        </>
      )}
    </Drawer>
  );
}
