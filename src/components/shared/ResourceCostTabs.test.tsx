import {
  CustomVariable,
  DataLayerControl,
  QueryVariable,
  useQueryRunner,
  VariableControl,
  VizPanel,
} from '@grafana/scenes-react';
import { StackingMode } from '@grafana/schema';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import { queries } from '../../utils/utils.queries';
import { NodePage } from '../nodes/NodePage';
import { PodPage } from '../pods/PodPage';
import { WorkloadPage } from '../workloads/WorkloadPage';
import { RowCosts } from './RowCosts';
import { TableCosts } from './TableCosts';

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
    QueryVariable: jest.fn(Provider),
    CustomVariable: jest.fn(Provider),
    AnnotationLayer: Provider,
    TimeRangePicker: () => null,
    RefreshPicker: () => null,
    DataLayerControl: jest.fn(() => null),
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
jest.mock('./PageOptions', () => ({ PageOptions: () => null }));
jest.mock('./TabLogs', () => ({ TabLogs: () => null }));
jest.mock('./RowCosts', () => ({ RowCosts: jest.fn(() => null) }));
jest.mock('./TableCosts', () => ({ TableCosts: jest.fn(() => null) }));

jest.mock('../nodes/NodePageOverview', () => ({
  NodePageOverview: () => <div>Node overview</div>,
}));
jest.mock('../nodes/NodePageCPU', () => ({ NodePageCPU: () => null }));
jest.mock('../nodes/NodePageMemory', () => ({ NodePageMemory: () => null }));
jest.mock('../nodes/NodePageNetwork', () => ({ NodePageNetwork: () => null }));
jest.mock('../nodes/NodePageStorage', () => ({ NodePageStorage: () => null }));
jest.mock('../workloads/WorkloadPageOverview', () => ({
  WorkloadPageOverview: () => <div>Workload overview</div>,
}));
jest.mock('../workloads/WorkloadPageCPU', () => ({
  WorkloadPageCPU: () => null,
}));
jest.mock('../workloads/WorkloadPageMemory', () => ({
  WorkloadPageMemory: () => null,
}));
jest.mock('../workloads/WorkloadPageNetwork', () => ({
  WorkloadPageNetwork: () => null,
}));
jest.mock('../workloads/WorkloadPageStorage', () => ({
  WorkloadPageStorage: () => null,
}));
jest.mock('../pods/PodPageOverview', () => ({
  PodPageOverview: () => <div>Pod overview</div>,
}));
jest.mock('../pods/PodPageCPU', () => ({ PodPageCPU: () => null }));
jest.mock('../pods/PodPageMemory', () => ({ PodPageMemory: () => null }));
jest.mock('../pods/PodPageNetwork', () => ({ PodPageNetwork: () => null }));
jest.mock('../pods/PodPageStorage', () => ({ PodPageStorage: () => null }));

const pages = [
  {
    name: 'Node',
    component: NodePage,
    route: '/nodes/:node',
    path: '/nodes/worker-1',
    scope: queries.nodes,
    allocationTitle: 'Node Capacity Cost Rate',
    variables: { node: 'worker-1' },
    podsQuery: queries.pods.labelsByClusterNode,
  },
  {
    name: 'Workload',
    component: WorkloadPage,
    route: '/workloads/:namespace/:workloadType/:workload',
    path: '/workloads/payments/deployment/api',
    scope: queries.workloads,
    allocationTitle: 'Workload Allocation Cost Rate',
    variables: {
      namespace: 'payments',
      workloadtype: 'deployment',
      workload: 'api',
    },
    podsQuery: queries.pods.labelsByClusterNamespaceWorkload,
  },
  {
    name: 'Pod',
    component: PodPage,
    route: '/pods/:namespace/:pod',
    path: '/pods/payments/api-123',
    scope: queries.pods,
    allocationTitle: 'Pod Allocation Cost Rate',
    variables: { namespace: 'payments', pod: 'api-123' },
    podsQuery: undefined,
  },
];

function Location() {
  return <output data-testid="location">{useLocation().search}</output>;
}

describe.each(pages)('$name Cost tab', (page) => {
  function renderPage(search = '') {
    const Page = page.component;
    return render(
      <MemoryRouter
        initialEntries={[`${page.path}${search}`]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path={page.route} element={<Page />} />
        </Routes>
        <Location />
      </MemoryRouter>,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('switches from Overview without losing time or datasource URL parameters', () => {
    renderPage('?from=now-6h&to=now&var-datasource=cluster-a');
    expect(screen.getByText(`${page.name} overview`)).toBeInTheDocument();
    expect(RowCosts).not.toHaveBeenCalled();
    expect(useQueryRunner).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('tab', { name: 'Cost' }));

    expect(screen.getByRole('tab', { name: 'Cost' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.queryByText(`${page.name} overview`)).not.toBeInTheDocument();
    expect(RowCosts).toHaveBeenCalledTimes(1);
    expect(useQueryRunner).toHaveBeenCalledTimes(2);
    expect(
      Object.fromEntries(
        new URLSearchParams(screen.getByTestId('location').textContent ?? ''),
      ),
    ).toEqual({
      from: 'now-6h',
      to: 'now',
      'var-datasource': 'cluster-a',
      tab: 'cost',
    });

    fireEvent.click(screen.getByRole('tab', { name: 'Overview' }));
    expect(screen.getByText(`${page.name} overview`)).toBeInTheDocument();
  });

  it('supports direct links with resource-scoped summary stats above the hourly charts', () => {
    renderPage('?tab=cost');
    const scope = page.scope;
    const variables = jest
      .mocked(CustomVariable)
      .mock.calls.map(([props]) => props);
    for (const [name, value] of Object.entries(page.variables)) {
      expect(variables).toContainEqual(
        expect.objectContaining({ name, query: value, initialValue: value }),
      );
    }
    expect(jest.mocked(RowCosts).mock.calls.map(([props]) => props)).toEqual([
      {
        costsCPUAllocation: scope.costsCPUAllocation,
        costsMemoryAllocation: scope.costsMemoryAllocation,
        costsCPUIdle: scope.costsCPUIdle,
        costsMemoryIdle: scope.costsMemoryIdle,
      },
    ]);
    expect(jest.mocked(RowCosts).mock.invocationCallOrder[0]).toBeLessThan(
      jest.mocked(VizPanel).mock.invocationCallOrder[0],
    );
    const runners = jest
      .mocked(useQueryRunner)
      .mock.calls.map(([options]) => options);
    expect(
      runners.map(({ queries }) => queries.map(({ expr }) => expr)),
    ).toEqual([
      [
        scope.costsCPUAllocationRate,
        scope.costsMemoryAllocationRate,
        `(${scope.costsCPUAllocationRate}) + (${scope.costsMemoryAllocationRate})`,
      ],
      [scope.costsCPUIdleRate, scope.costsMemoryIdleRate],
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
    const panels = jest.mocked(VizPanel).mock.calls.map(([props]) => props);
    expect(panels.map(({ title }) => title)).toEqual([
      page.allocationTitle,
      `${page.name} Idle Cost Rate`,
    ]);
    for (const panel of panels) {
      expect(panel.viz.fieldConfig.defaults).toMatchObject({
        unit: 'suffix:$/h',
        custom: {
          spanNulls: false,
          stacking: { mode: StackingMode.None },
        },
      });
      expect(panel.viz.fieldConfig.defaults.min).toBeUndefined();
    }
    expect(panels[1].description).toContain(
      page.name === 'Node'
        ? 'unused physical capacity'
        : 'Negative values mean usage exceeds requests',
    );
  });

  it('provides only supported child-cost breakdowns and annotation controls', () => {
    renderPage('?tab=cost');

    if (page.podsQuery) {
      expect(
        jest.mocked(VariableControl).mock.calls.map(([props]) => props),
      ).toEqual([{ name: 'pod' }]);
      const podVariable = jest
        .mocked(QueryVariable)
        .mock.calls.map(([props]) => props)
        .find(({ name }) => name === 'pod');
      expect(podVariable).toMatchObject({
        query: {
          refId: 'pods',
          query: page.podsQuery.replace(/(?:\r\n|\r|\n)/g, ''),
        },
        includeAll: true,
      });
      expect(podVariable?.allValue).toBeUndefined();
      expect(
        jest.mocked(TableCosts).mock.calls.map(([props]) => props),
      ).toEqual([
        {
          title: 'Pods',
          cpuAllocationExpr: queries.pods.costsCPUAllocation,
          memoryAllocationExpr: queries.pods.costsMemoryAllocation,
          cpuIdleExpr: queries.pods.costsCPUIdle,
          memoryIdleExpr: queries.pods.costsMemoryIdle,
        },
      ]);
    } else {
      expect(VariableControl).not.toHaveBeenCalled();
      expect(TableCosts).not.toHaveBeenCalled();
    }
    expect(
      jest.mocked(DataLayerControl).mock.calls.map(([props]) => props),
    ).toEqual(page.name === 'Node' ? [] : [{ name: 'Restarts' }]);
  });
});
