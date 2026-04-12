import { AppRootProps } from '@grafana/data';
import React from 'react';
import { Route, Routes } from 'react-router-dom';

import { ROUTES } from '../constants';
import { PluginPropsContext } from '../utils/utils.plugin';
import { HelmPage } from './helm/HelmPage';
import { HomePage } from './home/HomePage';
import { KubeconfigPage } from './kubeconfig/KubeconfigPage';
import { KubectlPage } from './kubectl/KubectlPage';
import { MetricsPage } from './metrics/metrics/MetricsPage';
import { NamespacePage } from './metrics/namespaces/NamespacePage';
import { NamespacesPage } from './metrics/namespaces/NamespacesPage';
import { NodePage } from './metrics/nodes/NodePage';
import { NodesPage } from './metrics/nodes/NodesPage';
import { PersistentVolumeClaimPage } from './metrics/persistentcolumeclaims/PersistentVolumeClaimPage';
import { PersistentVolumeClaimsPage } from './metrics/persistentcolumeclaims/PersistentVolumeClaimsPage';
import { PodPage } from './metrics/pods/PodPage';
import { PodsPage } from './metrics/pods/PodsPage';
import { WorkloadPage } from './metrics/workloads/WorkloadPage';
import { WorkloadsPage } from './metrics/workloads/WorkloadsPage';
import { ResourcesPage } from './resources/ResourcesPage';

function App(props: AppRootProps) {
  return (
    <PluginPropsContext.Provider value={props}>
      <Routes>
        <Route path={ROUTES.Home} element={<HomePage />} />
        <Route path={ROUTES.Metrics} element={<MetricsPage />} />
        <Route path={ROUTES.MetricsNodes} element={<NodesPage />} />
        <Route path={`${ROUTES.MetricsNodes}/:node`} element={<NodePage />} />
        <Route path={ROUTES.MetricsNamespaces} element={<NamespacesPage />} />
        <Route
          path={`${ROUTES.MetricsNamespaces}/:namespace`}
          element={<NamespacePage />}
        />
        <Route path={ROUTES.MetricsWorkloads} element={<WorkloadsPage />} />
        <Route
          path={`${ROUTES.MetricsWorkloads}/:namespace/:workloadType/:workload`}
          element={<WorkloadPage />}
        />
        <Route path={ROUTES.MetricsPods} element={<PodsPage />} />
        <Route
          path={`${ROUTES.MetricsPods}/:namespace/:pod`}
          element={<PodPage />}
        />
        <Route
          path={ROUTES.MetricsPersistentVolumeClaims}
          element={<PersistentVolumeClaimsPage />}
        />
        <Route
          path={`${ROUTES.MetricsPersistentVolumeClaims}/:namespace/:pvc`}
          element={<PersistentVolumeClaimPage />}
        />
        <Route path={ROUTES.Resources} element={<ResourcesPage />} />
        <Route path={ROUTES.Helm} element={<HelmPage />} />
        <Route path={ROUTES.Kubeconfig} element={<KubeconfigPage />} />
        <Route path={ROUTES.Kubectl} element={<KubectlPage />} />
      </Routes>
    </PluginPropsContext.Provider>
  );
}

export default App;
