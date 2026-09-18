import { useDataTransformer, useQueryRunner } from '@grafana/scenes-react';

import { TableCosts } from './TableCosts';

jest.mock('@grafana/scenes', () => {
  // Scenes initializes its lazy loader on import; jsdom has no observer.
  Object.defineProperty(global, 'IntersectionObserver', {
    configurable: true,
    value: jest.fn(),
  });
  return jest.requireActual('@grafana/scenes');
});

jest.mock('@grafana/scenes-react', () => ({
  useQueryRunner: jest.fn(() => ({ useState: () => ({}) })),
  useDataTransformer: jest.fn(),
  VizPanel: () => null,
}));

jest.mock('../../hooks/useVizPanelMenu', () => ({
  useVizPanelMenu: () => undefined,
}));

const props = {
  title: 'Costs',
  cpuAllocationExpr: 'cpu_allocation',
  memoryAllocationExpr: 'memory_allocation',
  cpuIdleExpr: 'cpu_idle',
  memoryIdleExpr: 'memory_idle',
};

describe('TableCosts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('preserves alphabetical resource ordering by default', () => {
    const panel = TableCosts(props);

    expect(panel.props.viz.options.sortBy).toEqual([
      { desc: false, displayName: 'NAMESPACE' },
      { desc: false, displayName: 'POD' },
      { desc: false, displayName: 'NODE' },
      { desc: false, displayName: 'WORKLOAD' },
      { desc: false, displayName: 'WORKLOAD TYPE' },
    ]);
  });

  it('supports sorting by the displayed total allocation column and panel descriptions', () => {
    const sortBy = [{ displayName: 'TOTAL ALLOCATION', desc: true }];
    const description = 'Costs for the selected time range';
    const panel = TableCosts({ ...props, sortBy, description });

    expect(panel.props.description).toBe(description);
    expect(panel.props.viz.options.sortBy).toEqual(sortBy);
    expect(
      jest.mocked(useDataTransformer).mock.lastCall?.[0].transformations,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'organize',
          options: expect.objectContaining({
            renameByName: expect.objectContaining({
              'Value #cpu_allocation + Value #memory_allocation':
                'TOTAL ALLOCATION',
            }),
          }),
        }),
      ]),
    );
    expect(jest.mocked(useQueryRunner).mock.lastCall?.[0]).toEqual({
      datasource: { type: 'prometheus', uid: '$prometheus' },
      queries: [
        {
          refId: 'cpu_allocation',
          format: 'table',
          instant: true,
          expr: props.cpuAllocationExpr,
        },
        {
          refId: 'cpu_idle',
          format: 'table',
          instant: true,
          expr: props.cpuIdleExpr,
        },
        {
          refId: 'memory_allocation',
          format: 'table',
          instant: true,
          expr: props.memoryAllocationExpr,
        },
        {
          refId: 'memory_idle',
          format: 'table',
          instant: true,
          expr: props.memoryIdleExpr,
        },
      ],
    });
  });
});
