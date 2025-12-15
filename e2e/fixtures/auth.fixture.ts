// e2e/fixtures/auth.fixture.ts - Authentication test fixtures

import { test as base, expect, Page } from '@playwright/test';

/**
 * Test user configuration
 */
export function generateTestEmail(): string {
  return `e2e-test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.local`;
}

export const TEST_USER = {
  name: 'E2E Test User',
  password: 'TestPassword123!',
};

/**
 * Demo user login helper (used in local development)
 */
async function loginWithDemo(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  const demoButton = page.locator('button').filter({ hasText: 'Try It' }).first();
  await demoButton.waitFor({ state: 'visible', timeout: 15000 });
  await demoButton.click();
  await page.waitForURL('/dashboard', { timeout: 30000 });
}

/**
 * Extended test fixture with authenticated page context
 *
 * In CI: Uses storage state from global setup (already authenticated)
 * Locally: Performs demo login per test
 *
 * Usage:
 * ```typescript
 * import { test, expect } from '../fixtures/auth.fixture';
 *
 * test('authenticated test', async ({ authenticatedPage }) => {
 *   await authenticatedPage.goto('/dashboard');
 * });
 * ```
 */
export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    if (process.env.CI) {
      // CI: Storage state handles auth, just navigate
      await page.goto('/dashboard');
      await page.waitForLoadState('domcontentloaded');
    } else {
      // Local: Perform demo login
      await loginWithDemo(page);
    }
    await use(page);
  },
});

export { expect };

/**
 * Wait utilities for auth flows
 */
export const authWaits = {
  /**
   * Wait for successful login redirect
   */
  async forLoginRedirect(page: Page): Promise<void> {
    await page.waitForURL('/dashboard', { timeout: 30000 });
  },

  /**
   * Wait for error message to appear
   */
  async forErrorMessage(page: Page): Promise<void> {
    await expect(page.locator('.status-box-error')).toBeVisible({ timeout: 10000 });
  },

  /**
   * Wait for success message to appear
   */
  async forSuccessMessage(page: Page): Promise<void> {
    await expect(page.locator('.status-box-success')).toBeVisible({ timeout: 10000 });
  },

  /**
   * Wait for form to be ready (page loaded, inputs visible)
   */
  async forFormReady(page: Page, formSelector: string): Promise<void> {
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator(formSelector)).toBeVisible({ timeout: 10000 });
  },
};
