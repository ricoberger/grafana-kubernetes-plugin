import React, { useState } from 'react';
import {
  Alert,
  Drawer,
  LoadingPlaceholder,
  ScrollContainer,
  Tab,
  TabsBar,
} from '@grafana/ui';
import { useAsync } from 'react-use';
import { llm } from '@grafana/llm';
import { initPluginTranslations } from '@grafana/i18n';
import { loadResources } from '@grafana/scenes';

import { getResourceManifest } from '../../../utils/utils.resource';
import { KubernetesManifest } from '../../types/kubernetes';
import { DataSourceOptions } from '../../types/settings';
import { MetricsPods } from './metrics/MetricsPods';
import { MetricsPersistentVolumeClaims } from './metrics/MetricsPersistentVolumeClaims';
import { MetricsDaemonSets } from './metrics/MetricsDaemonSets';
import { MetricsDeployments } from './metrics/MetricsDeployments';
import { MetricsStatefulSets } from './metrics/MetricsStatefulSets';
import { MetricsJobs } from './metrics/MetricsJobs';
import { MetricsCronJobs } from './metrics/MetricsCronJobs';
import { MetricsHPAs } from './metrics/MetricsHPAs';
import { MetricsVPAs } from './metrics/MetricsVPAs';
import { MetricsNodes } from './metrics/MetricsNodes';
import { Yaml } from '../shared/details/Yaml';
import { Events } from '../shared/details/Events';
import { Overview } from './Overview';
import { Pods } from './Pods';
import { Top } from './Top';
import { AI } from './AI';
import { Jobs } from './Jobs';
import pluginJson from '../../../plugin.json';

await initPluginTranslations(pluginJson.id, [loadResources]);

interface Props {
  settings: DataSourceOptions;
  datasource?: string;
  resourceId?: string;
  namespace?: string;
  name?: string;
  onClose: () => void;
}

export function Details({
  settings,
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
            {[
              'daemonset.apps',
              'deployment.apps',
              'job.batch',
              'node',
              'statefulset.apps',
            ].includes(resourceId || '') && (
                <Tab
                  label="Pods"
                  active={activeTab === 'pods'}
                  onChangeTab={(ev) => {
                    ev?.preventDefault();
                    setActiveTab('pods');
                  }}
                />
              )}
            {['cronjob.batch'].includes(resourceId || '') && (
              <Tab
                label="Jobs"
                active={activeTab === 'jobs'}
                onChangeTab={(ev) => {
                  ev?.preventDefault();
                  setActiveTab('jobs');
                }}
              />
            )}
            {[
              'daemonset.apps',
              'deployment.apps',
              'job.batch',
              'node',
              'pod',
              'statefulset.apps',
            ].includes(resourceId || '') && (
                <Tab
                  label="Top"
                  active={activeTab === 'top'}
                  onChangeTab={(ev) => {
                    ev?.preventDefault();
                    setActiveTab('top');
                  }}
                />
              )}
            {settings.integrationsMetricsDatasourceUid &&
              settings.integrationsMetricsKubeletJob &&
              settings.integrationsMetricsKubeStateMetricsJob &&
              settings.integrationsMetricsNodeExporterJob &&
              [
                'daemonset.apps',
                'deployment.apps',
                'cronjob.batch',
                'horizontalpodautoscaler.autoscaling',
                'job.batch',
                'node',
                'persistentvolumeclaim',
                'pod',
                'statefulset.apps',
                'verticalpodautoscaler.autoscaling.k8s.io',
              ].includes(resourceId || '') && (
                <Tab
                  label="Metrics"
                  active={activeTab === 'metrics'}
                  onChangeTab={(ev) => {
                    ev?.preventDefault();
                    setActiveTab('metrics');
                  }}
                />
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
          {activeTab === 'pods' && (
            <Pods
              datasource={datasource}
              namespace={namespace}
              manifest={state.value}
            />
          )}
          {activeTab === 'jobs' && (
            <Jobs datasource={datasource} namespace={namespace} name={name} />
          )}
          {activeTab === 'top' && (
            <Top
              datasource={datasource}
              resourceId={resourceId}
              namespace={namespace}
              manifest={state.value}
            />
          )}

          {activeTab === 'metrics' && (
            <ScrollContainer height="100%">
              {resourceId === 'daemonset.apps' && (
                <MetricsDaemonSets
                  settings={settings}
                  namespace={namespace}
                  name={name}
                />
              )}
              {resourceId === 'deployment.apps' && (
                <MetricsDeployments
                  settings={settings}
                  namespace={namespace}
                  name={name}
                />
              )}
              {resourceId === 'cronjob.batch' && (
                <MetricsCronJobs
                  settings={settings}
                  namespace={namespace}
                  name={name}
                />
              )}
              {resourceId === 'horizontalpodautoscaler.autoscaling' && (
                <MetricsHPAs
                  settings={settings}
                  namespace={namespace}
                  name={name}
                />
              )}
              {resourceId === 'job.batch' && (
                <MetricsJobs
                  settings={settings}
                  namespace={namespace}
                  name={name}
                />
              )}
              {resourceId === 'node' && (
                <MetricsNodes settings={settings} name={name} />
              )}
              {resourceId === 'persistentvolumeclaim' && (
                <MetricsPersistentVolumeClaims
                  settings={settings}
                  namespace={namespace}
                  name={name}
                />
              )}
              {resourceId === 'pod' && (
                <MetricsPods
                  settings={settings}
                  namespace={namespace}
                  name={name}
                />
              )}
              {resourceId === 'statefulset.apps' && (
                <MetricsStatefulSets
                  settings={settings}
                  namespace={namespace}
                  name={name}
                />
              )}
              {resourceId === 'verticalpodautoscaler.autoscaling.k8s.io' && (
                <MetricsVPAs
                  settings={settings}
                  namespace={namespace}
                  name={name}
                />
              )}
            </ScrollContainer>
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
