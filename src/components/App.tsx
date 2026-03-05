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

function App(props: AppRootProps) {
  return (
    <PluginPropsContext.Provider value={props}>
      <Routes>
        <Route path={ROUTES.Home} element={<HomePage />} />
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
