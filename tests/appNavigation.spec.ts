import { test, expect } from './fixtures';
import { ROUTES } from '../src/constants';

test.describe('navigating app', () => {
  test('home page should render successfully', async ({ gotoPage, page }) => {
    await gotoPage(`/${ROUTES.Home}`);
    await expect(page.locator('h1').getByText('Kubernetes')).toBeVisible();
    await expect(page.getByTestId('integration-resources')).toBeVisible();
    await expect(page.getByTestId('integration-helm')).toBeVisible();
    await expect(page.getByTestId('integration-flux')).toBeVisible();
    await expect(page.getByTestId('integration-kubeconfig')).toBeVisible();
  });

  test('resources page should render successfully', async ({
    gotoPage,
    page,
  }) => {
    await gotoPage(`/${ROUTES.Resources}`);
    await expect(page.locator('h1').getByText('Resources')).toBeVisible();
  });

  test('helm page should render successfully', async ({ gotoPage, page }) => {
    await gotoPage(`/${ROUTES.Helm}`);
    await expect(page.locator('h1').getByText('Helm')).toBeVisible();
  });

  test('flux page should render successfully', async ({ gotoPage, page }) => {
    await gotoPage(`/${ROUTES.Flux}`);
    await expect(page.locator('h1').getByText('Flux')).toBeVisible();
  });

  test('kubeconfig page should render successfully', async ({
    gotoPage,
    page,
  }) => {
    await gotoPage(`/${ROUTES.Kubeconfig}`);
    await expect(page.locator('h1').getByText('Kubeconfig')).toBeVisible();
  });
});
