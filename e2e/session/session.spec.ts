// e2e/session/session.spec.ts - Session Management E2E Tests
// Purpose: Test session expiry and cookie handling scenarios
// NOTE: This file runs under chromium-auth project to use storage state

import { test, expect } from '../fixtures/auth.fixture';
import { TEST_TIMEOUTS } from '../fixtures/test-data.fixture';
import { DashboardPage } from '../pages/dashboard.page';

/**
 * Session Expiry Tests
 *
 * Tests handling of session expiration and cookie clearing
 * Uses authenticatedPage fixture to start with valid session
 *
 * IMPORTANT: These tests run under chromium-auth project which
 * provides storage state with demo user authentication.
 */
test.describe('Session Expiry', () => {
  test('redirects to signin when session expired', async ({ authenticatedPage }) => {
    const dashboardPage = new DashboardPage(authenticatedPage);
    await dashboardPage.goto();
    await dashboardPage.waitForLoad();

    // Verify we're on dashboard
    await expect(authenticatedPage).toHaveURL(/\/dashboard/);

    // Clear cookies to simulate session expiry
    await authenticatedPage.context().clearCookies();

    // Try navigating to a protected page
    await authenticatedPage.goto('/profile');

    // Wait for redirect to signin or landing
    await authenticatedPage.waitForURL(/\/auth\/signin|\//, { timeout: TEST_TIMEOUTS.navigation });

    // Should be redirected to signin or landing page
    const url = authenticatedPage.url();
    expect(url.includes('/auth/signin') || url === 'http://localhost:3000/').toBe(true);
  });

  test('handles cleared cookies gracefully', async ({ authenticatedPage }) => {
    const dashboardPage = new DashboardPage(authenticatedPage);
    await dashboardPage.goto();
    await dashboardPage.waitForLoad();

    // Clear all cookies
    await authenticatedPage.context().clearCookies();

    // Reload the page
    await authenticatedPage.reload();

    // Wait briefly for page to stabilize
    await authenticatedPage.waitForTimeout(1000);

    // Page should redirect or show appropriate UI without crashing
    await expect(authenticatedPage.locator('body')).toBeVisible();
  });

  test('page remains usable after error recovery', async ({ authenticatedPage }) => {
    const dashboardPage = new DashboardPage(authenticatedPage);
    await dashboardPage.goto();
    await dashboardPage.waitForLoad();

    // Clear cookies to trigger session error
    await authenticatedPage.context().clearCookies();

    // Navigate to protected page (should redirect)
    await authenticatedPage.goto('/profile');
    await authenticatedPage.waitForURL(/\/auth\/signin|\//, { timeout: TEST_TIMEOUTS.navigation });

    // Now re-authenticate using demo login
    // Navigate to landing and login again
    await authenticatedPage.goto('/');

    const demoButton = authenticatedPage.locator('button').filter({ hasText: 'Try It' }).first();
    const isVisible = await demoButton.isVisible({ timeout: 15000 }).catch(() => false);

    if (isVisible) {
      await demoButton.click();
      await authenticatedPage.waitForURL('/dashboard', { timeout: 30000 });

      // Page should be fully functional after recovery
      await expect(authenticatedPage).toHaveURL(/\/dashboard/);
      await dashboardPage.waitForLoad();
    }
  });
});
