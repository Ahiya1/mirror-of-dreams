// e2e/pages/profile.page.ts - Profile Page Object Model
// Builder: Builder-1 (Plan-24 Iteration 58)
// Purpose: Encapsulates interactions with the profile page

import { Page, Locator, expect } from '@playwright/test';

/**
 * Profile Page Object
 *
 * Encapsulates all interactions with the profile page.
 *
 * Page structure:
 * - Page title "Profile"
 * - Demo user banner (if demo account)
 * - AccountInfoSection: name, email, member since
 * - SubscriptionStatusCard: tier and billing info
 * - Usage Statistics: reflections this month, total, clarify sessions
 * - AccountActionsSection: change password
 * - DangerZoneSection: delete account
 */
export class ProfilePage {
  readonly page: Page;

  // Page title
  readonly pageTitle: Locator;

  // Demo user banner
  readonly demoBanner: Locator;

  // Account info section
  readonly nameDisplay: Locator;
  readonly nameInput: Locator;
  readonly editNameButton: Locator;
  readonly saveNameButton: Locator;
  readonly cancelNameButton: Locator;
  readonly emailDisplay: Locator;
  readonly memberSinceDisplay: Locator;

  // Subscription section
  readonly subscriptionCard: Locator;
  readonly currentTierDisplay: Locator;

  // Usage statistics
  readonly usageStatsCard: Locator;
  readonly reflectionsThisMonth: Locator;
  readonly totalReflections: Locator;
  readonly clarifySessionsDisplay: Locator;

  // Account actions
  readonly changePasswordButton: Locator;
  readonly currentPasswordInput: Locator;
  readonly newPasswordInput: Locator;
  readonly savePasswordButton: Locator;
  readonly cancelPasswordButton: Locator;

  // Danger zone
  readonly deleteAccountButton: Locator;
  readonly deleteModal: Locator;
  readonly confirmEmailInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly confirmDeleteButton: Locator;
  readonly cancelDeleteButton: Locator;

  // Loading/Messages
  readonly loader: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // Page elements
    this.pageTitle = page.locator('h1').filter({ hasText: 'Profile' });
    this.demoBanner = page.locator('[class*="info"]').filter({ hasText: /demo/i });

    // Account info - use semantic selectors
    this.nameDisplay = page.locator('text=Name').locator('..').locator('p, span').first();
    this.nameInput = page.locator('input[placeholder*="name"], input[id*="name"]').first();
    this.editNameButton = page.getByRole('button', { name: /edit/i }).first();
    this.saveNameButton = page.getByRole('button', { name: /save/i }).first();
    this.cancelNameButton = page.getByRole('button', { name: /cancel/i }).first();
    this.emailDisplay = page.locator('text=Email').locator('..').locator('p, span').first();
    this.memberSinceDisplay = page.locator('text=/member since/i');

    // Subscription
    this.subscriptionCard = page.locator('text=Subscription').locator('..').locator('..').first();
    this.currentTierDisplay = page.locator('text=/tier|plan/i').locator('..').first();

    // Usage
    this.usageStatsCard = page.locator('text=Usage Statistics').locator('..').first();
    this.reflectionsThisMonth = page
      .locator('text=Reflections This Month')
      .locator('..')
      .locator('p')
      .last();
    this.totalReflections = page
      .locator('text=Total Reflections')
      .locator('..')
      .locator('p')
      .last();
    this.clarifySessionsDisplay = page.locator('text=Clarify Sessions').locator('..').first();

    // Password
    this.changePasswordButton = page.getByRole('button', { name: /change password/i });
    this.currentPasswordInput = page
      .locator('input[placeholder*="current"], input[type="password"]')
      .first();
    this.newPasswordInput = page.locator('input[placeholder*="new"]');
    this.savePasswordButton = page.getByRole('button', { name: /save|update/i }).nth(1);
    this.cancelPasswordButton = page.getByRole('button', { name: /cancel/i });

    // Delete account
    this.deleteAccountButton = page.getByRole('button', { name: /delete account/i });
    this.deleteModal = page
      .locator('[role="dialog"], [class*="modal"]')
      .filter({ hasText: /delete/i });
    this.confirmEmailInput = page.locator('input[placeholder*="email"]');
    this.confirmPasswordInput = page.locator('input[type="password"]').last();
    this.confirmDeleteButton = page.getByRole('button', { name: /confirm|delete/i }).last();
    this.cancelDeleteButton = page
      .locator('[role="dialog"]')
      .getByRole('button', { name: /cancel/i });

    // Loading/Messages
    this.loader = page.locator('[class*="loader"], [class*="loading"], [class*="spinner"]');
    this.successMessage = page.locator('.status-box-success, [class*="success"]');
    this.errorMessage = page.locator('.status-box-error, [class*="error"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/profile');
    await this.page.waitForLoadState('networkidle');
  }

  async waitForLoad(): Promise<void> {
    await this.pageTitle.waitFor({ state: 'visible', timeout: 15000 });
  }

  async editName(newName: string): Promise<void> {
    await this.editNameButton.click();
    await this.nameInput.clear();
    await this.nameInput.fill(newName);
    await this.saveNameButton.click();
  }

  async openDeleteModal(): Promise<void> {
    await this.deleteAccountButton.click();
    await this.deleteModal.waitFor({ state: 'visible', timeout: 5000 });
  }

  // Assertions
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/profile/);
    await this.waitForLoad();
  }

  async expectDemoBannerVisible(): Promise<void> {
    await expect(this.demoBanner).toBeVisible({ timeout: 5000 });
  }

  async expectNameDisplayed(name: string): Promise<void> {
    await expect(this.page.locator(`text=${name}`).first()).toBeVisible();
  }

  async expectEmailDisplayed(email: string): Promise<void> {
    await expect(this.page.locator(`text=${email}`).first()).toBeVisible();
  }

  async expectSuccessMessage(): Promise<void> {
    await expect(this.successMessage).toBeVisible({ timeout: 10000 });
  }

  async expectErrorMessage(): Promise<void> {
    await expect(this.errorMessage).toBeVisible({ timeout: 10000 });
  }

  async expectUsageStatsVisible(): Promise<void> {
    await expect(this.usageStatsCard).toBeVisible();
  }

  async expectSubscriptionCardVisible(): Promise<void> {
    await expect(this.subscriptionCard).toBeVisible();
  }

  async expectAccountActionsVisible(): Promise<void> {
    await expect(this.changePasswordButton).toBeVisible();
    await expect(this.deleteAccountButton).toBeVisible();
  }
}
