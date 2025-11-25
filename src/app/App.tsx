import React from 'react';
import { AppRootProps } from '@grafana/data';
import { SceneApp, useSceneApp } from '@grafana/scenes';
import { initPluginTranslations } from '@grafana/i18n';

import { PluginPropsContext } from '../utils/utils.plugin';
import { HomePage } from '../pages/home/HomePage';
import { KubeconfigPage } from '../pages/kubeconfig/KubeconfigPage';
import { KubectlPage } from '../pages/kubectl/KubectlPage';
import { ResourcesPage } from '../pages/resources/ResourcesPage';
import { HelmPage } from '../pages/helm/HelmPage';
import { FluxPage } from '../pages/flux/FluxPage';

/**
 * NOTE: Without this the plugin is not loaded and throws the following error:
 * "Error: t() was called before i18n was initialized"
 *
 * TODO: Should this really be called here?
 */
initPluginTranslations('ricoberger-kubernetes-app');

function getSceneApp() {
  return new SceneApp({
    pages: [
      HomePage,
      ResourcesPage,
      HelmPage,
      FluxPage,
      KubeconfigPage,
      KubectlPage,
    ],
    urlSyncOptions: {
      updateUrlOnInit: true,
      createBrowserHistorySteps: true,
    },
  });
}

function AppWithScenes() {
  const scene = useSceneApp(getSceneApp);

  return <scene.Component model={scene} />;
}

function App(props: AppRootProps) {
  return (
    <PluginPropsContext.Provider value={props}>
      <AppWithScenes />
    </PluginPropsContext.Provider>
  );
}

export default App;
