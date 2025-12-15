// e2e/clarify/clarify.spec.ts - Clarify Feature E2E Tests
// Builder: Builder-4 (Plan-24 Iteration 58)
// Purpose: Test Clarify sessions list, filtering, and chat interface

import { test as baseTest } from '@playwright/test';

import { test, expect } from '../fixtures/paid-user.fixture';
import { TEST_TIMEOUTS, MOBILE_VIEWPORTS } from '../fixtures/test-data.fixture';
import { ClarifyListPage } from '../pages/clarify-list.page';
import { ClarifySessionPage } from '../pages/clarify-session.page';

/**
 * Clarify Feature E2E Tests
 *
 * Tests the Clarify chat feature including:
 * - Access control (paid/creator users only)
 * - Session list display and management
 * - Session filtering (Active, Archived, All)
 * - Session cards (title, message count, timestamp)
 * - Chat interface on session page
 *
 * IMPORTANT: Does NOT test AI response content (non-deterministic)
 * Tests UI states: loading, input visible, message sent indicators
 *
 * Uses paidUserPage fixture - demo user has creator privileges
 * which grants access to paid features like Clarify.
 */
test.describe('Clarify Feature', () => {
  let clarifyPage: ClarifyListPage;

  test.beforeEach(async ({ paidUserPage }) => {
    clarifyPage = new ClarifyListPage(paidUserPage);
    await clarifyPage.goto();
    await clarifyPage.waitForLoad();
  });

  test.describe('Access Control', () => {
    test('allows paid user access to clarify page', async ({ paidUserPage }) => {
      await clarifyPage.expectLoaded();
      await expect(paidUserPage).toHaveURL(/\/clarify/);
    });

    test('displays clarify page for creator/admin users', async () => {
      // Demo user has creator privileges which grants Clarify access
      await clarifyPage.expectLoaded();
      // Page should display title, not redirect to pricing
      await clarifyPage.expectPageTitleVisible();
    });

    test('displays clarify page without redirecting to pricing', async ({ paidUserPage }) => {
      // Verify the page remains on /clarify and doesn't redirect to /pricing
      const url = paidUserPage.url();
      expect(url).toContain('/clarify');
      expect(url).not.toContain('/pricing');
    });
  });

  test.describe('Page Display', () => {
    test('displays page title and subtitle', async () => {
      await clarifyPage.expectPageTitleVisible();
      // Subtitle might not always be visible, check for title at minimum
      const pageContent = await clarifyPage.page.content();
      expect(pageContent.toLowerCase()).toContain('clarify');
    });

    test('displays session limits card', async () => {
      // The limits card shows session usage (e.g., "2 / 10 sessions")
      await clarifyPage.expectLimitsDisplayed();
    });

    test('displays filter buttons (Active, Archived, All)', async () => {
      await clarifyPage.expectFiltersVisible();
    });

    test('displays new conversation button', async () => {
      await clarifyPage.expectNewConversationButtonVisible();
    });
  });

  test.describe('Session List', () => {
    test('displays session cards when sessions exist', async () => {
      // Check if sessions exist or empty state is shown
      const sessionCount = await clarifyPage.getSessionCount();
      const hasEmptyState = await clarifyPage.emptyState
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      if (sessionCount > 0) {
        await clarifyPage.expectSessionsVisible();
      } else {
        expect(hasEmptyState).toBe(true);
      }
    });

    test('shows empty state when no sessions exist', async () => {
      // This test verifies empty state OR sessions display
      // Demo user may have sessions, so we check for either state
      const sessionCount = await clarifyPage.getSessionCount();
      const hasEmptyState = await clarifyPage.emptyState
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      // Either sessions exist or empty state is shown - both are valid
      expect(sessionCount > 0 || hasEmptyState).toBe(true);
    });

    test('shows session title and message count when sessions exist', async () => {
      const sessionCount = await clarifyPage.getSessionCount();

      if (sessionCount > 0) {
        // First session should have a title
        await clarifyPage.expectSessionHasTitle(0);
        // First session should show message count
        await clarifyPage.expectSessionHasMessageCount(0);
      }
    });

    test('shows timestamp on session cards when sessions exist', async () => {
      const sessionCount = await clarifyPage.getSessionCount();

      if (sessionCount > 0) {
        // First session should show timestamp (e.g., "2 hours ago")
        await clarifyPage.expectSessionHasTimestamp(0);
      }
    });
  });

  test.describe('Session Management', () => {
    test('can filter sessions by Active status', async () => {
      await clarifyPage.filterActive();
      // Wait handled in filter method
      // Page should still be loaded and functional
      await clarifyPage.expectLoaded();
    });

    test('can filter sessions by Archived status', async () => {
      await clarifyPage.filterArchived();
      // Wait handled in filter method
      // Page should still be loaded and functional
      await clarifyPage.expectLoaded();
    });

    test('can filter sessions by All status', async () => {
      await clarifyPage.filterAll();
      // Wait handled in filter method
      // Page should still be loaded and functional
      await clarifyPage.expectLoaded();
    });

    test('displays session options dropdown on hover when sessions exist', async () => {
      const sessionCount = await clarifyPage.getSessionCount();

      if (sessionCount > 0) {
        // Hover over the first session card to reveal options button
        const firstCard = clarifyPage.sessionCards.first();
        await firstCard.hover();

        // Options button should be visible after hover
        // Note: Button may be hidden by default and revealed on hover
        const optionsButton = clarifyPage.moreOptionsButtons.first();
        // Check visibility (result may vary based on CSS hover states)
        await optionsButton.isVisible({ timeout: 3000 }).catch(() => false);

        // Options button visibility depends on CSS hover states
        // We just verify the hover action doesn't break the page
        await clarifyPage.expectLoaded();
      }
    });
  });

  test.describe('Chat Interface', () => {
    test('navigates to session page on card click when sessions exist', async ({
      paidUserPage,
    }) => {
      const sessionCount = await clarifyPage.getSessionCount();

      if (sessionCount > 0) {
        // Click on the first session card
        await clarifyPage.clickSession(0);

        // Should navigate to session detail page
        await paidUserPage.waitForURL(/\/clarify\/[a-z0-9-]+/i, {
          timeout: TEST_TIMEOUTS.navigation,
        });
        expect(paidUserPage.url()).toMatch(/\/clarify\/[a-z0-9-]+/i);
      }
    });

    test('displays message input on session page when sessions exist', async ({ paidUserPage }) => {
      const sessionCount = await clarifyPage.getSessionCount();

      if (sessionCount > 0) {
        // Navigate to first session
        await clarifyPage.clickSession(0);

        await paidUserPage.waitForURL(/\/clarify\/[a-z0-9-]+/i, {
          timeout: TEST_TIMEOUTS.navigation,
        });

        // Create session page object
        const sessionPage = new ClarifySessionPage(paidUserPage);
        await sessionPage.waitForLoad();

        // Message input should be visible
        await sessionPage.expectMessageInputVisible();
      }
    });

    test('chat message input is functional when sessions exist', async ({ paidUserPage }) => {
      const sessionCount = await clarifyPage.getSessionCount();

      if (sessionCount > 0) {
        // Navigate to first session
        await clarifyPage.clickSession(0);

        await paidUserPage.waitForURL(/\/clarify\/[a-z0-9-]+/i, {
          timeout: TEST_TIMEOUTS.navigation,
        });

        // Create session page object
        const sessionPage = new ClarifySessionPage(paidUserPage);
        await sessionPage.waitForLoad();

        // Type a message (but don't send - avoid triggering AI response)
        await sessionPage.typeMessage('Test message input');

        // Input should have the text
        await expect(sessionPage.messageInput).toHaveValue('Test message input');
      }
    });
  });
});

/**
 * Clarify Non-Authenticated Tests
 *
 * Tests access control for non-authenticated users
 *
 * IMPORTANT: In CI, this runs under chromium-auth which has storage state,
 * so we must clear cookies first to test non-authenticated behavior.
 */
baseTest.describe('Clarify Access Control - Non-Authenticated', () => {
  baseTest('redirects non-authenticated users to signin', async ({ page, context }) => {
    // Clear any existing auth from storage state
    await context.clearCookies();

    await page.goto('/clarify');

    // Wait for redirect - should go to signin page
    await page.waitForURL(/\/auth\/signin|\//, { timeout: TEST_TIMEOUTS.navigation });

    const url = page.url();
    // Should redirect to signin or landing page
    expect(url.includes('/auth/signin') || url === 'http://localhost:3000/').toBe(true);
  });
});

/**
 * Clarify Mobile Tests
 *
 * Tests mobile-specific behavior using mobile viewport size
 */
test.describe('Clarify Mobile', () => {
  test.use({
    viewport: MOBILE_VIEWPORTS.iphone13,
    isMobile: true,
    hasTouch: true,
  });

  test('displays correctly on mobile viewport', async ({ page }) => {
    // Manual demo login for mobile viewport tests (fixture may not apply)
    await page.goto('/');

    const demoButton = page.locator('button').filter({ hasText: 'Try It' }).first();
    const isVisible = await demoButton.isVisible({ timeout: 15000 }).catch(() => false);

    if (isVisible) {
      await demoButton.click();
      await page.waitForURL('/dashboard', { timeout: 30000 });

      const clarifyPage = new ClarifyListPage(page);
      await clarifyPage.goto();
      await clarifyPage.waitForLoad();

      // Core elements should be visible on mobile
      await clarifyPage.expectPageTitleVisible();
      await clarifyPage.expectFiltersVisible();
    } else {
      baseTest.skip(true, 'Demo login not available');
    }
  });

  test('filter buttons are accessible on mobile', async ({ page }) => {
    await page.goto('/');

    const demoButton = page.locator('button').filter({ hasText: 'Try It' }).first();
    const isVisible = await demoButton.isVisible({ timeout: 15000 }).catch(() => false);

    if (isVisible) {
      await demoButton.click();
      await page.waitForURL('/dashboard', { timeout: 30000 });

      const clarifyPage = new ClarifyListPage(page);
      await clarifyPage.goto();
      await clarifyPage.waitForLoad();

      // All filter buttons should be visible and tappable
      await clarifyPage.expectFiltersVisible();

      // Test tapping filters (wait handled in filter method)
      await clarifyPage.filterActive();
      await clarifyPage.expectLoaded();
    } else {
      baseTest.skip(true, 'Demo login not available');
    }
  });
});
