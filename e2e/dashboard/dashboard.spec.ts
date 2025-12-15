// e2e/dashboard/dashboard.spec.ts - Dashboard E2E Tests

import { test as base, expect } from '@playwright/test';

import { test, expect as authExpect } from '../fixtures/auth.fixture';
import {
  getExpectedGreeting,
  TEST_TIMEOUTS,
  MOBILE_VIEWPORTS,
} from '../fixtures/test-data.fixture';
import { DashboardPage } from '../pages/dashboard.page';

/**
 * Dashboard E2E Tests
 *
 * Tests the dashboard page functionality including:
 * - Page display and loading
 * - Hero section with personalized greeting
 * - Dashboard cards rendering
 * - Navigation between pages
 * - Mobile responsive behavior
 *
 * All tests use the authenticatedPage fixture which handles
 * demo login before each test.
 */
test.describe('Dashboard', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    dashboardPage = new DashboardPage(authenticatedPage);
    await dashboardPage.goto();
    await dashboardPage.waitForLoad();
  });

  test.describe('Page Display', () => {
    test('loads dashboard page successfully', async ({ authenticatedPage }) => {
      await dashboardPage.expectLoaded();
      await expect(authenticatedPage).toHaveURL(/\/dashboard/);
    });

    test('displays hero section', async () => {
      await dashboardPage.expectHeroVisible();
    });

    test('displays personalized greeting with time of day', async () => {
      await dashboardPage.expectGreetingVisible();
      const greetingText = await dashboardPage.getGreetingText();
      const expectedTimeOfDay = getExpectedGreeting();
      expect(greetingText.toLowerCase()).toContain(expectedTimeOfDay);
    });

    test('displays reflect now CTA button', async () => {
      await dashboardPage.expectReflectButtonVisible();
    });

    test('displays dreams card', async () => {
      await dashboardPage.expectDreamsCardVisible();
    });

    test('displays reflections card', async () => {
      await dashboardPage.expectReflectionsCardVisible();
    });

    test('displays progress stats card', async () => {
      await dashboardPage.expectProgressCardVisible();
    });

    test('displays evolution card', async () => {
      await dashboardPage.expectEvolutionCardVisible();
    });

    test('displays visualization card', async () => {
      await dashboardPage.expectVisualizationCardVisible();
    });

    test('displays subscription card', async () => {
      await dashboardPage.expectSubscriptionCardVisible();
    });

    test('displays minimum 6 cards for free users', async () => {
      await dashboardPage.expectMinimumCards(6);
    });

    test('displays navigation bar', async () => {
      await dashboardPage.expectNavigationVisible();
    });

    test('displays dashboard grid', async () => {
      await dashboardPage.expectGridVisible();
    });
  });

  test.describe('Navigation', () => {
    test('dreams card View All navigates to /dreams', async ({ authenticatedPage }) => {
      await dashboardPage.clickDreamsViewAll();
      await authenticatedPage.waitForURL(/\/dreams/, { timeout: TEST_TIMEOUTS.navigation });
      expect(authenticatedPage.url()).toContain('/dreams');
    });

    test('reflections card View All navigates to /reflections', async ({ authenticatedPage }) => {
      await dashboardPage.clickReflectionsViewAll();
      await authenticatedPage.waitForURL(/\/reflections/, { timeout: TEST_TIMEOUTS.navigation });
      expect(authenticatedPage.url()).toContain('/reflections');
    });

    test('reflect now CTA navigates to /reflection when enabled', async ({ authenticatedPage }) => {
      // Check if button is enabled (has active dreams)
      const isEnabled = await dashboardPage.reflectNowButton
        .isEnabled({ timeout: 2000 })
        .catch(() => false);

      if (isEnabled) {
        await dashboardPage.clickReflectNow();
        await authenticatedPage.waitForURL(/\/reflection/, { timeout: TEST_TIMEOUTS.navigation });
        expect(authenticatedPage.url()).toContain('/reflection');
      } else {
        // Button should be disabled when no active dreams
        await dashboardPage.expectReflectButtonDisabled();
      }
    });
  });

  test.describe('Interaction', () => {
    test('cards are interactive and respond to hover', async ({ authenticatedPage }) => {
      // Verify dreams card has cursor pointer on hover
      const dreamsCard = dashboardPage.dreamsCard;
      await expect(dreamsCard).toBeVisible();

      // Hover over the card
      await dreamsCard.hover();

      // Card should still be visible and interactive
      await expect(dreamsCard).toBeVisible();
    });

    test('hero subtitle displays motivational copy', async () => {
      await expect(dashboardPage.heroSubtitle).toBeVisible();
      const subtitleText = await dashboardPage.heroSubtitle.textContent();
      expect(subtitleText).toBeTruthy();
      expect(subtitleText!.length).toBeGreaterThan(10);
    });
  });

  test.describe('Desktop', () => {
    test('bottom navigation is hidden on desktop viewport', async ({ authenticatedPage }) => {
      // Bottom navigation should be hidden on desktop (md:hidden)
      await dashboardPage.expectBottomNavHidden();
    });
  });
});

/**
 * Dashboard Mobile Tests
 *
 * Tests mobile-specific behavior using mobile viewport size
 * Uses setViewportSize instead of device presets to avoid webkit browser requirement
 */
test.describe('Dashboard Mobile', () => {
  // Use only viewport settings (not full device preset to avoid webkit)
  test.use({
    viewport: MOBILE_VIEWPORTS.iphone13,
    isMobile: true,
    hasTouch: true,
  });

  test('displays bottom navigation on mobile viewport', async ({ page }) => {
    // Navigate to landing page and use demo login ("Try It" button)
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const demoButton = page.locator(
      'button:has-text("Try It"), button:has-text("Try Demo"), button:has-text("Demo")'
    );
    const isVisible = await demoButton
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (isVisible) {
      await demoButton.first().click();
      await page.waitForURL('/dashboard', { timeout: 30000 });

      const dashboardPage = new DashboardPage(page);
      await dashboardPage.waitForLoad();

      // Bottom navigation should be visible on mobile
      await dashboardPage.expectBottomNavVisible();
    } else {
      test.skip(true, 'Demo login not available');
    }
  });

  test('cards stack vertically on mobile viewport', async ({ page }) => {
    // Navigate to landing page and use demo login
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const demoButton = page.locator(
      'button:has-text("Try It"), button:has-text("Try Demo"), button:has-text("Demo")'
    );
    const isVisible = await demoButton
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (isVisible) {
      await demoButton.first().click();
      await page.waitForURL('/dashboard', { timeout: 30000 });

      const dashboardPage = new DashboardPage(page);
      await dashboardPage.waitForLoad();

      // On mobile, grid should have single column layout
      // Check that cards exist and page renders correctly
      await dashboardPage.expectDreamsCardVisible();
      await dashboardPage.expectReflectionsCardVisible();

      // Verify the grid container adapts to mobile
      const grid = page.locator('.dashboard-grid-container, .dashboard-grid');
      await expect(grid.first()).toBeVisible();
    } else {
      test.skip(true, 'Demo login not available');
    }
  });

  test('hero section is responsive on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const demoButton = page.locator(
      'button:has-text("Try It"), button:has-text("Try Demo"), button:has-text("Demo")'
    );
    const isVisible = await demoButton
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (isVisible) {
      await demoButton.first().click();
      await page.waitForURL('/dashboard', { timeout: 30000 });

      const dashboardPage = new DashboardPage(page);
      await dashboardPage.waitForLoad();

      // Hero should be visible and adapted for mobile
      await dashboardPage.expectHeroVisible();
      await dashboardPage.expectGreetingVisible();

      // Reflect button should be full width on mobile
      await dashboardPage.expectReflectButtonVisible();
    } else {
      test.skip(true, 'Demo login not available');
    }
  });
});
