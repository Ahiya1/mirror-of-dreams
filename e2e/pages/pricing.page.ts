// e2e/pages/pricing.page.ts - Pricing Page Object Model
// Builder: Builder-1 (Plan-24 Iteration 58)
// Purpose: Encapsulates interactions with the pricing page

import { Page, Locator, expect } from '@playwright/test';

/**
 * Pricing Page Object
 *
 * Encapsulates all interactions with the pricing page.
 *
 * Page structure:
 * - Header: title "Find Your Space" and subtitle
 * - Billing toggle: Monthly / Yearly buttons with "Save 17%" badge
 * - Tier cards: Wanderer (free), Seeker (pro, popular), Devoted (unlimited)
 * - FAQ section with expandable questions
 * - Footer
 */
export class PricingPage {
  readonly page: Page;

  // Header
  readonly pageTitle: Locator;
  readonly subtitle: Locator;

  // Billing toggle
  readonly monthlyButton: Locator;
  readonly yearlyButton: Locator;
  readonly saveBadge: Locator;

  // Tier cards
  readonly wandererCard: Locator;
  readonly seekerCard: Locator;
  readonly devotedCard: Locator;
  readonly popularBadge: Locator;

  // Card elements (generic)
  readonly tierCards: Locator;
  readonly priceDisplays: Locator;
  readonly featureLists: Locator;
  readonly ctaButtons: Locator;

  // FAQ
  readonly faqSection: Locator;
  readonly faqItems: Locator;
  readonly faqHeading: Locator;

  // Navigation
  readonly appNavigation: Locator;
  readonly landingNavigation: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header
    this.pageTitle = page.locator('h1').filter({ hasText: /find your space|pricing/i });
    this.subtitle = page.locator('text=/choose what feels right/i');

    // Billing toggle - buttons in the billing period section
    this.monthlyButton = page.locator('button').filter({ hasText: /^Monthly$/i });
    this.yearlyButton = page.locator('button').filter({ hasText: /^Yearly/i });
    this.saveBadge = page.locator('text=/save 17%/i');

    // Tier cards by name - use the PricingCard component structure
    this.wandererCard = page
      .locator('[class*="glass"], [class*="card"]')
      .filter({ hasText: 'Wanderer' })
      .first();
    this.seekerCard = page
      .locator('[class*="glass"], [class*="card"]')
      .filter({ hasText: 'Seeker' })
      .first();
    this.devotedCard = page
      .locator('[class*="glass"], [class*="card"]')
      .filter({ hasText: 'Devoted' })
      .first();
    this.popularBadge = page.locator('text=/popular/i');

    // Generic card elements - match cards that have tier names
    this.tierCards = page.locator('[class*="glass"], [class*="card"]').filter({
      hasText: /wanderer|seeker|devoted/i,
    });
    this.priceDisplays = page.locator('[class*="price"], text=/\\$\\d+/');
    this.featureLists = page.locator('ul');
    this.ctaButtons = page.locator('button').filter({ hasText: /get started|current|upgrade/i });

    // FAQ - find by heading
    this.faqHeading = page.locator('h2').filter({ hasText: /frequently asked questions/i });
    this.faqSection = this.faqHeading.locator('..');
    this.faqItems = page.locator('details');

    // Navigation
    this.appNavigation = page.locator('nav[role="navigation"]').first();
    this.landingNavigation = page.locator('nav').filter({ hasText: /sign in/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/pricing');
    await this.page.waitForLoadState('networkidle');
  }

  async waitForLoad(): Promise<void> {
    await this.pageTitle.waitFor({ state: 'visible', timeout: 15000 });
  }

  async selectMonthlyBilling(): Promise<void> {
    await this.monthlyButton.click();
  }

  async selectYearlyBilling(): Promise<void> {
    await this.yearlyButton.click();
  }

  async expandFaq(index: number): Promise<void> {
    await this.faqItems.nth(index).click();
  }

  async clickWandererCta(): Promise<void> {
    const cta = this.wandererCard.locator('button');
    await cta.click();
  }

  async clickSeekerCta(): Promise<void> {
    const cta = this.seekerCard.locator('button');
    await cta.click();
  }

  async clickDevotedCta(): Promise<void> {
    const cta = this.devotedCard.locator('button');
    await cta.click();
  }

  // Assertions
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/pricing/);
    await this.waitForLoad();
  }

  async expectThreeTierCards(): Promise<void> {
    await expect(this.wandererCard).toBeVisible();
    await expect(this.seekerCard).toBeVisible();
    await expect(this.devotedCard).toBeVisible();
  }

  async expectSeekerPopular(): Promise<void> {
    await expect(this.seekerCard.locator('text=/popular/i')).toBeVisible();
  }

  async expectYearlySelected(): Promise<void> {
    // The selected button has different styling (bg-white/20)
    await expect(this.yearlyButton).toHaveClass(/bg-white/);
  }

  async expectMonthlySelected(): Promise<void> {
    await expect(this.monthlyButton).toHaveClass(/bg-white/);
  }

  async expectFaqSectionVisible(): Promise<void> {
    await expect(this.faqHeading).toBeVisible();
  }

  async expectFaqItemsVisible(): Promise<void> {
    const count = await this.faqItems.count();
    expect(count).toBeGreaterThan(0);
  }

  async expectBillingToggleVisible(): Promise<void> {
    await expect(this.monthlyButton).toBeVisible();
    await expect(this.yearlyButton).toBeVisible();
  }

  async expectSaveBadgeVisible(): Promise<void> {
    await expect(this.saveBadge).toBeVisible();
  }
}
