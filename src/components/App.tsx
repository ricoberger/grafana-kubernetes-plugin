import { AppRootProps } from '@grafana/data';
import React from 'react';
import { Route, Routes } from 'react-router-dom';

import { ROUTES } from '../constants';
import { PluginPropsContext } from '../utils/utils.plugin';
import { HelmPage } from './helm/HelmPage';
import { HomePage } from './home/HomePage';
import { KubeconfigPage } from './kubeconfig/KubeconfigPage';
import { KubectlPage } from './kubectl/KubectlPage';
import { NamespacePage } from './namespaces/NamespacePage';
import { NamespacesPage } from './namespaces/NamespacesPage';
import { NodePage } from './nodes/NodePage';
import { NodesPage } from './nodes/NodesPage';
import { PersistentVolumeClaimPage } from './persistentcolumeclaims/PersistentVolumeClaimPage';
import { PersistentVolumeClaimsPage } from './persistentcolumeclaims/PersistentVolumeClaimsPage';
import { PodPage } from './pods/PodPage';
import { PodsPage } from './pods/PodsPage';
import { ResourcesPage } from './resources/ResourcesPage';
import { SearchPage } from './search/SearchPage';
import { WorkloadPage } from './workloads/WorkloadPage';
import { WorkloadsPage } from './workloads/WorkloadsPage';

function App(props: AppRootProps) {
  return (
    <PluginPropsContext.Provider value={props}>
      <Routes>
        <Route path={ROUTES.Home} element={<HomePage />} />
        <Route path={ROUTES.Search} element={<SearchPage />} />
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
