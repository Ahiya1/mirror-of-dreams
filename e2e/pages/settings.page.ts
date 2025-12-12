// e2e/pages/settings.page.ts - Settings Page Object Model
// Builder: Builder-1 (Plan-24 Iteration 58)
// Purpose: Encapsulates interactions with the settings page

import { Page, Locator, expect } from '@playwright/test';

/**
 * Settings Page Object
 *
 * Encapsulates all interactions with the settings page.
 *
 * Page structure:
 * - Page title "Settings"
 * - Notification Preferences section (email, reminders, evolution)
 * - Reflection Preferences section (default tone, character counter)
 * - Display Preferences section (reduce motion)
 * - Privacy & Data section (analytics, marketing)
 */
export class SettingsPage {
  readonly page: Page;

  // Page title
  readonly pageTitle: Locator;

  // Notification preferences
  readonly notificationSection: Locator;
  readonly emailNotificationsToggle: Locator;
  readonly reflectionRemindersSelect: Locator;
  readonly evolutionEmailToggle: Locator;

  // Reflection preferences
  readonly reflectionSection: Locator;
  readonly defaultToneSelect: Locator;
  readonly characterCounterToggle: Locator;

  // Display preferences
  readonly displaySection: Locator;
  readonly reduceMotionSelect: Locator;

  // Privacy preferences
  readonly privacySection: Locator;
  readonly analyticsToggle: Locator;
  readonly marketingToggle: Locator;

  // Feedback
  readonly successToast: Locator;
  readonly errorToast: Locator;

  constructor(page: Page) {
    this.page = page;

    this.pageTitle = page.locator('h1').filter({ hasText: 'Settings' });

    // Sections - find by h2 header text
    this.notificationSection = page
      .locator('h2')
      .filter({ hasText: 'Notification Preferences' })
      .locator('..');
    this.reflectionSection = page
      .locator('h2')
      .filter({ hasText: 'Reflection Preferences' })
      .locator('..');
    this.displaySection = page
      .locator('h2')
      .filter({ hasText: 'Display Preferences' })
      .locator('..');
    this.privacySection = page.locator('h2').filter({ hasText: 'Privacy' }).locator('..');

    // Toggles - find by label text then get sibling/descendant checkbox
    // Using a more specific pattern that matches the SettingRow component structure
    this.emailNotificationsToggle = page
      .locator('text=Email Notifications')
      .locator('..')
      .locator('..')
      .locator('input[type="checkbox"]');
    this.evolutionEmailToggle = page
      .locator('text=Evolution Reports')
      .locator('..')
      .locator('..')
      .locator('input[type="checkbox"]');
    this.characterCounterToggle = page
      .locator('text=Show Character Counter')
      .locator('..')
      .locator('..')
      .locator('input[type="checkbox"]');
    this.analyticsToggle = page
      .locator('p')
      .filter({ hasText: 'Analytics' })
      .locator('..')
      .locator('..')
      .locator('input[type="checkbox"]');
    this.marketingToggle = page
      .locator('text=Marketing Emails')
      .locator('..')
      .locator('..')
      .locator('input[type="checkbox"]');

    // Selects
    this.reflectionRemindersSelect = page
      .locator('text=Reflection Reminders')
      .locator('..')
      .locator('..')
      .locator('select');
    this.defaultToneSelect = page
      .locator('text=Default Tone')
      .locator('..')
      .locator('..')
      .locator('select');
    this.reduceMotionSelect = page
      .locator('text=Reduce Motion')
      .locator('..')
      .locator('..')
      .locator('select');

    // Toast messages - look for role="alert" or toast container
    this.successToast = page
      .locator('[role="alert"], [class*="toast"]')
      .filter({ hasText: /saved|success/i });
    this.errorToast = page
      .locator('[role="alert"], [class*="toast"]')
      .filter({ hasText: /error|failed/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/settings');
    await this.page.waitForLoadState('networkidle');
  }

  async waitForLoad(): Promise<void> {
    await this.pageTitle.waitFor({ state: 'visible', timeout: 15000 });
  }

  async toggleEmailNotifications(): Promise<void> {
    await this.emailNotificationsToggle.click();
  }

  async toggleAnalytics(): Promise<void> {
    await this.analyticsToggle.click();
  }

  async toggleEvolutionEmail(): Promise<void> {
    await this.evolutionEmailToggle.click();
  }

  async toggleCharacterCounter(): Promise<void> {
    await this.characterCounterToggle.click();
  }

  async toggleMarketing(): Promise<void> {
    await this.marketingToggle.click();
  }

  async selectDefaultTone(tone: 'fusion' | 'gentle' | 'intense'): Promise<void> {
    await this.defaultToneSelect.selectOption(tone);
  }

  async selectReflectionReminders(option: 'off' | 'daily' | 'weekly'): Promise<void> {
    await this.reflectionRemindersSelect.selectOption(option);
  }

  async selectReduceMotion(option: 'null' | 'true' | 'false'): Promise<void> {
    await this.reduceMotionSelect.selectOption(option);
  }

  // Assertions
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/settings/);
    await this.waitForLoad();
  }

  async expectAllSectionsVisible(): Promise<void> {
    await expect(this.notificationSection).toBeVisible();
    await expect(this.reflectionSection).toBeVisible();
    await expect(this.displaySection).toBeVisible();
    await expect(this.privacySection).toBeVisible();
  }

  async expectNotificationSectionVisible(): Promise<void> {
    await expect(this.notificationSection).toBeVisible();
  }

  async expectSaveSuccess(): Promise<void> {
    await expect(this.successToast).toBeVisible({ timeout: 5000 });
  }

  async expectSaveError(): Promise<void> {
    await expect(this.errorToast).toBeVisible({ timeout: 5000 });
  }
}
