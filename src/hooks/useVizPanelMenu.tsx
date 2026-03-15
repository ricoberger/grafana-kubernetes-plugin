import { PanelMenuItem, TimeRange } from '@grafana/data';
import {
  QueryRunnerState,
  SceneDataQuery,
  VizConfig,
  VizPanelMenu,
} from '@grafana/scenes';
import { useTimeRange, useVariableInterpolator } from '@grafana/scenes-react';

function correctSceneVariableInterpolation(input: string) {
  return input.replace(
    /(\w+)=~"\{([^}]+)\}"/g,
    (_, key, values) => `${key}=~"${values.split(',').join('|')}"`,
  );
}

interface UseVizPanelMenuProps {
  data: QueryRunnerState;
  viz: VizConfig;
  currentTimeRange?: TimeRange;
  variables?: string[];
}

export function useVizPanelMenu({
  data,
  viz,
  currentTimeRange,
  variables,
}: UseVizPanelMenuProps): VizPanelMenu {
  const [timeRange] = useTimeRange();
  const vars = variables || [
    'cluster',
    'node',
    'namespace',
    'pod',
    'container',
    'pvc',
  ];
  const { from, to } = currentTimeRange || timeRange;

  const interpolator = useVariableInterpolator({
    variables: vars,
    timeRange: true,
  });

  let queries = data.queries;
  queries = queries.map((q: SceneDataQuery) => ({
    ...q,
    expr: correctSceneVariableInterpolation(interpolator(q.expr)),
    resourceId: q.resourceId
      ? correctSceneVariableInterpolation(interpolator(q.resourceId))
      : undefined,
    namespace: q.namespace
      ? correctSceneVariableInterpolation(interpolator(q.namespace))
      : undefined,
    parameterValue: q.parameterValue
      ? correctSceneVariableInterpolation(interpolator(q.parameterValue))
      : undefined,
    name: q.name
      ? correctSceneVariableInterpolation(interpolator(q.name))
      : undefined,
    container: q.container
      ? correctSceneVariableInterpolation(interpolator(q.container))
      : undefined,
  }));
  const datasource = interpolator(data.datasource?.uid || '');

  const jsonDef = {
    fieldConfig: viz.fieldConfig,
    description: '',
    options: viz.options,
    type: viz.pluginId,
    datasource: { uid: datasource },
    targets: queries,
  };

  const left = encodeURIComponent(
    JSON.stringify({
      datasource,
      queries,
      range: {
        from,
        to,
      },
    }),
  );

  const menuItems: PanelMenuItem[] = [
    {
      type: 'submenu',
      iconClassName: 'compass',
      text: 'Explore',
      href: `/explore?left=${left}`,
    },
    {
      type: 'submenu',
      iconClassName: 'copy',
      text: 'Copy JSON',
      onClick: () => {
        navigator.clipboard.writeText(JSON.stringify(jsonDef, null, 2));
      },
    },
  ];

  return new VizPanelMenu({
    items: menuItems,
  });
}
