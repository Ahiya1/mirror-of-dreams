// e2e/pages/dashboard.page.ts - Dashboard Page Object Model

import { Page, Locator, expect } from '@playwright/test';

/**
 * Dashboard Page Object
 *
 * Encapsulates all interactions with the dashboard page.
 * Follows existing patterns from signin.page.ts and signup.page.ts.
 *
 * Dashboard structure:
 * - DashboardHero: Personalized greeting + Reflect Now CTA
 * - DashboardGrid: 6-7 cards depending on user tier
 * - BottomNavigation: Mobile-only navigation
 */
export class DashboardPage {
  readonly page: Page;

  // Hero section elements
  readonly heroSection: Locator;
  readonly greetingText: Locator;
  readonly reflectNowButton: Locator;
  readonly heroSubtitle: Locator;

  // Dashboard cards
  readonly dreamsCard: Locator;
  readonly reflectionsCard: Locator;
  readonly progressCard: Locator;
  readonly evolutionCard: Locator;
  readonly visualizationCard: Locator;
  readonly subscriptionCard: Locator;
  readonly clarifyCard: Locator;

  // Card links/actions
  readonly dreamsCardLink: Locator;
  readonly reflectionsCardLink: Locator;
  readonly evolutionCardLink: Locator;

  // Navigation elements
  readonly appNavigation: Locator;
  readonly refreshButton: Locator;
  readonly bottomNavigation: Locator;

  // Loading states
  readonly cosmicLoader: Locator;
  readonly pageContainer: Locator;

  // Grid container
  readonly dashboardGrid: Locator;

  constructor(page: Page) {
    this.page = page;

    // Hero section - based on DashboardHero.tsx structure
    this.heroSection = page.locator('.dashboard-hero');
    this.greetingText = page.locator('.dashboard-hero__title');
    this.reflectNowButton = page.locator('.dashboard-hero__cta, button:has-text("Reflect Now")');
    this.heroSubtitle = page.locator('.dashboard-hero__subtitle');

    // Dashboard cards - based on card class names from components
    this.dreamsCard = page.locator('.dreams-card').first();
    this.reflectionsCard = page.locator('.reflections-card').first();
    this.progressCard = page.locator('.progress-stats-card, .progress-card').first();
    this.evolutionCard = page.locator('.evolution-card').first();
    this.visualizationCard = page.locator('.visualization-card').first();
    this.subscriptionCard = page.locator('.subscription-card').first();
    this.clarifyCard = page.locator('.clarify-card').first();

    // Card navigation links - "View All" links in card headers
    this.dreamsCardLink = page.locator('.dreams-card a:has-text("View All")');
    this.reflectionsCardLink = page.locator('.reflections-card a:has-text("View All")');
    this.evolutionCardLink = page.locator(
      '.evolution-card a:has-text("View"), .evolution-card a:has-text("Evolution")'
    );

    // Navigation - based on AppNavigation and BottomNavigation components
    this.appNavigation = page.locator('nav[role="navigation"]').first();
    this.refreshButton = page.locator('button[aria-label*="refresh"], button:has-text("Refresh")');
    this.bottomNavigation = page
      .locator('nav.md\\:hidden, nav[aria-label="Main navigation"]')
      .first();

    // Loading states
    this.cosmicLoader = page.locator('[class*="cosmic-loader"], text=Loading');
    this.pageContainer = page.locator('.dashboard');

    // Grid
    this.dashboardGrid = page.locator('.dashboard-grid, .dashboard-grid-container');
  }

  /**
   * Navigate to dashboard page
   */
  async goto(): Promise<void> {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for dashboard to fully load
   */
  async waitForLoad(): Promise<void> {
    // Wait for loader to disappear (if present)
    await this.cosmicLoader.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});

    // Wait for page container to be visible
    await this.pageContainer.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});

    // Wait for at least one card to be visible
    await this.page
      .locator('.dreams-card, .reflections-card, [class*="Card"]')
      .first()
      .waitFor({ state: 'visible', timeout: 15000 })
      .catch(() => {});
  }

  /**
   * Click the Reflect Now button
   */
  async clickReflectNow(): Promise<void> {
    await this.reflectNowButton.click();
  }

  /**
   * Click on dreams card "View All" link
   */
  async clickDreamsViewAll(): Promise<void> {
    await this.dreamsCardLink.click();
  }

  /**
   * Click on reflections card "View All" link
   */
  async clickReflectionsViewAll(): Promise<void> {
    await this.reflectionsCardLink.click();
  }

  /**
   * Click on evolution card link
   */
  async clickEvolutionCard(): Promise<void> {
    // Try clicking the "View" link first, then the whole card
    const viewLink = this.evolutionCard.locator('a').first();
    if (await viewLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await viewLink.click();
    } else {
      await this.evolutionCard.click();
    }
  }

  /**
   * Click refresh button in navigation
   */
  async clickRefresh(): Promise<void> {
    await this.refreshButton.click();
  }

  /**
   * Get the greeting text content
   */
  async getGreetingText(): Promise<string> {
    return (await this.greetingText.textContent()) || '';
  }

  /**
   * Get the number of visible cards
   */
  async getVisibleCardCount(): Promise<number> {
    const cards = this.page.locator(
      '.dreams-card, .reflections-card, .progress-stats-card, .evolution-card, .visualization-card, .subscription-card, .clarify-card'
    );
    return await cards.count();
  }

  /**
   * Check if bottom navigation is visible
   */
  async isBottomNavVisible(): Promise<boolean> {
    return await this.bottomNavigation.isVisible({ timeout: 2000 }).catch(() => false);
  }

  // Assertions

  /**
   * Assert dashboard has loaded successfully
   */
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/dashboard/);
    await this.waitForLoad();
  }

  /**
   * Assert hero section is visible
   */
  async expectHeroVisible(): Promise<void> {
    await expect(this.heroSection).toBeVisible({ timeout: 15000 });
  }

  /**
   * Assert personalized greeting is displayed
   */
  async expectGreetingVisible(): Promise<void> {
    await expect(this.greetingText).toBeVisible({ timeout: 10000 });
    // Greeting should contain "Good morning/afternoon/evening"
    await expect(this.greetingText).toContainText(/Good (morning|afternoon|evening)/i);
  }

  /**
   * Assert dreams card is visible
   */
  async expectDreamsCardVisible(): Promise<void> {
    await expect(this.dreamsCard).toBeVisible({ timeout: 10000 });
  }

  /**
   * Assert reflections card is visible
   */
  async expectReflectionsCardVisible(): Promise<void> {
    await expect(this.reflectionsCard).toBeVisible({ timeout: 10000 });
  }

  /**
   * Assert progress stats card is visible
   */
  async expectProgressCardVisible(): Promise<void> {
    await expect(this.progressCard).toBeVisible({ timeout: 10000 });
  }

  /**
   * Assert evolution card is visible
   */
  async expectEvolutionCardVisible(): Promise<void> {
    await expect(this.evolutionCard).toBeVisible({ timeout: 10000 });
  }

  /**
   * Assert visualization card is visible
   */
  async expectVisualizationCardVisible(): Promise<void> {
    await expect(this.visualizationCard).toBeVisible({ timeout: 10000 });
  }

  /**
   * Assert subscription card is visible
   */
  async expectSubscriptionCardVisible(): Promise<void> {
    await expect(this.subscriptionCard).toBeVisible({ timeout: 10000 });
  }

  /**
   * Assert clarify card is visible (paid users only)
   */
  async expectClarifyCardVisible(): Promise<void> {
    await expect(this.clarifyCard).toBeVisible({ timeout: 10000 });
  }

  /**
   * Assert clarify card is NOT visible (free users)
   */
  async expectClarifyCardHidden(): Promise<void> {
    await expect(this.clarifyCard).not.toBeVisible();
  }

  /**
   * Assert bottom navigation is visible (mobile only)
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
   * Assert reflect now button is visible
   */
  async expectReflectButtonVisible(): Promise<void> {
    await expect(this.reflectNowButton).toBeVisible({ timeout: 10000 });
  }

  /**
   * Assert reflect now button is disabled (no active dreams)
   */
  async expectReflectButtonDisabled(): Promise<void> {
    await expect(this.reflectNowButton).toBeDisabled();
  }

  /**
   * Assert reflect now button is enabled (has active dreams)
   */
  async expectReflectButtonEnabled(): Promise<void> {
    await expect(this.reflectNowButton).toBeEnabled();
  }

  /**
   * Assert navigation bar is visible
   */
  async expectNavigationVisible(): Promise<void> {
    await expect(this.appNavigation).toBeVisible({ timeout: 5000 });
  }

  /**
   * Assert dashboard grid is visible
   */
  async expectGridVisible(): Promise<void> {
    await expect(this.dashboardGrid).toBeVisible({ timeout: 10000 });
  }

  /**
   * Assert minimum number of cards are visible
   */
  async expectMinimumCards(minCount: number): Promise<void> {
    const count = await this.getVisibleCardCount();
    expect(count).toBeGreaterThanOrEqual(minCount);
  }
}
