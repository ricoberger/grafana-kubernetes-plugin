import React from 'react';
import { AppRootProps } from '@grafana/data';
import { SceneApp, useSceneApp } from '@grafana/scenes';
import { initPluginTranslations } from '@grafana/i18n';

import { PluginPropsContext } from '../../utils/utils.plugin';
import { homePage } from '../../pages/Home/homePage';
import { kubeconfigPage } from '../../pages/Kubeconfig/kubeconfigPage';
import { resourcesPage } from '../../pages/Resources/resourcesPage';
import { helmPage } from '../../pages/Helm/helmPage';
import { fluxPage } from '../../pages/Flux/fluxPage';

/**
 * NOTE: Without this the plugin is not loaded and throws the following error:
 * "Error: t() was called before i18n was initialized"
 *
 * TODO: Should this really be called here?
 */
initPluginTranslations('ricoberger-kubernetes-app');

function getSceneApp() {
  return new SceneApp({
    pages: [homePage, resourcesPage, helmPage, fluxPage, kubeconfigPage],
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
