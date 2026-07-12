import { test, expect } from '@playwright/test';

// Smoke tests for the dashboard "golden path" per role, against the seeded
// demo accounts (see backend/prisma/seed.ts). Requires the stack already
// running — see playwright.config.ts.

async function login(page: import('@playwright/test').Page, email: string, password: string) {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto('/login');
  await page.fill('input[type=email]', email);
  await page.fill('input[type=password]', password);
  await page.click('button[type=submit]');
  await page.waitForURL('**/dashboard');
  return consoleErrors;
}

test('unauthenticated visitor is redirected to /login', async ({ page }) => {
  await page.goto('/dashboard');
  await page.waitForURL('**/login');
});

test('Admin sees the company-capacity dashboard', async ({ page }) => {
  const consoleErrors = await login(page, 'admin@example.com', 'Admin1234');

  await expect(page.getByText('Total headcount')).toBeVisible();
  await expect(page.getByText('On client work')).toBeVisible();
  await expect(page.getByText('Employee engagement')).toBeVisible();
  await expect(page.getByText('Client projects')).toBeVisible();
  await expect(page.getByText('Internal projects')).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test('Member sees their own workload dashboard', async ({ page }) => {
  const consoleErrors = await login(page, 'dev1@example.com', 'Member1234');

  await expect(page.getByText('Total engagement')).toBeVisible();
  await expect(page.getByText('Client work')).toBeVisible();
  await expect(page.getByText('Internal work')).toBeVisible();
  await expect(page.getByText('My tasks (internal)')).toBeVisible();

  // A Member shouldn't see the Admin/PM-only management pages in the nav.
  await expect(page.locator('a[href="/clients"]')).toHaveCount(0);
  await expect(page.locator('a[href="/users"]')).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});

test('Viewer sees a read-only project health table', async ({ page }) => {
  const consoleErrors = await login(page, 'viewer@example.com', 'Viewer1234');

  await expect(page.getByRole('columnheader', { name: 'Category' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Progress' })).toBeVisible();
  await expect(page.locator('form')).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});
