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
import { CertificateRequests } from './CertificateRequests';
import { IssuerRefs } from './IssuerRefs';
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
            {resourceId === 'certificate.cert-manager.io' && (
              <Tab
                label="CertificateRequests"
                active={activeTab === 'certificaterequests'}
                onChangeTab={(ev) => {
                  ev?.preventDefault();
                  setActiveTab('certificaterequests');
                }}
              />
            )}
            {(resourceId === 'clusterissuer.cert-manager.io' ||
              resourceId === 'issuer.cert-manager.io') && (
                <>
                  <Tab
                    label="Certificates"
                    active={activeTab === 'issuerref-certificates'}
                    onChangeTab={(ev) => {
                      ev?.preventDefault();
                      setActiveTab('issuerref-certificates');
                    }}
                  />
                  <Tab
                    label="CertificateRequests"
                    active={activeTab === 'issuerref-certificaterequests'}
                    onChangeTab={(ev) => {
                      ev?.preventDefault();
                      setActiveTab('issuerref-certificaterequests');
                    }}
                  />
                  <Tab
                    label="Orders"
                    active={activeTab === 'issuerref-orders'}
                    onChangeTab={(ev) => {
                      ev?.preventDefault();
                      setActiveTab('issuerref-orders');
                    }}
                  />
                  <Tab
                    label="Challenges"
                    active={activeTab === 'issuerref-challenges'}
                    onChangeTab={(ev) => {
                      ev?.preventDefault();
                      setActiveTab('issuerref-challenges');
                    }}
                  />
                </>
              )}
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
          {activeTab === 'certificaterequests' && (
            <CertificateRequests
              datasource={datasource}
              namespace={namespace}
              name={name}
            />
          )}
          {activeTab === 'issuerref-certificates' && (
            <IssuerRefs
              datasource={datasource}
              resourceId="certificate.cert-manager.io"
              namespace={namespace}
              name={name}
              title="Certificates"
            />
          )}
          {activeTab === 'issuerref-certificaterequests' && (
            <IssuerRefs
              datasource={datasource}
              resourceId="certificaterequest.cert-manager.io"
              namespace={namespace}
              name={name}
              title="CertificateRequests"
            />
          )}
          {activeTab === 'issuerref-orders' && (
            <IssuerRefs
              datasource={datasource}
              resourceId="order.acme.cert-manager.io"
              namespace={namespace}
              name={name}
              title="Orders"
            />
          )}
          {activeTab === 'issuerref-challenges' && (
            <IssuerRefs
              datasource={datasource}
              resourceId="challenge.acme.cert-manager.io"
              namespace={namespace}
              name={name}
              title="Challenges"
            />
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
