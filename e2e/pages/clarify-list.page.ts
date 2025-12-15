// e2e/pages/clarify-list.page.ts - Clarify Sessions List Page Object
// Builder: Builder-1 (Plan-24 Iteration 58)
// Purpose: Encapsulates interactions with the clarify sessions list page

import { Page, Locator, expect } from '@playwright/test';

/**
 * Clarify List Page Object
 *
 * Encapsulates all interactions with the clarify sessions list page.
 *
 * Page structure:
 * - Header: GradientText "Clarify" with subtitle and "New Conversation" button
 * - Limits card: sessions used / sessions limit
 * - Filter buttons: Active, Archived, All
 * - Sessions list: cards with title, message count, timestamp, archived badge
 * - Empty state: when no sessions exist
 */
export class ClarifyListPage {
  readonly page: Page;

  // Header
  readonly pageTitle: Locator;
  readonly subtitle: Locator;
  readonly newConversationButton: Locator;

  // Limits display
  readonly limitsCard: Locator;
  readonly sessionsUsed: Locator;
  readonly limitReachedBanner: Locator;

  // Filters
  readonly activeFilter: Locator;
  readonly archivedFilter: Locator;
  readonly allFilter: Locator;

  // Session list
  readonly sessionCards: Locator;
  readonly sessionTitles: Locator;
  readonly sessionMessageCounts: Locator;
  readonly sessionTimestamps: Locator;
  readonly archivedBadges: Locator;

  // Session actions
  readonly moreOptionsButtons: Locator;
  readonly archiveButton: Locator;
  readonly restoreButton: Locator;
  readonly deleteButton: Locator;

  // Empty state
  readonly emptyState: Locator;
  readonly emptyStateButton: Locator;

  // Loading
  readonly loader: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header - find GradientText containing "Clarify"
    this.pageTitle = page
      .locator('[class*="GradientText"], h1')
      .filter({ hasText: /^Clarify$/i })
      .first();
    this.subtitle = page.locator('text=/explore what.*emerging/i');
    this.newConversationButton = page.locator('button').filter({ hasText: /new conversation/i });

    // Limits - find card with border-l-4 and sessions text
    this.limitsCard = page.locator('[class*="border-l-4"]').filter({ hasText: /sessions/i });
    this.sessionsUsed = page.locator('text=/\\d+ \\/ \\d+ sessions/i');
    this.limitReachedBanner = page.locator('text=/limit reached/i');

    // Filters - buttons in filter area
    this.activeFilter = page.locator('button').filter({ hasText: /^Active$/i });
    this.archivedFilter = page.locator('button').filter({ hasText: /^Archived$/i });
    this.allFilter = page.locator('button').filter({ hasText: /^All$/i });

    // Sessions - find GlassCard elements that contain message count
    this.sessionCards = page.locator('[class*="glass"], [class*="GlassCard"]').filter({
      has: page.locator('text=/messages/'),
    });
    this.sessionTitles = this.sessionCards.locator('h3');
    this.sessionMessageCounts = this.sessionCards.locator('text=/\\d+ messages/');
    this.sessionTimestamps = this.sessionCards.locator('text=/ago$/i');
    this.archivedBadges = page.locator('text=Archived');

    // Actions (in dropdown)
    this.moreOptionsButtons = page.locator('button[aria-label="Session options"]');
    this.archiveButton = page.locator('button').filter({ hasText: /^Archive$/i });
    this.restoreButton = page.locator('button').filter({ hasText: /^Restore$/i });
    this.deleteButton = page.locator('button').filter({ hasText: /^Delete$/i });

    // Empty state - look for EmptyState component
    this.emptyState = page.locator('text=/Start exploring/i').locator('..');
    this.emptyStateButton = page.locator('button').filter({ hasText: /start a conversation/i });

    // Loading
    this.loader = page.locator('[class*="loader"], [class*="CosmicLoader"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/clarify');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async waitForLoad(): Promise<void> {
    // Wait for either sessions list or empty state or limits card
    await Promise.race([
      this.sessionCards.first().waitFor({ state: 'visible', timeout: 15000 }),
      this.emptyState.waitFor({ state: 'visible', timeout: 15000 }),
      this.limitsCard.waitFor({ state: 'visible', timeout: 15000 }),
    ]).catch(() => {});
  }

  async createNewSession(): Promise<void> {
    await this.newConversationButton.click();
  }

  async clickSession(index: number): Promise<void> {
    await this.sessionCards.nth(index).click();
  }

  async filterActive(): Promise<void> {
    await this.activeFilter.click();
  }

  async filterArchived(): Promise<void> {
    await this.archivedFilter.click();
  }

  async filterAll(): Promise<void> {
    await this.allFilter.click();
  }

  async openSessionOptions(index: number): Promise<void> {
    // Hover to reveal the options button, then click
    await this.sessionCards.nth(index).hover();
    await this.moreOptionsButtons.nth(index).click();
  }

  async archiveSession(index: number): Promise<void> {
    await this.openSessionOptions(index);
    await this.archiveButton.click();
  }

  async restoreSession(index: number): Promise<void> {
    await this.openSessionOptions(index);
    await this.restoreButton.click();
  }

  async deleteSession(index: number): Promise<void> {
    await this.openSessionOptions(index);
    // Note: Delete requires confirmation dialog handling
    await this.deleteButton.click();
  }

  async getSessionCount(): Promise<number> {
    return this.sessionCards.count();
  }

  // Assertions
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/clarify/);
    await this.waitForLoad();
  }

  async expectRedirectToPricing(): Promise<void> {
    await expect(this.page).toHaveURL(/\/pricing/);
  }

  async expectRedirectToSignIn(): Promise<void> {
    await expect(this.page).toHaveURL(/\/auth\/signin/);
  }

  async expectPageTitleVisible(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
  }

  async expectLimitsDisplayed(): Promise<void> {
    await expect(this.limitsCard).toBeVisible();
    await expect(this.sessionsUsed).toBeVisible();
  }

  async expectFiltersVisible(): Promise<void> {
    await expect(this.activeFilter).toBeVisible();
    await expect(this.archivedFilter).toBeVisible();
    await expect(this.allFilter).toBeVisible();
  }

  async expectNewConversationButtonVisible(): Promise<void> {
    await expect(this.newConversationButton).toBeVisible();
  }

  async expectSessionsVisible(): Promise<void> {
    await expect(this.sessionCards.first()).toBeVisible();
  }

  async expectEmptyState(): Promise<void> {
    await expect(this.emptyState).toBeVisible();
  }

  async expectSessionHasTitle(index: number): Promise<void> {
    await expect(this.sessionTitles.nth(index)).toBeVisible();
  }

  async expectSessionHasMessageCount(index: number): Promise<void> {
    await expect(this.sessionMessageCounts.nth(index)).toBeVisible();
  }

  async expectSessionHasTimestamp(index: number): Promise<void> {
    await expect(this.sessionTimestamps.nth(index)).toBeVisible();
  }
}
