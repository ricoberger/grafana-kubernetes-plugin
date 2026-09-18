import {
  CustomVariable,
  useQueryRunner,
  VariableControl,
  VizPanel,
} from '@grafana/scenes-react';
import { StackingMode } from '@grafana/schema';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import { queries } from '../../utils/utils.queries';
import { RowCosts } from '../shared/RowCosts';
import { TableCosts } from '../shared/TableCosts';
import { NamespacePage } from './NamespacePage';

jest.mock('../../img/logo.svg', () => 'logo.svg');

jest.mock('@grafana/scenes', () => {
  // Scenes initializes its lazy loader on import; jsdom has no observer.
  Object.defineProperty(global, 'IntersectionObserver', {
    configurable: true,
    value: jest.fn(),
  });
  return jest.requireActual('@grafana/scenes');
});

jest.mock('@grafana/scenes-react', () => {
  const Provider = ({ children }: { children?: React.ReactNode }) => (
    <>{children}</>
  );
  return {
    SceneContextProvider: Provider,
    DataSourceVariable: Provider,
    QueryVariable: Provider,
    CustomVariable: jest.fn(Provider),
    TimeRangePicker: () => null,
    RefreshPicker: () => null,
    VariableControl: jest.fn(() => null),
    useQueryRunner: jest.fn(() => ({ useState: () => ({}) })),
    VizPanel: jest.fn(() => null),
  };
});

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  PluginPage: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../../hooks/useVizPanelMenu', () => ({
  useVizPanelMenu: () => undefined,
}));
jest.mock('../shared/PageOptions', () => ({
  PageOptions: () => null,
}));
jest.mock('../shared/TabLogs', () => ({
  TabLogs: () => null,
}));
jest.mock('../shared/TableCosts', () => ({
  TableCosts: jest.fn(() => null),
}));
jest.mock('../shared/RowCosts', () => ({
  RowCosts: jest.fn(() => null),
}));
jest.mock('./NamespacePageOverview', () => ({
  NamespacePageOverview: () => <div>Namespace overview</div>,
}));
jest.mock('./NamespacePageCPU', () => ({
  NamespacePageCPU: () => null,
}));
jest.mock('./NamespacePageMemory', () => ({
  NamespacePageMemory: () => null,
}));
jest.mock('./NamespacePageNetwork', () => ({
  NamespacePageNetwork: () => null,
}));
jest.mock('./NamespacePageStorage', () => ({
  NamespacePageStorage: () => null,
}));

function Location() {
  const location = useLocation();
  return <output data-testid="location">{location.search}</output>;
}

function renderPage(search = '') {
  return render(
    <MemoryRouter
      initialEntries={[`/namespaces/payments${search}`]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/namespaces/:namespace" element={<NamespacePage />} />
      </Routes>
      <Location />
    </MemoryRouter>,
  );
}

describe('NamespacePage Cost tab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('opens from Overview, preserves URL filters, and only mounts costs when active', () => {
    renderPage('?var-workload=api&from=now-6h&to=now');
    expect(screen.getByText('Namespace overview')).toBeInTheDocument();
    expect(useQueryRunner).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('tab', { name: 'Cost' }));

    expect(screen.getByRole('tab', { name: 'Cost' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.queryByText('Namespace overview')).not.toBeInTheDocument();
    expect(useQueryRunner).toHaveBeenCalledTimes(2);
    const search = new URLSearchParams(
      screen.getByTestId('location').textContent ?? '',
    );
    expect(Object.fromEntries(search)).toEqual({
      'var-workload': 'api',
      from: 'now-6h',
      to: 'now',
      tab: 'cost',
    });

    fireEvent.click(screen.getByRole('tab', { name: 'Overview' }));
    expect(screen.getByText('Namespace overview')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Workloads' }),
    ).not.toBeInTheDocument();
  });

  it('supports direct links and uses namespace-scoped hourly queries', () => {
    renderPage('?tab=cost');

    expect(
      jest.mocked(CustomVariable).mock.calls.map(([props]) => props),
    ).toContainEqual(
      expect.objectContaining({
        name: 'namespace',
        query: 'payments',
        initialValue: 'payments',
      }),
    );
    const runners = jest
      .mocked(useQueryRunner)
      .mock.calls.map(([options]) => options);
    expect(runners).toHaveLength(2);
    expect(
      runners.map(({ queries }) => queries.map(({ expr }) => expr)),
    ).toEqual([
      [
        queries.namespaces.costsCPUAllocationRate,
        queries.namespaces.costsMemoryAllocationRate,
        `(${queries.namespaces.costsCPUAllocationRate}) + (${queries.namespaces.costsMemoryAllocationRate})`,
      ],
      [
        queries.namespaces.costsCPUIdleRate,
        queries.namespaces.costsMemoryIdleRate,
      ],
    ]);
    for (const runner of runners) {
      expect(runner.datasource).toEqual({
        type: 'prometheus',
        uid: '$prometheus',
      });
      for (const query of runner.queries) {
        expect(query).toMatchObject({
          format: 'time_series',
          instant: false,
          range: true,
        });
      }
    }
  });

  it('uses hourly units and retains negative idle values and missing-data gaps', () => {
    renderPage('?tab=cost');

    const panels = jest.mocked(VizPanel).mock.calls.map(([props]) => props);
    expect(panels.map(({ title }) => title)).toEqual([
      'Namespace Allocation Cost Rate',
      'Namespace Idle Cost Rate',
    ]);
    for (const panel of panels) {
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
      });
      expect(panel.viz.fieldConfig.defaults.min).toBeUndefined();
    }
    expect(panels[1].description).toContain(
      'Negative values mean usage exceeds requests',
    );
  });

  it('shows the namespace summary above the charts regardless of workload selection', () => {
    renderPage('?tab=cost&var-workload=api');

    expect(jest.mocked(RowCosts).mock.calls.map(([props]) => props)).toEqual([
      {
        costsCPUAllocation: queries.namespaces.costsCPUAllocation,
        costsMemoryAllocation: queries.namespaces.costsMemoryAllocation,
        costsCPUIdle: queries.namespaces.costsCPUIdle,
        costsMemoryIdle: queries.namespaces.costsMemoryIdle,
      },
    ]);
    expect(jest.mocked(RowCosts).mock.invocationCallOrder[0]).toBeLessThan(
      jest.mocked(VizPanel).mock.invocationCallOrder[0],
    );
  });

  it('shows a workload filter and the existing selected-range cost breakdown', () => {
    renderPage('?tab=cost');

    expect(
      jest.mocked(VariableControl).mock.calls.map(([props]) => props),
    ).toEqual([{ name: 'workload' }]);
    expect(jest.mocked(TableCosts).mock.calls.map(([props]) => props)).toEqual([
      {
        title: 'Workloads',
        cpuAllocationExpr: queries.workloads.costsCPUAllocation,
        memoryAllocationExpr: queries.workloads.costsMemoryAllocation,
        cpuIdleExpr: queries.workloads.costsCPUIdle,
        memoryIdleExpr: queries.workloads.costsMemoryIdle,
      },
    ]);
  });
});
