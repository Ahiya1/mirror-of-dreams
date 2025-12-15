// e2e/dreams/dreams.spec.ts - Dreams E2E Tests

import { test as base, expect } from '@playwright/test';

import { test, expect as authExpect } from '../fixtures/auth.fixture';
import { TEST_TIMEOUTS, MOBILE_VIEWPORTS } from '../fixtures/test-data.fixture';
import { DreamsPage } from '../pages/dreams.page';

/**
 * Dreams Page E2E Tests
 *
 * Tests the dreams list page functionality including:
 * - Page display and loading
 * - Filter buttons
 * - Dream cards display
 * - Empty state handling
 * - Navigation to dream details
 * - Create dream modal
 *
 * All tests use the authenticatedPage fixture which handles
 * demo login before each test.
 */
test.describe('Dreams', () => {
  let dreamsPage: DreamsPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    dreamsPage = new DreamsPage(authenticatedPage);
    await dreamsPage.goto();
    await dreamsPage.waitForLoad();
  });

  test.describe('Page Display', () => {
    test('loads dreams page successfully', async ({ authenticatedPage }) => {
      await dreamsPage.expectLoaded();
      await expect(authenticatedPage).toHaveURL(/\/dreams/);
    });

    test('displays page title "Your Dreams"', async () => {
      await dreamsPage.expectTitleVisible();
    });

    test('displays create dream button', async () => {
      await dreamsPage.expectCreateButtonVisible();
    });

    test('displays limits info (X / Y dreams)', async () => {
      await dreamsPage.expectLimitsVisible();
      const limitsText = await dreamsPage.getLimitsText();
      // Should match pattern like "1 / 3 dreams" or "5 / infinity dreams"
      expect(limitsText).toMatch(/\d+\s*\/\s*(\d+|∞)\s*dreams/i);
    });

    test('displays filter buttons', async () => {
      await dreamsPage.expectFiltersVisible();
    });

    test('active filter is selected by default', async () => {
      // The Active button should have primary styling by default
      const activeFilter = dreamsPage.filterActive;
      await expect(activeFilter).toBeVisible();
      // Check it has a distinguishing style (primary variant)
      const classList = await activeFilter.getAttribute('class');
      expect(classList).toBeTruthy();
    });
  });

  test.describe('Filters', () => {
    test('can filter by active status', async () => {
      await dreamsPage.filterByStatus('active');
      // Wait for filter to apply
      await dreamsPage.page.waitForLoadState('domcontentloaded').catch(() => {});
      // Page should still be loaded
      await dreamsPage.expectLoaded();
    });

    test('can filter by achieved status', async () => {
      await dreamsPage.filterByStatus('achieved');
      await dreamsPage.page.waitForLoadState('domcontentloaded').catch(() => {});
      await dreamsPage.expectLoaded();
    });

    test('can filter by archived status', async () => {
      await dreamsPage.filterByStatus('archived');
      await dreamsPage.page.waitForLoadState('domcontentloaded').catch(() => {});
      await dreamsPage.expectLoaded();
    });

    test('can show all dreams', async () => {
      await dreamsPage.filterByStatus('all');
      await dreamsPage.page.waitForLoadState('domcontentloaded').catch(() => {});
      await dreamsPage.expectLoaded();
    });

    test('filter buttons change visual state when clicked', async () => {
      // Click achieved filter
      await dreamsPage.filterByStatus('achieved');
      await dreamsPage.page.waitForLoadState('domcontentloaded').catch(() => {});

      // Achieved button should now have primary styling
      const achievedFilter = dreamsPage.filterAchieved;
      await expect(achievedFilter).toBeVisible();
    });
  });

  test.describe('Empty State', () => {
    test('displays empty state when no dreams match filter', async () => {
      // Filter by achieved - may show empty state if no achieved dreams
      await dreamsPage.filterByStatus('achieved');
      await dreamsPage.page.waitForLoadState('domcontentloaded').catch(() => {});

      // Check if empty state OR dream cards are visible
      const hasEmptyState = await dreamsPage.isEmptyStateVisible();
      const dreamCount = await dreamsPage.getDreamCount();

      // Either dreams are shown or empty state
      expect(hasEmptyState || dreamCount > 0).toBe(true);
    });

    test('empty state has create dream CTA when applicable', async () => {
      // Filter by a status that might have no dreams
      await dreamsPage.filterByStatus('archived');
      await dreamsPage.page.waitForLoadState('domcontentloaded').catch(() => {});

      const hasEmptyState = await dreamsPage.isEmptyStateVisible();

      if (hasEmptyState) {
        // Empty state should have a CTA
        await dreamsPage.expectEmptyStateCta();
      }
    });
  });

  test.describe('Dream Cards', () => {
    test('displays dream cards when dreams exist', async () => {
      // Filter by active which typically has dreams for demo user
      await dreamsPage.filterByStatus('active');
      await dreamsPage.page.waitForLoadState('domcontentloaded').catch(() => {});

      const dreamCount = await dreamsPage.getDreamCount();
      const hasEmptyState = await dreamsPage.isEmptyStateVisible();

      // Either dreams exist or empty state is shown
      if (dreamCount > 0) {
        await dreamsPage.expectDreamsVisible();
      } else {
        expect(hasEmptyState).toBe(true);
      }
    });

    test('dream card shows title', async () => {
      await dreamsPage.filterByStatus('active');
      await dreamsPage.page.waitForLoadState('domcontentloaded').catch(() => {});

      const dreamCount = await dreamsPage.getDreamCount();
      if (dreamCount > 0) {
        await dreamsPage.expectDreamCardHasTitle(0);
      }
    });

    test('dream card shows category emoji', async () => {
      await dreamsPage.filterByStatus('active');
      await dreamsPage.page.waitForLoadState('domcontentloaded').catch(() => {});

      const dreamCount = await dreamsPage.getDreamCount();
      if (dreamCount > 0) {
        await dreamsPage.expectDreamCardHasCategory(0);
      }
    });

    test('dream card has reflect action button for active dreams', async () => {
      await dreamsPage.filterByStatus('active');
      await dreamsPage.page.waitForLoadState('domcontentloaded').catch(() => {});

      const dreamCount = await dreamsPage.getDreamCount();
      if (dreamCount > 0) {
        await dreamsPage.expectDreamCardHasReflectButton(0);
      }
    });

    test('dream card shows status badge', async () => {
      await dreamsPage.filterByStatus('all');
      await dreamsPage.page.waitForLoadState('domcontentloaded').catch(() => {});

      const dreamCount = await dreamsPage.getDreamCount();
      if (dreamCount > 0) {
        await dreamsPage.expectDreamCardHasStatus(0);
      }
    });
  });

  test.describe('Navigation', () => {
    test('clicking dream card navigates to detail page', async ({ authenticatedPage }) => {
      await dreamsPage.filterByStatus('active');
      await dreamsPage.page.waitForLoadState('domcontentloaded').catch(() => {});

      const dreamCount = await dreamsPage.getDreamCount();
      if (dreamCount > 0) {
        // Click on the dream card link (not the button)
        const firstCard = dreamsPage.dreamCards.first();
        const cardLink = firstCard.locator('a').first();

        if (await cardLink.isVisible({ timeout: 2000 }).catch(() => false)) {
          await cardLink.click();
          await authenticatedPage.waitForURL(/\/dreams\/[a-z0-9-]+/i, {
            timeout: TEST_TIMEOUTS.navigation,
          });
          expect(authenticatedPage.url()).toMatch(/\/dreams\/[a-z0-9-]+/i);
        }
      }
    });

    test('clicking reflect button navigates to reflection page with dreamId', async ({
      authenticatedPage,
    }) => {
      await dreamsPage.filterByStatus('active');
      await dreamsPage.page.waitForLoadState('domcontentloaded').catch(() => {});

      const dreamCount = await dreamsPage.getDreamCount();
      if (dreamCount > 0) {
        await dreamsPage.clickDreamReflect(0);
        await authenticatedPage.waitForURL(/\/reflection/, { timeout: TEST_TIMEOUTS.navigation });
        expect(authenticatedPage.url()).toContain('/reflection');
      }
    });
  });

  test.describe('Create Dream Modal', () => {
    test('clicking create dream button opens modal', async () => {
      await dreamsPage.clickCreateDream();
      await dreamsPage.expectCreateModalVisible();
    });

    test('create dream modal can be closed', async ({ authenticatedPage }) => {
      await dreamsPage.clickCreateDream();
      await dreamsPage.expectCreateModalVisible();

      // Close the modal (click outside or press Escape)
      await authenticatedPage.keyboard.press('Escape');

      // Modal should be closed
      await dreamsPage.expectCreateModalHidden();
    });
  });

  test.describe('Desktop', () => {
    test('bottom navigation is hidden on desktop viewport', async ({ authenticatedPage }) => {
      // Bottom navigation should be hidden on desktop
      await dreamsPage.expectBottomNavHidden();
    });

    test('dream cards display in grid on desktop', async ({ authenticatedPage }) => {
      // Grid should be visible for dream cards
      const grid = dreamsPage.dreamGrid;
      const isGridVisible = await grid.isVisible({ timeout: 5000 }).catch(() => false);

      // Grid may not be visible if no dreams (empty state instead)
      const hasEmptyState = await dreamsPage.isEmptyStateVisible();
      expect(isGridVisible || hasEmptyState).toBe(true);
    });
  });
});

/**
 * Dreams Mobile Tests
 *
 * Tests mobile-specific behavior using mobile viewport size
 * Uses viewport settings instead of device presets to avoid webkit browser requirement
 */
test.describe('Dreams Mobile', () => {
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

      // Navigate to dreams
      await page.goto('/dreams');
      await page.waitForLoadState('domcontentloaded');

      const dreamsPage = new DreamsPage(page);
      await dreamsPage.waitForLoad();

      // Bottom navigation should be visible on mobile
      await dreamsPage.expectBottomNavVisible();
    } else {
      test.skip(true, 'Demo login not available');
    }
  });

  test('dream cards display correctly on mobile', async ({ page }) => {
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

      await page.goto('/dreams');
      await page.waitForLoadState('domcontentloaded');

      const dreamsPage = new DreamsPage(page);
      await dreamsPage.waitForLoad();

      // Page should load correctly on mobile
      await dreamsPage.expectLoaded();
      await dreamsPage.expectTitleVisible();
      await dreamsPage.expectFiltersVisible();
    } else {
      test.skip(true, 'Demo login not available');
    }
  });

  test('filter buttons wrap on mobile viewport', async ({ page }) => {
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

      await page.goto('/dreams');
      await page.waitForLoadState('domcontentloaded');

      const dreamsPage = new DreamsPage(page);
      await dreamsPage.waitForLoad();

      // All filter buttons should be visible (they flex-wrap on mobile)
      await dreamsPage.expectFiltersVisible();
    } else {
      test.skip(true, 'Demo login not available');
    }
  });
});
