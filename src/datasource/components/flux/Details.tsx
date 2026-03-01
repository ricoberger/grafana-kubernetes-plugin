import React, { useState } from 'react';
import { Alert, Drawer, LoadingPlaceholder, Tab, TabsBar } from '@grafana/ui';
import { useAsync } from 'react-use';
import { llm } from '@grafana/llm';
import { initPluginTranslations } from '@grafana/i18n';
import { loadResources } from '@grafana/scenes';

import { getResourceManifest } from '../../../utils/utils.resource';
import { KubernetesManifest } from '../../types/kubernetes';
import { Yaml } from '../shared/details/Yaml';
import { Events } from '../shared/details/Events';
import { Overview } from './Overview';
import { AI } from './AI';
import pluginJson from '../../../plugin.json';

await initPluginTranslations(pluginJson.id, [loadResources]);

interface Props {
  datasource?: string;
  resourceId?: string;
  namespace?: string;
  name?: string;
  onClose: () => void;
}

export function Details({
  datasource,
  resourceId,
  namespace,
  name,
  onClose,
}: Props) {
  const [activeTab, setActiveTab] = useState('overview');

  const state = useAsync(async (): Promise<KubernetesManifest> => {
    const manifest = await getResourceManifest(
      datasource,
      resourceId,
      namespace,
      name,
    );

    return manifest;
  }, [datasource, resourceId, namespace, name]);

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
              label="Yaml"
              active={activeTab === 'yaml'}
              onChangeTab={(ev) => {
                ev?.preventDefault();
                setActiveTab('yaml');
              }}
            />
            <Tab
              label="Events"
              active={activeTab === 'events'}
              onChangeTab={(ev) => {
                ev?.preventDefault();
                setActiveTab('events');
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
        <LoadingPlaceholder text="Loading resource..." />
      ) : state.error ? (
        <Alert
          severity="error"
          title={`Failed to load ${namespace ? `${namespace}/${name}` : name}`}
        >
          {state.error.message}
        </Alert>
      ) : (
        <>
          {activeTab === 'overview' && (
            <Overview
              datasource={datasource}
              resourceId={resourceId}
              namespace={namespace}
              name={name}
              manifest={state.value}
            />
          )}
          {activeTab === 'yaml' && <Yaml value={state.value} />}
          {activeTab === 'events' && (
            <Events datasource={datasource} namespace={namespace} name={name} />
          )}

          {activeTab === 'ai' && (
            <AI
              datasource={datasource}
              resourceId={resourceId}
              namespace={namespace}
              name={name}
            />
          )}
        </>
      )}
    </Drawer>
  );
}
