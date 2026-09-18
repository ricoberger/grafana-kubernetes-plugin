import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { queries } from '../../utils/utils.queries';
import { TableCosts } from '../shared/TableCosts';
import { TableResourceUsage } from '../shared/TableResourceUsage';
import { HomePageOverview } from './HomePageOverview';

jest.mock('@grafana/scenes', () => ({}));
jest.mock('@grafana/scenes-react', () => ({
  VariableControl: () => null,
}));
jest.mock('../../hooks/useVizPanelMenu', () => ({
  useVizPanelMenu: () => undefined,
}));
jest.mock('../shared/RowCosts', () => ({
  RowCosts: () => null,
}));
jest.mock('../shared/StatWithFixedColorAndLink', () => ({
  StatWithFixedColorAndLink: () => null,
}));
jest.mock('../shared/TableCosts', () => ({
  TableCosts: jest.fn(() => null),
}));
jest.mock('../shared/TableResourceUsage', () => ({
  TableResourceUsage: jest.fn(() => null),
}));
jest.mock('../shared/TimeSeriesMemoryOrCPU', () => ({
  TimeSeriesMemoryOrCPU: () => null,
}));
jest.mock('./HomePageOverviewSearch', () => ({
  HomePageOverviewSearch: () => null,
}));

describe('HomePageOverview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows namespaces below nodes with the namespaces page resource-usage queries', () => {
    render(<HomePageOverview />);

    expect(
      screen
        .getAllByRole('heading', { level: 4 })
        .map((heading) => heading.textContent),
    ).toEqual(['Nodes', 'Namespaces']);
    expect(
      jest.mocked(TableResourceUsage).mock.calls.map(([props]) => props),
    ).toEqual([
      expect.objectContaining({
        title: 'Nodes',
        infoNodeExpr: queries.nodes.info,
      }),
      {
        title: 'Namespaces',
        infoNamespaceExpr: queries.namespaces.info,
        cpuUsageAvgExpr: queries.namespaces.cpuUsageAvgOverTime,
        cpuUsageAvgPercentExpr: queries.namespaces.cpuUsageAvgPercentOverTime,
        cpuUsageMaxExpr: queries.namespaces.cpuUsageMaxOverTime,
        cpuUsageMaxPercentExpr: queries.namespaces.cpuUsageMaxPercentOverTime,
        memoryUsageAvgExpr: queries.namespaces.memoryUsageAvgOverTime,
        memoryUsageAvgPercentExpr:
          queries.namespaces.memoryUsageAvgPercentOverTime,
        memoryUsageMaxExpr: queries.namespaces.memoryUsageMaxOverTime,
        memoryUsageMaxPercentExpr:
          queries.namespaces.memoryUsageMaxPercentOverTime,
      },
    ]);
  });

  it('uses namespace allocation and idle queries in the namespaces Cost tab', () => {
    render(<HomePageOverview />);

    fireEvent.click(screen.getAllByRole('radio', { name: 'Cost' })[1]);

    expect(jest.mocked(TableCosts).mock.calls.map(([props]) => props)).toEqual([
      {
        title: 'Namespaces',
        cpuAllocationExpr: queries.namespaces.costsCPUAllocation,
        memoryAllocationExpr: queries.namespaces.costsMemoryAllocation,
        cpuIdleExpr: queries.namespaces.costsCPUIdle,
        memoryIdleExpr: queries.namespaces.costsMemoryIdle,
      },
    ]);
  });
});
