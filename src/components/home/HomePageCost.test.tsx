import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import { StackingMode, TooltipDisplayMode } from '@grafana/schema';
import { render, screen } from '@testing-library/react';
import React from 'react';

import { queries } from '../../utils/utils.queries';
import { StatCosts } from '../shared/StatCosts';
import { TableCosts } from '../shared/TableCosts';
import { HomePageCost } from './HomePageCost';

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
  VariableControl: () => null,
  VizPanel: jest.fn(() => null),
}));

jest.mock('../../hooks/useVizPanelMenu', () => ({
  useVizPanelMenu: () => undefined,
}));

jest.mock('../shared/StatCosts', () => ({
  StatCosts: jest.fn(() => null),
}));

jest.mock('../shared/TableCosts', () => ({
  TableCosts: jest.fn(({ title }: { title: string }) => (
    <div data-testid={title} />
  )),
}));

describe('HomePageCost', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('queries infrastructure and idle hourly rates as separate range queries', () => {
    render(<HomePageCost />);

    const rangeQuery = {
      format: 'time_series',
      instant: false,
      range: true,
    };
    const datasource = { type: 'prometheus', uid: '$prometheus' };
    expect(
      jest.mocked(useQueryRunner).mock.calls.map(([options]) => options),
    ).toEqual([
      {
        datasource,
        queries: [
          {
            ...rangeQuery,
            refId: 'cpu',
            expr: queries.cluster.costsCPUAllocationRate,
            legendFormat: 'CPU',
          },
          {
            ...rangeQuery,
            refId: 'memory',
            expr: queries.cluster.costsMemoryAllocationRate,
            legendFormat: 'Memory',
          },
          {
            ...rangeQuery,
            refId: 'total',
            expr: queries.cluster.costsTotalRate,
            legendFormat: 'Total',
          },
        ],
      },
      {
        datasource,
        queries: [
          {
            ...rangeQuery,
            refId: 'cpu',
            expr: queries.cluster.costsCPUIdleRate,
            legendFormat: 'CPU',
          },
          {
            ...rangeQuery,
            refId: 'memory',
            expr: queries.cluster.costsMemoryIdleRate,
            legendFormat: 'Memory',
          },
        ],
      },
    ]);
  });

  it('shows hourly units without stacking overlapping costs or bridging data gaps', () => {
    render(<HomePageCost />);

    const panels = jest.mocked(VizPanel).mock.calls.map(([props]) => props);
    expect(panels.map(({ title }) => title)).toEqual([
      'Node Infrastructure Cost Rate',
      'Idle CPU / Memory Cost Rate',
    ]);
    for (const panel of panels) {
      expect(panel.description).toContain('selected time range');
      expect(panel.viz).toMatchObject({
        fieldConfig: {
          defaults: {
            unit: 'suffix:$/h',
            custom: {
              spanNulls: false,
              stacking: { mode: StackingMode.None },
            },
          },
        },
        options: {
          tooltip: { mode: TooltipDisplayMode.Multi },
          legend: { calcs: ['min', 'mean', 'max', 'lastNotNull'] },
        },
      });
    }
  });

  it('preserves the 30-day summary', () => {
    render(<HomePageCost />);

    expect(
      jest.mocked(StatCosts).mock.calls.map(([props]) => props.expr),
    ).toEqual([
      queries.cluster.costsTotalPrior30d,
      queries.cluster.costsTotalCurrent30d,
      queries.cluster.costsPerPodCurrent30d,
      queries.cluster.costsPotentialSavings,
    ]);
  });

  it('shows full-width node and namespace cost tables ranked by total allocation', () => {
    render(<HomePageCost />);

    expect(jest.mocked(TableCosts).mock.calls.map(([props]) => props)).toEqual([
      {
        title: 'Nodes',
        description: expect.stringContaining('not amounts to add'),
        sortBy: [{ displayName: 'TOTAL ALLOCATION', desc: true }],
        cpuAllocationExpr: queries.nodes.costsCPUAllocation,
        memoryAllocationExpr: queries.nodes.costsMemoryAllocation,
        cpuIdleExpr: queries.nodes.costsCPUIdle,
        memoryIdleExpr: queries.nodes.costsMemoryIdle,
      },
      {
        title: 'Namespaces',
        description: expect.stringContaining('not additional charges'),
        sortBy: [{ displayName: 'TOTAL ALLOCATION', desc: true }],
        cpuAllocationExpr: queries.namespaces.costsCPUAllocation,
        memoryAllocationExpr: queries.namespaces.costsMemoryAllocation,
        cpuIdleExpr: queries.namespaces.costsCPUIdle,
        memoryIdleExpr: queries.namespaces.costsMemoryIdle,
      },
    ]);

    const nodesRow = screen.getByTestId('Nodes').parentElement;
    const namespacesRow = screen.getByTestId('Namespaces').parentElement;
    expect(nodesRow?.children).toHaveLength(1);
    expect(namespacesRow?.children).toHaveLength(1);
    const nodesSection = screen.getByRole('heading', {
      name: 'Nodes',
    }).parentElement;
    const namespacesSection = screen.getByRole('heading', {
      name: 'Namespaces',
    }).parentElement;
    expect(nodesRow?.parentElement).toBe(nodesSection);
    expect(namespacesRow?.parentElement).toBe(namespacesSection);
    expect(nodesSection?.nextElementSibling).toBe(namespacesSection);
  });
});
