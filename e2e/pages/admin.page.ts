// e2e/pages/admin.page.ts - Admin Dashboard Page Object Model
// Builder: Builder-1 (Plan-24 Iteration 58)
// Purpose: Encapsulates interactions with the admin dashboard

import { Page, Locator, expect } from '@playwright/test';

/**
 * Admin Page Object
 *
 * Encapsulates all interactions with the admin dashboard.
 *
 * Page structure:
 * - Header: title "Admin Dashboard" with Admin/Creator badge
 * - Stats grid: Total Users, Free Tier, Pro Tier, Unlimited
 * - Secondary stats: Total Reflections, Evolution Reports, Artifacts
 * - Recent Users table
 * - Webhook Events table
 */
export class AdminPage {
  readonly page: Page;

  // Header
  readonly pageTitle: Locator;
  readonly roleBadge: Locator;
  readonly subtitle: Locator;

  // Stat cards - primary row
  readonly totalUsersCard: Locator;
  readonly freeTierCard: Locator;
  readonly proTierCard: Locator;
  readonly unlimitedCard: Locator;

  // Stat cards - secondary row
  readonly totalReflectionsCard: Locator;
  readonly evolutionReportsCard: Locator;
  readonly artifactsCard: Locator;

  // Users table
  readonly usersSection: Locator;
  readonly usersSectionHeader: Locator;
  readonly usersTable: Locator;
  readonly userRows: Locator;
  readonly emailColumn: Locator;
  readonly tierColumn: Locator;
  readonly statusColumn: Locator;

  // Webhook events table
  readonly webhookSection: Locator;
  readonly webhookSectionHeader: Locator;
  readonly webhookTable: Locator;
  readonly webhookRows: Locator;

  // Loading/Error states
  readonly loader: Locator;
  readonly errorDisplay: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header - find GradientText containing "Admin Dashboard"
    this.pageTitle = page
      .locator('h1, [class*="GradientText"]')
      .filter({ hasText: /Admin Dashboard/i });
    this.roleBadge = page
      .locator('span')
      .filter({ hasText: /^(Admin|Creator)$/i })
      .first();
    this.subtitle = page.locator('text=/system overview/i');

    // Stat cards - find by their label text with emoji
    this.totalUsersCard = page.locator('text=Total Users').locator('..').locator('..');
    this.freeTierCard = page.locator('text=Free Tier').locator('..').locator('..');
    this.proTierCard = page.locator('text=Pro Tier').locator('..').locator('..');
    this.unlimitedCard = page.locator('text=Unlimited').locator('..').locator('..');
    this.totalReflectionsCard = page.locator('text=Total Reflections').locator('..').locator('..');
    this.evolutionReportsCard = page.locator('text=Evolution Reports').locator('..').locator('..');
    this.artifactsCard = page.locator('text=Artifacts').locator('..').locator('..');

    // Users section - find by h2 header
    this.usersSectionHeader = page.locator('h2').filter({ hasText: /Recent Users/i });
    this.usersSection = this.usersSectionHeader.locator('..').locator('..');
    this.usersTable = page.locator('table').first();
    this.userRows = this.usersTable.locator('tbody tr');
    this.emailColumn = this.usersTable.locator('th').filter({ hasText: 'Email' });
    this.tierColumn = this.usersTable.locator('th').filter({ hasText: 'Tier' });
    this.statusColumn = this.usersTable.locator('th').filter({ hasText: 'Status' });

    // Webhook section
    this.webhookSectionHeader = page.locator('h2').filter({ hasText: /Webhook Events/i });
    this.webhookSection = this.webhookSectionHeader.locator('..').locator('..');
    this.webhookTable = page.locator('table').last();
    this.webhookRows = this.webhookTable.locator('tbody tr');

    // States
    this.loader = page.locator('[class*="loader"], [class*="loading"], [class*="CosmicLoader"]');
    this.errorDisplay = page.locator('[class*="error"]').filter({ hasText: /error/i });
    this.emptyState = page.locator('text=/no users|no events|no webhook/i');
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin');
    await this.page.waitForLoadState('networkidle');
  }

  async waitForLoad(): Promise<void> {
    await this.pageTitle.waitFor({ state: 'visible', timeout: 15000 });
  }

  async getStatValue(card: Locator): Promise<string> {
    const valueElement = card.locator('[class*="text-2xl"], [class*="text-3xl"], p').first();
    return (await valueElement.textContent()) || '';
  }

  async getTotalUsersCount(): Promise<string> {
    return this.getStatValue(this.totalUsersCard);
  }

  async getUserRowCount(): Promise<number> {
    return this.userRows.count();
  }

  async getWebhookRowCount(): Promise<number> {
    return this.webhookRows.count();
  }

  // Assertions
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/admin/);
    await this.waitForLoad();
  }

  async expectRedirectToSignIn(): Promise<void> {
    await expect(this.page).toHaveURL(/\/auth\/signin/);
  }

  async expectRedirectToDashboard(): Promise<void> {
    await expect(this.page).toHaveURL(/\/dashboard/);
  }

  async expectRoleBadgeVisible(): Promise<void> {
    await expect(this.roleBadge).toBeVisible();
  }

  async expectStatsVisible(): Promise<void> {
    await expect(this.totalUsersCard).toBeVisible();
    await expect(this.freeTierCard).toBeVisible();
    await expect(this.proTierCard).toBeVisible();
  }

  async expectSecondaryStatsVisible(): Promise<void> {
    await expect(this.totalReflectionsCard).toBeVisible();
    await expect(this.evolutionReportsCard).toBeVisible();
    await expect(this.artifactsCard).toBeVisible();
  }

  async expectUsersTableVisible(): Promise<void> {
    await expect(this.usersSectionHeader).toBeVisible();
    await expect(this.usersTable).toBeVisible();
  }

  async expectUsersTableColumns(): Promise<void> {
    await expect(this.emailColumn).toBeVisible();
    await expect(this.tierColumn).toBeVisible();
    await expect(this.statusColumn).toBeVisible();
  }

  async expectWebhookSectionVisible(): Promise<void> {
    await expect(this.webhookSectionHeader).toBeVisible();
  }

  async expectUserRowsOrEmptyState(): Promise<void> {
    const rowCount = await this.userRows.count();
    if (rowCount === 0) {
      await expect(this.page.locator('text=/no users found/i')).toBeVisible();
    } else {
      expect(rowCount).toBeGreaterThan(0);
    }
  }
}
