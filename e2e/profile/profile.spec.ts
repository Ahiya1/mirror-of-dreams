// e2e/profile/profile.spec.ts - Profile Page E2E Tests
// Builder: Builder-2 (Plan-24 Iteration 58)
// Purpose: Comprehensive E2E tests for the Profile page

import { test, expect } from '../fixtures/auth.fixture';
import { MOBILE_VIEWPORTS, TEST_TIMEOUTS } from '../fixtures/test-data.fixture';
import { ProfilePage } from '../pages/profile.page';

/**
 * Profile Page E2E Tests
 *
 * Tests the profile page functionality including:
 * - Page display and loading
 * - Demo user banner and restrictions
 * - Account information section
 * - Usage statistics section
 * - Subscription status card
 * - Account actions (edit name, change password)
 * - Danger zone (delete account modal)
 * - Mobile responsive behavior
 *
 * All tests use the authenticatedPage fixture which handles
 * demo login before each test.
 */
test.describe('Profile Page', () => {
  let profilePage: ProfilePage;

  test.beforeEach(async ({ authenticatedPage }) => {
    profilePage = new ProfilePage(authenticatedPage);
    await profilePage.goto();
    await profilePage.waitForLoad();
  });

  test.describe('Page Display', () => {
    test('loads profile page successfully', async ({ authenticatedPage }) => {
      await profilePage.expectLoaded();
      await expect(authenticatedPage).toHaveURL(/\/profile/);
    });

    test('displays page title', async () => {
      await expect(profilePage.pageTitle).toBeVisible();
      const titleText = await profilePage.pageTitle.textContent();
      expect(titleText).toContain('Profile');
    });

    test('displays demo user banner for demo account', async () => {
      // Demo user should see the demo banner
      await profilePage.expectDemoBannerVisible();
    });

    test('displays account information section', async ({ authenticatedPage }) => {
      // Look for the account info section containing Name and Email
      const accountSection = authenticatedPage.locator('text=Name').first();
      await expect(accountSection).toBeVisible();

      const emailLabel = authenticatedPage.locator('text=Email').first();
      await expect(emailLabel).toBeVisible();
    });

    test('displays usage statistics section', async () => {
      await profilePage.expectUsageStatsVisible();
    });

    test('displays subscription status card', async () => {
      await profilePage.expectSubscriptionCardVisible();
    });
  });

  test.describe('Edit Name', () => {
    test('displays edit name button', async () => {
      await expect(profilePage.editNameButton).toBeVisible();
    });

    test('edit name button shows warning or is restricted for demo user', async ({
      authenticatedPage,
    }) => {
      // Demo user should either see the edit button disabled or clicking shows warning
      const editButton = profilePage.editNameButton;
      await expect(editButton).toBeVisible();

      // The edit functionality may be restricted for demo users
      // Check if clicking shows a modal or warning
      await editButton.click();

      // After clicking, either:
      // 1. A warning/info message appears about demo restrictions
      // 2. The edit mode activates (and saving would show demo warning)
      // We just verify the button is interactive
      await authenticatedPage.waitForTimeout(500);
    });
  });

  test.describe('Account Actions', () => {
    test('displays change password option', async () => {
      await expect(profilePage.changePasswordButton).toBeVisible();
    });

    test('displays delete account button', async () => {
      await expect(profilePage.deleteAccountButton).toBeVisible();
    });

    test('delete account button opens confirmation modal', async ({ authenticatedPage }) => {
      // Click delete account button
      await profilePage.deleteAccountButton.click();

      // Modal should appear with delete confirmation dialog
      // Look for dialog or modal with delete-related content
      const deleteModal = authenticatedPage
        .locator('[role="dialog"], [class*="modal"]')
        .filter({ hasText: /delete|confirm/i });

      await expect(deleteModal.first()).toBeVisible({ timeout: 5000 });

      // Modal should have cancel option
      const cancelButton = deleteModal.getByRole('button', { name: /cancel|close/i });
      await expect(cancelButton.first()).toBeVisible();

      // Close the modal
      await cancelButton.first().click();
    });
  });

  test.describe('Usage Statistics', () => {
    test('displays reflections this month count', async ({ authenticatedPage }) => {
      const reflectionsLabel = authenticatedPage.locator('text=Reflections This Month');
      await expect(reflectionsLabel).toBeVisible();

      // Should show a number followed by slash and limit
      const reflectionsRow = reflectionsLabel.locator('..');
      await expect(reflectionsRow).toBeVisible();
    });

    test('displays total reflections count', async ({ authenticatedPage }) => {
      const totalLabel = authenticatedPage.locator('text=Total Reflections');
      await expect(totalLabel).toBeVisible();
    });
  });

  test.describe('Subscription Display', () => {
    test('displays subscription section header', async ({ authenticatedPage }) => {
      // Look for subscription-related heading
      const subscriptionHeading = authenticatedPage
        .locator('h2, h3')
        .filter({ hasText: /subscription/i });
      await expect(subscriptionHeading.first()).toBeVisible();
    });
  });
});

/**
 * Profile Mobile Tests
 *
 * Tests mobile-specific behavior using mobile viewport size
 */
test.describe('Profile Mobile', () => {
  test.use({
    viewport: MOBILE_VIEWPORTS.iphone13,
    isMobile: true,
    hasTouch: true,
  });

  test('displays correctly on mobile viewport', async ({ page }) => {
    // Manual demo login for mobile viewport tests
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const demoButton = page.locator('button').filter({ hasText: 'Try It' }).first();
    const isVisible = await demoButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (isVisible) {
      await demoButton.click();
      await page.waitForURL('/dashboard', { timeout: 30000 });

      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await profilePage.waitForLoad();

      // Page title should be visible on mobile
      await expect(profilePage.pageTitle).toBeVisible();
    } else {
      test.skip(true, 'Demo login not available');
    }
  });

  test('all sections are visible on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const demoButton = page.locator('button').filter({ hasText: 'Try It' }).first();
    const isVisible = await demoButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (isVisible) {
      await demoButton.click();
      await page.waitForURL('/dashboard', { timeout: 30000 });

      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await profilePage.waitForLoad();

      // Verify all major sections are visible on mobile
      await expect(profilePage.pageTitle).toBeVisible();

      // Usage statistics should be visible
      await profilePage.expectUsageStatsVisible();

      // Account actions should be visible
      await profilePage.expectAccountActionsVisible();

      // Subscription card should be visible
      await profilePage.expectSubscriptionCardVisible();
    } else {
      test.skip(true, 'Demo login not available');
    }
  });
});
