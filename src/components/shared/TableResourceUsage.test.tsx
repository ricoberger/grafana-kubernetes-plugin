import {
  createTheme,
  FieldConfig,
  FieldType,
  getDisplayProcessor,
} from '@grafana/data';
import { VizConfig } from '@grafana/scenes';
import { useDataTransformer } from '@grafana/scenes-react';

import { TableResourceUsage } from './TableResourceUsage';

jest.mock('@grafana/scenes', () => {
  // Scenes initializes its lazy loader on import; jsdom has no observer.
  Object.defineProperty(global, 'IntersectionObserver', {
    configurable: true,
    value: jest.fn(),
  });
  return jest.requireActual('@grafana/scenes');
});

jest.mock('@grafana/scenes-react', () => ({
  useQueryRunner: () => ({ useState: () => ({}) }),
  useDataTransformer: jest.fn(),
  VizPanel: () => null,
}));

jest.mock('../../hooks/useVizPanelMenu', () => ({
  useVizPanelMenu: () => undefined,
}));

describe('TableResourceUsage readiness', () => {
  const theme = createTheme();

  function readinessConfig(): FieldConfig {
    const panel = TableResourceUsage({ title: 'Workloads' });
    const viz: VizConfig = panel.props.viz;
    const readiness = viz.fieldConfig.overrides.find(
      (override) =>
        override.matcher.options === 'Value #ready_pods / Value #desired_pods',
    );
    expect(readiness).toBeDefined();
    if (!readiness) {
      throw new Error('Expected the readiness field override');
    }
    return Object.fromEntries(
      readiness.properties.map(({ id, value }) => [id, value]),
    );
  }

  it.each([null, undefined, NaN])('displays %s as neutral N/A', (value) => {
    const display = getDisplayProcessor({
      field: {
        name: 'READY',
        type: FieldType.number,
        values: [],
        config: readinessConfig(),
      },
      theme,
    });

    expect(display(value)).toMatchObject({
      text: 'N/A',
      color: theme.colors.text.primary,
    });
  });

  it('configures readiness as ready pods divided by desired pods', () => {
    readinessConfig();
    const transformation =
      jest.mocked(useDataTransformer).mock.lastCall?.[0].transformations[1];
    expect(transformation).toEqual({
      id: 'calculateField',
      options: {
        mode: 'binary',
        reduce: { reducer: 'sum' },
        alias: '',
        binary: {
          left: 'Value #ready_pods',
          operator: '/',
          right: 'Value #desired_pods',
        },
      },
    });
  });

  it.each([
    { value: 0, text: '0', color: 'red' },
    { value: 0.5, text: '50', color: 'red' },
    { value: 0.75, text: '75', color: 'orange' },
    { value: 1, text: '100', color: 'green' },
  ])(
    'formats readiness $value with the expected percentage and color',
    ({ value, text, color }) => {
      const display = getDisplayProcessor({
        field: {
          name: 'Value #ready_pods / Value #desired_pods',
          type: FieldType.number,
          values: [value],
          config: readinessConfig(),
        },
        theme,
      });

      expect(display(value)).toMatchObject({
        text,
        color: theme.visualization.getColorByName(color),
      });
    },
  );
});
