// e2e/pages/dreams.page.ts - Dreams Page Object Model

import { Page, Locator, expect } from '@playwright/test';

/**
 * Dreams Page Object
 *
 * Encapsulates all interactions with the dreams list page.
 * Based on app/dreams/page.tsx structure.
 *
 * Dreams page structure:
 * - Header with title and Create Dream button
 * - Limits info (X / Y dreams)
 * - Status filter buttons (Active, Achieved, Archived, All)
 * - Dreams grid with DreamCard components
 * - Empty state when no dreams
 * - Bottom navigation (mobile)
 */
export class DreamsPage {
  readonly page: Page;

  // Header elements
  readonly pageTitle: Locator;
  readonly createDreamButton: Locator;
  readonly headerCard: Locator;

  // Limits info
  readonly limitsInfo: Locator;

  // Filter buttons
  readonly filterActive: Locator;
  readonly filterAchieved: Locator;
  readonly filterArchived: Locator;
  readonly filterAll: Locator;
  readonly filterContainer: Locator;

  // Dream cards
  readonly dreamCards: Locator;
  readonly dreamGrid: Locator;

  // Empty state
  readonly emptyState: Locator;
  readonly emptyStateCta: Locator;

  // Create modal
  readonly createModal: Locator;

  // Loading states
  readonly cosmicLoader: Locator;
  readonly loadingMessage: Locator;

  // Navigation
  readonly bottomNavigation: Locator;
  readonly appNavigation: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header elements - based on dreams/page.tsx
    this.pageTitle = page.locator('text=Your Dreams').first();
    this.createDreamButton = page.locator(
      'button:has-text("Create Dream"), button:has-text("+ Create")'
    );
    this.headerCard = page.locator('.glass-card, [class*="GlassCard"]').first();

    // Limits info - matches "X / Y dreams" or "X / infinity dreams" pattern
    this.limitsInfo = page.locator('text=/\\d+\\s*\\/\\s*(\\d+|\\u221e)\\s*dreams/i');

    // Filter buttons - based on GlowButton with filter text
    this.filterActive = page.locator('button:has-text("Active")');
    this.filterAchieved = page.locator('button:has-text("Achieved")');
    this.filterArchived = page.locator('button:has-text("Archived")');
    this.filterAll = page.locator('button:has-text("All")').last(); // "All" might appear in other contexts
    this.filterContainer = page.locator('.flex.flex-wrap.gap-3').first();

    // Dream cards - based on DreamCard component
    this.dreamCards = page.locator(
      '[class*="glass-card"][class*="interactive"], .glass-card.elevated.interactive'
    );
    this.dreamGrid = page.locator('.grid.grid-cols-1');

    // Empty state - based on EmptyState component
    this.emptyState = page.locator('text=/Dream big|Create Your First/i');
    this.emptyStateCta = page.locator('button:has-text("Create Your First Dream")');

    // Create modal
    this.createModal = page.locator('[role="dialog"], [class*="modal"]');

    // Loading states
    this.cosmicLoader = page.locator('[class*="cosmic-loader"], text=Loading');
    this.loadingMessage = page.locator('text=Gathering your dreams');

    // Navigation
    this.bottomNavigation = page
      .locator('nav.md\\:hidden, nav[aria-label="Main navigation"]')
      .first();
    this.appNavigation = page.locator('nav[role="navigation"]').first();
  }

  /**
   * Navigate to dreams page
   */
  async goto(): Promise<void> {
    await this.page.goto('/dreams');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for dreams page to load
   */
  async waitForLoad(): Promise<void> {
    // Wait for loader to disappear
    await this.loadingMessage.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
    await this.cosmicLoader.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});

    // Wait for either dream cards or empty state
    await Promise.race([
      this.dreamCards.first().waitFor({ state: 'visible', timeout: 15000 }),
      this.emptyState.waitFor({ state: 'visible', timeout: 15000 }),
      this.pageTitle.waitFor({ state: 'visible', timeout: 15000 }),
    ]).catch(() => {});
  }

  /**
   * Click create dream button
   */
  async clickCreateDream(): Promise<void> {
    await this.createDreamButton.click();
  }

  /**
   * Filter dreams by status
   */
  async filterByStatus(status: 'active' | 'achieved' | 'archived' | 'all'): Promise<void> {
    const filterMap = {
      active: this.filterActive,
      achieved: this.filterAchieved,
      archived: this.filterArchived,
      all: this.filterAll,
    };
    await filterMap[status].click();
    // Wait for filter to apply
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  /**
   * Click on a dream card by index
   */
  async clickDreamCard(index: number = 0): Promise<void> {
    await this.dreamCards.nth(index).click();
  }

  /**
   * Get the reflect button on a dream card
   */
  getDreamReflectButton(index: number = 0): Locator {
    return this.dreamCards.nth(index).locator('button:has-text("Reflect")');
  }

  /**
   * Click reflect on a dream card
   */
  async clickDreamReflect(index: number = 0): Promise<void> {
    await this.getDreamReflectButton(index).click();
  }

  /**
   * Get dream card count
   */
  async getDreamCount(): Promise<number> {
    return await this.dreamCards.count();
  }

  /**
   * Get dream card by title text
   */
  getDreamByTitle(title: string): Locator {
    return this.page.locator(`[class*="glass-card"]:has-text("${title}")`);
  }

  /**
   * Get dream card title by index
   */
  async getDreamTitle(index: number = 0): Promise<string> {
    const card = this.dreamCards.nth(index);
    const titleElement = card.locator('h3, .text-xl').first();
    return (await titleElement.textContent()) || '';
  }

  /**
   * Get dream card category emoji by index
   */
  async getDreamCategory(index: number = 0): Promise<string> {
    const card = this.dreamCards.nth(index);
    const emojiElement = card.locator('.text-4xl').first();
    return (await emojiElement.textContent()) || '';
  }

  /**
   * Check if empty state is displayed
   */
  async isEmptyStateVisible(): Promise<boolean> {
    return await this.emptyState.isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Get limits text
   */
  async getLimitsText(): Promise<string> {
    return (await this.limitsInfo.textContent()) || '';
  }

  // Assertions

  /**
   * Assert dreams page has loaded
   */
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/dreams/);
    await this.waitForLoad();
  }

  /**
   * Assert page title is visible
   */
  async expectTitleVisible(): Promise<void> {
    await expect(this.pageTitle).toBeVisible({ timeout: 10000 });
  }

  /**
   * Assert create dream button is visible
   */
  async expectCreateButtonVisible(): Promise<void> {
    await expect(this.createDreamButton.first()).toBeVisible({ timeout: 10000 });
  }

  /**
   * Assert create dream button is disabled (at limit)
   */
  async expectCreateButtonDisabled(): Promise<void> {
    await expect(this.createDreamButton.first()).toBeDisabled();
  }

  /**
   * Assert create dream button is enabled
   */
  async expectCreateButtonEnabled(): Promise<void> {
    await expect(this.createDreamButton.first()).toBeEnabled();
  }

  /**
   * Assert filter buttons are visible
   */
  async expectFiltersVisible(): Promise<void> {
    await expect(this.filterActive).toBeVisible({ timeout: 10000 });
    await expect(this.filterAchieved).toBeVisible({ timeout: 10000 });
    await expect(this.filterArchived).toBeVisible({ timeout: 10000 });
    await expect(this.filterAll).toBeVisible({ timeout: 10000 });
  }

  /**
   * Assert specific filter is selected (has primary variant)
   */
  async expectFilterSelected(status: 'active' | 'achieved' | 'archived' | 'all'): Promise<void> {
    const filterMap = {
      active: this.filterActive,
      achieved: this.filterAchieved,
      archived: this.filterArchived,
      all: this.filterAll,
    };
    // Primary variant buttons have specific styling
    await expect(filterMap[status]).toHaveClass(/primary/i);
  }

  /**
   * Assert dream cards are visible
   */
  async expectDreamsVisible(minCount: number = 1): Promise<void> {
    await expect(this.dreamCards.first()).toBeVisible({ timeout: 10000 });
    const count = await this.dreamCards.count();
    expect(count).toBeGreaterThanOrEqual(minCount);
  }

  /**
   * Assert empty state is visible
   */
  async expectEmptyState(): Promise<void> {
    await expect(this.emptyState).toBeVisible({ timeout: 10000 });
  }

  /**
   * Assert empty state has create CTA
   */
  async expectEmptyStateCta(): Promise<void> {
    await expect(this.emptyStateCta).toBeVisible({ timeout: 10000 });
  }

  /**
   * Assert limits info is visible
   */
  async expectLimitsVisible(): Promise<void> {
    await expect(this.limitsInfo).toBeVisible({ timeout: 10000 });
  }

  /**
   * Assert create modal is visible
   */
  async expectCreateModalVisible(): Promise<void> {
    await expect(this.createModal).toBeVisible({ timeout: 5000 });
  }

  /**
   * Assert create modal is hidden
   */
  async expectCreateModalHidden(): Promise<void> {
    await expect(this.createModal).not.toBeVisible();
  }

  /**
   * Assert bottom navigation is visible (mobile)
   */
  async expectBottomNavVisible(): Promise<void> {
    await expect(this.bottomNavigation).toBeVisible({ timeout: 5000 });
  }

  /**
   * Assert bottom navigation is hidden (desktop)
   */
  async expectBottomNavHidden(): Promise<void> {
    await expect(this.bottomNavigation).not.toBeVisible();
  }

  /**
   * Assert dream card has title
   */
  async expectDreamCardHasTitle(index: number = 0): Promise<void> {
    const card = this.dreamCards.nth(index);
    const title = card.locator('h3, .text-xl').first();
    await expect(title).toBeVisible();
    await expect(title).not.toBeEmpty();
  }

  /**
   * Assert dream card has category emoji
   */
  async expectDreamCardHasCategory(index: number = 0): Promise<void> {
    const card = this.dreamCards.nth(index);
    const emoji = card.locator('.text-4xl').first();
    await expect(emoji).toBeVisible();
  }

  /**
   * Assert dream card has reflect button
   */
  async expectDreamCardHasReflectButton(index: number = 0): Promise<void> {
    await expect(this.getDreamReflectButton(index)).toBeVisible();
  }

  /**
   * Assert dream card has status badge
   */
  async expectDreamCardHasStatus(index: number = 0): Promise<void> {
    const card = this.dreamCards.nth(index);
    const badge = card.locator('[class*="badge"], [class*="Badge"]').first();
    await expect(badge).toBeVisible();
  }
}
