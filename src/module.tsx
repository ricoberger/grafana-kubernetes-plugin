import React, { Suspense, lazy } from 'react';
import { AppPlugin, type AppRootProps } from '@grafana/data';
import { LoadingPlaceholder } from '@grafana/ui';

let translationsPromise: Promise<void>;

function ensureTranslationsInitialized(): Promise<void> {
  if (!translationsPromise) {
    translationsPromise = import('@grafana/i18n').then(
      async ({ initPluginTranslations }) => {
        await initPluginTranslations('ricoberger-kubernetes-app');
      },
    );
  }
  return translationsPromise;
}

const LazyApp = lazy(async () => {
  await ensureTranslationsInitialized();
  return import('./app/App');
});

const App = (props: AppRootProps) => (
  <Suspense fallback={<LoadingPlaceholder text="" />}>
    <LazyApp {...props} />
  </Suspense>
);

export const plugin = new AppPlugin<{}>().setRootPage(App);
