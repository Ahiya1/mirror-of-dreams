// e2e/settings/settings.spec.ts - Settings Page E2E Tests
// Builder: Builder-2 (Plan-24 Iteration 58)
// Purpose: Comprehensive E2E tests for the Settings page

import { test, expect } from '../fixtures/auth.fixture';
import { MOBILE_VIEWPORTS, TEST_TIMEOUTS } from '../fixtures/test-data.fixture';
import { SettingsPage } from '../pages/settings.page';

/**
 * Settings Page E2E Tests
 *
 * Tests the settings page functionality including:
 * - Page display and loading
 * - Preference sections visibility
 * - Toggle behavior for notifications
 * - Select behavior for tone and reminders
 * - Save feedback after settings change
 * - Persistence of settings on reload
 * - Mobile responsive behavior
 *
 * All tests use the authenticatedPage fixture which handles
 * demo login before each test.
 */
test.describe('Settings Page', () => {
  let settingsPage: SettingsPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    settingsPage = new SettingsPage(authenticatedPage);
    await settingsPage.goto();
    await settingsPage.waitForLoad();
  });

  test.describe('Page Display', () => {
    test('loads settings page successfully', async ({ authenticatedPage }) => {
      await settingsPage.expectLoaded();
      await expect(authenticatedPage).toHaveURL(/\/settings/);
    });

    test('displays all preference sections', async () => {
      await settingsPage.expectAllSectionsVisible();
    });

    test('displays notification preferences section', async () => {
      await settingsPage.expectNotificationSectionVisible();
    });
  });

  test.describe('Toggle Behavior', () => {
    test('toggles email notifications', async ({ authenticatedPage }) => {
      // Get initial state of email notifications toggle
      const toggle = settingsPage.emailNotificationsToggle;
      await expect(toggle).toBeVisible();

      const initialChecked = await toggle.isChecked();

      // Click to toggle
      await settingsPage.toggleEmailNotifications();

      // Wait for mutation to complete
      await authenticatedPage.waitForTimeout(1000);

      // Toggle state should have changed
      const newChecked = await toggle.isChecked();
      expect(newChecked).not.toBe(initialChecked);
    });

    test('changes default tone selection', async ({ authenticatedPage }) => {
      // Get the default tone select element
      const toneSelect = settingsPage.defaultToneSelect;
      await expect(toneSelect).toBeVisible();

      // Get initial value
      const initialValue = await toneSelect.inputValue();

      // Select a different tone
      const newTone = initialValue === 'fusion' ? 'gentle' : 'fusion';
      await settingsPage.selectDefaultTone(newTone as 'fusion' | 'gentle' | 'intense');

      // Wait for mutation to complete
      await authenticatedPage.waitForTimeout(1000);

      // Value should have changed
      const newValue = await toneSelect.inputValue();
      expect(newValue).toBe(newTone);
    });

    test('toggles analytics preference', async ({ authenticatedPage }) => {
      const toggle = settingsPage.analyticsToggle;
      await expect(toggle).toBeVisible();

      const initialChecked = await toggle.isChecked();

      // Click to toggle
      await settingsPage.toggleAnalytics();

      // Wait for mutation to complete
      await authenticatedPage.waitForTimeout(1000);

      // Toggle state should have changed
      const newChecked = await toggle.isChecked();
      expect(newChecked).not.toBe(initialChecked);
    });

    test('changes reflection reminders selection', async ({ authenticatedPage }) => {
      const remindersSelect = settingsPage.reflectionRemindersSelect;
      await expect(remindersSelect).toBeVisible();

      // Get initial value
      const initialValue = await remindersSelect.inputValue();

      // Select a different option
      const newOption = initialValue === 'off' ? 'weekly' : 'off';
      await settingsPage.selectReflectionReminders(newOption as 'off' | 'daily' | 'weekly');

      // Wait for mutation to complete
      await authenticatedPage.waitForTimeout(1000);

      // Value should have changed
      const newValue = await remindersSelect.inputValue();
      expect(newValue).toBe(newOption);
    });
  });

  test.describe('Save Behavior', () => {
    test('shows success feedback after toggle', async ({ authenticatedPage }) => {
      // Toggle a setting
      await settingsPage.toggleEmailNotifications();

      // Should show success toast/feedback
      await settingsPage.expectSaveSuccess();
    });

    test('persists setting change on page reload', async ({ authenticatedPage }) => {
      // Get initial value of a select (tone)
      const toneSelect = settingsPage.defaultToneSelect;
      const initialValue = await toneSelect.inputValue();

      // Change to a different value
      const newTone = initialValue === 'fusion' ? 'gentle' : 'fusion';
      await settingsPage.selectDefaultTone(newTone as 'fusion' | 'gentle' | 'intense');

      // Wait for save to complete
      await settingsPage.expectSaveSuccess();

      // Reload the page
      await authenticatedPage.reload();
      await settingsPage.waitForLoad();

      // Verify the setting persisted
      const persistedValue = await toneSelect.inputValue();
      expect(persistedValue).toBe(newTone);

      // Restore original value for clean state
      await settingsPage.selectDefaultTone(initialValue as 'fusion' | 'gentle' | 'intense');
      await settingsPage.expectSaveSuccess();
    });
  });
});

/**
 * Settings Mobile Tests
 *
 * Tests mobile-specific behavior using mobile viewport size
 */
test.describe('Settings Mobile', () => {
  test.use({
    viewport: MOBILE_VIEWPORTS.iphone13,
    isMobile: true,
    hasTouch: true,
  });

  test('displays correctly on mobile viewport', async ({ page }) => {
    // Manual demo login for mobile viewport tests
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const demoButton = page.locator('button').filter({ hasText: 'Try It' }).first();
    const isVisible = await demoButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (isVisible) {
      await demoButton.click();
      await page.waitForURL('/dashboard', { timeout: 30000 });

      const settingsPage = new SettingsPage(page);
      await settingsPage.goto();
      await settingsPage.waitForLoad();

      // Page title should be visible on mobile
      await expect(settingsPage.pageTitle).toBeVisible();

      // All sections should be visible
      await settingsPage.expectAllSectionsVisible();
    } else {
      test.skip(true, 'Demo login not available');
    }
  });
});
