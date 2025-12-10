// e2e/fixtures/auth.fixture.ts - Authentication test fixtures

import { test as base, expect, Page } from '@playwright/test';

/**
 * Test user configuration
 *
 * Uses unique timestamps to avoid conflicts between test runs.
 * For authenticated tests, use demo login flow.
 */
export function generateTestEmail(): string {
  return `e2e-test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.local`;
}

export const TEST_USER = {
  name: 'E2E Test User',
  password: 'TestPassword123!',
};

/**
 * Demo user login helper
 *
 * The application has a demo login feature that doesn't require
 * credentials. This is the safest way to test authenticated flows.
 */
async function loginWithDemo(page: Page): Promise<void> {
  await page.goto('/auth/signin');

  // Look for demo login button (if available)
  const demoButton = page.locator('button:has-text("Demo"), button:has-text("Try Demo")');

  if (await demoButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await demoButton.click();
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 30000 });
  } else {
    // Demo button not available - throw informative error
    throw new Error(
      'Demo login button not found. Authenticated tests require demo login functionality.'
    );
  }
}

/**
 * Extended test fixture with authenticated page context
 *
 * Usage:
 * ```typescript
 * import { test, expect } from '../fixtures/auth.fixture';
 *
 * test('authenticated test', async ({ authenticatedPage }) => {
 *   // Page is already logged in
 *   await authenticatedPage.goto('/dashboard');
 * });
 * ```
 */
export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    try {
      await loginWithDemo(page);
      await use(page);
    } catch {
      // If demo login fails, provide clear error for debugging
      console.error('Authentication fixture failed - demo login not available');
      throw new Error('Demo login required for authenticated tests');
    }
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
    await page.waitForLoadState('networkidle');
    await expect(page.locator(formSelector)).toBeVisible({ timeout: 10000 });
  },
};
