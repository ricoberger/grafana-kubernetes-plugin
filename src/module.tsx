import { AppPlugin, type AppRootProps } from '@grafana/data';
import { initPluginTranslations } from '@grafana/i18n';
import { loadResources } from '@grafana/scenes';
import { LoadingPlaceholder } from '@grafana/ui';
import React, { Suspense, lazy } from 'react';

import pluginJson from './plugin.json';

await initPluginTranslations(pluginJson.id, [loadResources]);

const LazyApp = lazy(async () => import('./components/App'));

function App(props: AppRootProps) {
  return (
    <Suspense fallback={<LoadingPlaceholder text="" />}>
      <LazyApp {...props} />
    </Suspense>
  );
}

export const plugin = new AppPlugin<{}>().setRootPage(App);
