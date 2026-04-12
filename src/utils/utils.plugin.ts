import { AppRootProps } from '@grafana/data';
import React, { useContext } from 'react';

// This is used to be able to retrieve the root plugin props anywhere inside the
// app.
export const PluginPropsContext = React.createContext<AppRootProps | null>(
  null,
);

export function usePluginProps() {
  const pluginProps = useContext(PluginPropsContext);

  return pluginProps;
}

export function usePluginMeta() {
  const pluginProps = usePluginProps();

  return pluginProps?.meta;
}
