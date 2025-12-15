// e2e/fixtures/paid-user.fixture.ts - Paid tier user authentication
// Builder: Builder-1 (Plan-24 Iteration 58)
// Purpose: Provides authenticated paid user page fixture for tier-restricted feature tests

import { test as base, expect, Page } from '@playwright/test';

/**
 * Paid user authentication fixture
 *
 * Demo user has isCreator: true which bypasses tier restrictions.
 * This allows testing paid features like Clarify without actual subscription.
 *
 * For testing free-tier-blocked behavior, use regular page fixture
 * and verify redirect to /pricing.
 */
async function loginAsPaidUser(page: Page): Promise<void> {
  await page.goto('/');

  // Wait for demo button instead of waitForLoadState (more reliable in CI)
  const demoButton = page.locator('button').filter({ hasText: 'Try It' }).first();

  try {
    await demoButton.waitFor({ state: 'visible', timeout: 15000 });
    await demoButton.click();
    await page.waitForURL('/dashboard', { timeout: 30000 });
  } catch {
    throw new Error(
      'Demo login failed. Paid user tests require demo user with creator privileges.'
    );
  }
}

export const test = base.extend<{ paidUserPage: Page }>({
  paidUserPage: async ({ page }, use) => {
    if (process.env.CI) {
      // CI: Storage state handles auth, just navigate to clarify
      await page.goto('/clarify');
      // Wait for clarify page element - more reliable than waitForLoadState
      await page
        .locator('h1')
        .filter({ hasText: /clarify/i })
        .first()
        .waitFor({ state: 'visible', timeout: 15000 })
        .catch(() => {});
    } else {
      // Local: Perform demo login
      await loginAsPaidUser(page);
    }
    await use(page);
  },
});

export { expect };

/**
 * Helper to check if user has paid feature access
 */
export async function hasPaidAccess(page: Page): Promise<boolean> {
  await page.goto('/clarify');

  // Wait for potential redirect
  await page.waitForTimeout(1000);

  // If on /clarify (not /pricing), has paid access
  return page.url().includes('/clarify') && !page.url().includes('/pricing');
}
