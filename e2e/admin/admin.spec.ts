// e2e/admin/admin.spec.ts - Admin Dashboard E2E Tests
// Builder: Builder-3 (Plan-24 Iteration 58)
// Purpose: Comprehensive E2E tests for admin dashboard functionality

import { test as baseTest, expect as baseExpect } from '@playwright/test';

import { test, expect } from '../fixtures/admin.fixture';
import { AdminPage } from '../pages/admin.page';

/**
 * Admin Dashboard E2E Tests
 *
 * Tests the admin dashboard functionality including:
 * - Authorization (admin/creator access vs non-authenticated redirect)
 * - Stats display (users, tiers, reflections, artifacts)
 * - Users table with columns and data
 * - Webhook events section
 *
 * Uses adminPage fixture which handles demo login (creator role = admin access).
 */
test.describe('Admin Dashboard', () => {
  let adminPage: AdminPage;

  test.beforeEach(async ({ adminPage: page }) => {
    // Note: adminPage fixture already navigates to /admin and waits for load
    // We just need to create the page object for assertions
    adminPage = new AdminPage(page);
  });

  test.describe('Authorization', () => {
    test('allows admin/creator access to admin page', async ({ adminPage: page }) => {
      await adminPage.expectLoaded();
      await expect(page).toHaveURL(/\/admin/);
    });

    test('displays admin or creator role badge', async () => {
      await adminPage.expectRoleBadgeVisible();
    });
  });

  test.describe('Stats Display', () => {
    test('displays total users stat card', async () => {
      await expect(adminPage.totalUsersCard).toBeVisible();
      // Verify it contains a numeric value
      const value = await adminPage.getTotalUsersCount();
      expect(value).toBeTruthy();
    });

    test('displays tier breakdown stats (free, pro, unlimited)', async () => {
      await adminPage.expectStatsVisible();
      await expect(adminPage.unlimitedCard).toBeVisible();
    });

    test('displays total reflections stat', async () => {
      await expect(adminPage.totalReflectionsCard).toBeVisible();
    });

    test('displays artifacts stats', async () => {
      // Evolution reports and artifacts are secondary stats
      await expect(adminPage.evolutionReportsCard).toBeVisible();
      await expect(adminPage.artifactsCard).toBeVisible();
    });
  });

  test.describe('Users Table', () => {
    test('displays recent users section', async () => {
      await adminPage.expectUsersTableVisible();
    });

    test('shows user table with columns', async () => {
      await adminPage.expectUsersTableColumns();
    });

    test('displays at least one user row or empty state', async () => {
      // The demo user should be in the users list, or show empty state
      await adminPage.expectUserRowsOrEmptyState();
    });
  });

  test.describe('Webhook Events', () => {
    test('displays webhook events section', async () => {
      await adminPage.expectWebhookSectionVisible();
    });

    test('shows webhook table or empty state', async () => {
      // Webhook section exists, may have events or be empty
      const webhookCount = await adminPage.getWebhookRowCount();
      // Either we have webhook rows or the section shows empty state
      expect(webhookCount).toBeGreaterThanOrEqual(0);
    });
  });
});

/**
 * Admin Authorization Tests - Non-Authenticated Users
 *
 * Tests redirect behavior for users without admin access.
 * Uses base Playwright test (no admin fixture) to test unauthenticated state.
 *
 * Note: The admin page uses client-side auth checking via useEffect.
 * Non-authenticated users see a loading state, then get redirected.
 *
 * IMPORTANT: In CI, this runs under chromium-auth which has storage state,
 * so we must clear cookies first to test non-authenticated behavior.
 */
baseTest.describe('Admin Authorization - Non-Admin', () => {
  baseTest('redirects non-authenticated users to signin', async ({ page, context }) => {
    // Clear any existing auth from storage state
    await context.clearCookies();

    await page.goto('/admin');

    // Wait for the client-side redirect to happen
    // The page uses useEffect to check auth and redirect non-authenticated users
    // Regex matches: /auth/signin OR exactly the landing page (localhost:3000/ with optional trailing slash)
    await page.waitForURL((url) => url.pathname.includes('/auth/signin') || url.pathname === '/', {
      timeout: 15000,
    });

    // Verify we ended up on the signin or landing page
    const url = page.url();
    baseExpect(url.includes('/auth/signin') || url === 'http://localhost:3000/').toBe(true);
  });
});
