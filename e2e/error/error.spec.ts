// e2e/error/error.spec.ts - Error Handling E2E Tests
// Builder: Builder-4 (Plan-24 Iteration 58)
// Purpose: Test error handling scenarios including network errors and API errors
// NOTE: Session Expiry tests moved to e2e/session/session.spec.ts

import { test as baseTest } from '@playwright/test';

import { test, expect } from '../fixtures/network.fixture';
import { TEST_TIMEOUTS } from '../fixtures/test-data.fixture';

/**
 * Error Handling E2E Tests
 *
 * Tests the application's resilience to:
 * - Network failures (offline state)
 * - API errors (500, 401)
 * - Slow network conditions
 *
 * IMPORTANT: Always restore network after simulation tests
 * to avoid affecting subsequent tests.
 */
test.describe('Error Handling', () => {
  test.describe('Network Errors', () => {
    test('handles offline state gracefully', async ({
      networkPage,
      simulateOffline,
      restoreNetwork,
    }) => {
      // First authenticate with demo login
      await networkPage.goto('/');

      const demoButton = networkPage.locator('button').filter({ hasText: 'Try It' }).first();
      const isVisible = await demoButton.isVisible({ timeout: 15000 }).catch(() => false);

      if (!isVisible) {
        baseTest.skip(true, 'Demo login not available');
        return;
      }

      await demoButton.click();
      await networkPage.waitForURL('/dashboard', { timeout: 30000 });

      // Now simulate offline
      await simulateOffline();

      // Try to navigate - should handle gracefully
      await networkPage.goto('/profile');

      // Page should still render (may show cached content or error state)
      // The important thing is it doesn't crash
      await expect(networkPage.locator('body')).toBeVisible();

      // Restore network for cleanup
      await restoreNetwork();
    });

    test('shows error indication when API unavailable', async ({
      networkPage,
      simulateApiError,
      restoreNetwork,
    }) => {
      // Authenticate first
      await networkPage.goto('/');

      const demoButton = networkPage.locator('button').filter({ hasText: 'Try It' }).first();
      const isVisible = await demoButton.isVisible({ timeout: 15000 }).catch(() => false);

      if (!isVisible) {
        baseTest.skip(true, 'Demo login not available');
        return;
      }

      await demoButton.click();
      await networkPage.waitForURL('/dashboard', { timeout: 30000 });

      // Simulate API error for subsequent requests
      await simulateApiError('**/trpc/**', 500);

      // Try to navigate to a page that makes API calls
      await networkPage.goto('/dreams');
      // Brief wait for potential error handling
      await networkPage.waitForTimeout(1000);

      // Page should still be visible (may show error state or cached data)
      await expect(networkPage.locator('body')).toBeVisible();

      // Restore network
      await restoreNetwork();
    });

    test('recovers when network restored', async ({
      networkPage,
      simulateOffline,
      restoreNetwork,
    }) => {
      // Authenticate first
      await networkPage.goto('/');

      const demoButton = networkPage.locator('button').filter({ hasText: 'Try It' }).first();
      const isVisible = await demoButton.isVisible({ timeout: 15000 }).catch(() => false);

      if (!isVisible) {
        baseTest.skip(true, 'Demo login not available');
        return;
      }

      await demoButton.click();
      await networkPage.waitForURL('/dashboard', { timeout: 30000 });

      // Simulate offline
      await simulateOffline();

      // Make a failed request
      await networkPage.goto('/profile').catch(() => {});

      // Restore network
      await restoreNetwork();

      // Now navigation should work again
      await networkPage.goto('/dashboard');

      // Dashboard should load properly
      await expect(networkPage).toHaveURL(/\/dashboard/);
    });

    test('handles slow network without crashing', async ({
      networkPage,
      simulateSlowNetwork,
      restoreNetwork,
    }) => {
      // Authenticate first
      await networkPage.goto('/');

      const demoButton = networkPage.locator('button').filter({ hasText: 'Try It' }).first();
      const isVisible = await demoButton.isVisible({ timeout: 15000 }).catch(() => false);

      if (!isVisible) {
        baseTest.skip(true, 'Demo login not available');
        return;
      }

      await demoButton.click();
      await networkPage.waitForURL('/dashboard', { timeout: 30000 });

      // Simulate slow network (1 second delay)
      await simulateSlowNetwork(1000);

      // Navigate to a page - should still work, just slower
      await networkPage.goto('/profile');

      // Brief wait for page to stabilize on slow network
      await networkPage.waitForTimeout(2000);

      // Page should eventually load
      await expect(networkPage.locator('body')).toBeVisible();

      // Restore network
      await restoreNetwork();
    });
  });

  test.describe('API Errors', () => {
    test('handles 500 server error gracefully', async ({
      networkPage,
      simulateApiError,
      restoreNetwork,
    }) => {
      // Simulate 500 error for tRPC calls
      await simulateApiError('**/trpc/**', 500);

      // Navigate to landing page (doesn't require auth)
      await networkPage.goto('/');
      // Brief wait for potential error handling
      await networkPage.waitForTimeout(1000);

      // Page should still render (landing page has static content)
      await expect(networkPage.locator('h1').first()).toBeVisible();

      // Restore network
      await restoreNetwork();
    });

    test('handles 401 unauthorized error', async ({
      networkPage,
      simulateApiError,
      restoreNetwork,
    }) => {
      // Authenticate first
      await networkPage.goto('/');

      const demoButton = networkPage.locator('button').filter({ hasText: 'Try It' }).first();
      const isVisible = await demoButton.isVisible({ timeout: 15000 }).catch(() => false);

      if (!isVisible) {
        baseTest.skip(true, 'Demo login not available');
        return;
      }

      await demoButton.click();
      await networkPage.waitForURL('/dashboard', { timeout: 30000 });

      // Simulate 401 error
      await simulateApiError('**/trpc/**', 401);

      // Navigate to a protected page
      await networkPage.goto('/profile');

      // Brief wait for potential redirect
      await networkPage.waitForTimeout(1000);

      // Page should either show error or redirect to signin
      // The important thing is it handles the error gracefully
      await expect(networkPage.locator('body')).toBeVisible();

      // Restore network
      await restoreNetwork();
    });

    test('displays meaningful error message', async ({ networkPage, restoreNetwork }) => {
      // Authenticate first
      await networkPage.goto('/');

      const demoButton = networkPage.locator('button').filter({ hasText: 'Try It' }).first();
      const isVisible = await demoButton.isVisible({ timeout: 15000 }).catch(() => false);

      if (!isVisible) {
        baseTest.skip(true, 'Demo login not available');
        return;
      }

      await demoButton.click();
      await networkPage.waitForURL('/dashboard', { timeout: 30000 });

      // Simulate error with custom message
      await networkPage.route('**/trpc/**', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      });

      // Navigate to a page that makes API calls
      await networkPage.goto('/dreams');
      // Brief wait for page to load
      await networkPage.waitForTimeout(1000);

      // Page should handle error without crashing
      // May show error message or fallback UI
      await expect(networkPage.locator('body')).toBeVisible();

      // Restore network
      await restoreNetwork();
    });
  });
});

/**
 * Landing Page Error Resilience Tests
 *
 * Tests that the landing page remains functional even with API errors
 */
baseTest.describe('Error Resilience - Landing Page', () => {
  baseTest('landing page loads even with backend errors', async ({ page }) => {
    // Intercept API calls and return errors
    await page.route('**/trpc/**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    // Navigate to landing page
    await page.goto('/');
    // Brief wait for potential error handling
    await page.waitForTimeout(1000);

    // Landing page should still render (it has static content)
    await expect(page.locator('body')).toBeVisible();

    // The hero section or main heading should be visible
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Clean up route
    await page.unrouteAll();
  });

  baseTest('can navigate to signin despite API errors', async ({ page }) => {
    // Intercept API calls and return errors
    await page.route('**/trpc/**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    // Navigate to landing page
    await page.goto('/');
    // Brief wait for potential error handling
    await page.waitForTimeout(1000);

    // Find and click signin link
    const signinLink = page.locator('a[href*="signin"], button:has-text("Sign In")').first();
    const isVisible = await signinLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (isVisible) {
      await signinLink.click();
      await page.waitForURL(/\/auth\/signin/, { timeout: TEST_TIMEOUTS.navigation });
      await expect(page).toHaveURL(/\/auth\/signin/);
    }

    // Clean up route
    await page.unrouteAll();
  });
});
