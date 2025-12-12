// e2e/fixtures/admin.fixture.ts - Admin/Creator authentication fixture
// Builder: Builder-1 (Plan-24 Iteration 58)
// Purpose: Provides authenticated admin page fixture for admin panel tests

import { test as base, expect, Page } from '@playwright/test';

/**
 * Admin authentication fixture
 *
 * Uses demo login because demo user has isCreator: true,
 * which grants admin panel access. This is simpler and more
 * reliable than maintaining separate admin credentials.
 */
async function loginAsAdmin(page: Page): Promise<void> {
  // Demo user has creator privileges = admin access
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const demoButton = page.locator('button').filter({ hasText: 'Try It' }).first();

  try {
    await demoButton.waitFor({ state: 'visible', timeout: 15000 });
    await demoButton.click();
    await page.waitForURL('/dashboard', { timeout: 30000 });
  } catch {
    throw new Error('Demo login failed. Admin tests require demo user with creator privileges.');
  }
}

export const test = base.extend<{ adminPage: Page }>({
  adminPage: async ({ page }, use) => {
    await loginAsAdmin(page);
    await use(page);
  },
});

export { expect };

/**
 * Helper to verify admin access is granted
 */
export async function verifyAdminAccess(page: Page): Promise<boolean> {
  await page.goto('/admin');

  // Wait a moment for potential redirect
  await page.waitForTimeout(1000);

  // If still on /admin, access was granted
  return page.url().includes('/admin');
}
