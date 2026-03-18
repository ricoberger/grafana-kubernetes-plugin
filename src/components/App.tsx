import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppRootProps } from '@grafana/data';

import { PluginPropsContext } from '../utils/utils.plugin';
import { ROUTES } from '../constants';
import { HomePage } from './home/HomePage';
import { KubeconfigPage } from './kubeconfig/KubeconfigPage';
import { KubectlPage } from './kubectl/KubectlPage';
import { ResourcesPage } from './resources/ResourcesPage';
import { HelmPage } from './helm/HelmPage';
import { FluxPage } from './flux/FluxPage';
import { CertManagerPage } from './certmanager/CertManagerPage';
import { MetricsPage } from './metrics/metrics/MetricsPage';
import { NodesPage } from './metrics/nodes/NodesPage';
import { NamespacesPage } from './metrics/namespaces/NamespacesPage';
import { WorkloadsPage } from './metrics/workloads/WorkloadsPage';
import { PodsPage } from './metrics/pods/PodsPage';
import { NodePage } from './metrics/nodes/NodePage';
import { NamespacePage } from './metrics/namespaces/NamespacePage';
import { WorkloadPage } from './metrics/workloads/WorkloadPage';
import { PodPage } from './metrics/pods/PodPage';
import { PersistentVolumeClaimsPage } from './metrics/persistentcolumeclaims/PersistentVolumeClaimsPage';
import { PersistentVolumeClaimPage } from './metrics/persistentcolumeclaims/PersistentVolumeClaimPage';

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
        <Route path={ROUTES.Flux} element={<FluxPage />} />
        <Route path={ROUTES.CertManager} element={<CertManagerPage />} />
        <Route path={ROUTES.Kubeconfig} element={<KubeconfigPage />} />
        <Route path={ROUTES.Kubectl} element={<KubectlPage />} />
      </Routes>
    </PluginPropsContext.Provider>
  );
}

export default App;
