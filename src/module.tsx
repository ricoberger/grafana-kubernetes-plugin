import React, { Suspense, lazy } from 'react';
import { AppPlugin, type AppRootProps } from '@grafana/data';
import { LoadingPlaceholder } from '@grafana/ui';
import { initPluginTranslations } from '@grafana/i18n';
import { loadResources } from '@grafana/scenes';

import pluginJson from './plugin.json';

await initPluginTranslations(pluginJson.id, [loadResources]);

const LazyApp = lazy(() => import('./app/App'));

const App = (props: AppRootProps) => (
  <Suspense fallback={<LoadingPlaceholder text="" />}>
    <LazyApp {...props} />
  </Suspense>
);

export const plugin = new AppPlugin<{}>().setRootPage(App);
