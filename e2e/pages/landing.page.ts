// e2e/pages/landing.page.ts - Landing Page Object Model

import { Page, Locator, expect } from '@playwright/test';

/**
 * Landing Page Object
 *
 * Encapsulates all interactions with the landing/homepage.
 *
 * Page structure:
 * - Navigation with Sign In button
 * - Hero section with headline and CTAs (Try It, Begin)
 * - Features section with 3 feature cards
 * - Footer with links and copyright
 */
export class LandingPage {
  readonly page: Page;

  // Navigation
  readonly navigation: Locator;
  readonly navLogo: Locator;
  readonly signInButton: Locator;
  readonly mobileMenuButton: Locator;
  readonly mobileMenu: Locator;
  readonly mobileSignInLink: Locator;

  // Hero section
  readonly heroSection: Locator;
  readonly heroTitle: Locator;
  readonly heroSubtitle: Locator;
  readonly ctaTryIt: Locator;
  readonly ctaBegin: Locator;

  // Features section
  readonly featuresSection: Locator;
  readonly featuresHeadline: Locator;
  readonly featureCards: Locator;

  // Footer
  readonly footer: Locator;
  readonly footerBrand: Locator;
  readonly footerPricingLink: Locator;
  readonly footerAboutLink: Locator;
  readonly footerPrivacyLink: Locator;
  readonly footerTermsLink: Locator;
  readonly copyright: Locator;

  constructor(page: Page) {
    this.page = page;

    // Navigation - use more robust selectors
    // Note: The navigation is not in a nav element, it's in a div at the top
    this.navigation = page
      .locator('a[href="/"]')
      .filter({ hasText: /Mirror of Dreams/i })
      .first()
      .locator('..')
      .locator('..');
    this.navLogo = page
      .locator('a[href="/"]')
      .filter({ hasText: /Mirror of Dreams/i })
      .first();
    this.signInButton = page.locator('button:has-text("Sign In")').first();
    this.mobileMenuButton = page.locator('button[aria-label="Toggle menu"]');
    this.mobileMenu = page.locator('.border-b.border-white\\/10');
    this.mobileSignInLink = page.locator('a[href="/auth/signin"]');

    // Hero
    this.heroSection = page.locator('section').first();
    this.heroTitle = page.locator('h1').first();
    this.heroSubtitle = page.locator('h1 + p, h1 ~ p').first();
    this.ctaTryIt = page.locator('button:has-text("Try It")');
    this.ctaBegin = page.locator('button:has-text("Begin")');

    // Features - use more robust selectors
    this.featuresSection = page.locator('#features');
    this.featuresHeadline = page.locator('h2').filter({ hasText: /Space for Dreamers/i });
    this.featureCards = page.locator('#features h3');

    // Footer
    this.footer = page.locator('footer');
    this.footerBrand = page.locator('footer h3');
    this.footerPricingLink = page.locator('footer a[href="/pricing"]');
    this.footerAboutLink = page.locator('footer a[href="/about"]');
    this.footerPrivacyLink = page.locator('footer a[href="/privacy"]');
    this.footerTermsLink = page.locator('footer a[href="/terms"]');
    this.copyright = page
      .locator('footer')
      .locator('text=/Mirror of Dreams.*All rights reserved/i');
  }

  /**
   * Navigate to landing page
   * Uses element wait instead of waitForLoadState for CI reliability
   */
  async goto(): Promise<void> {
    await this.page.goto('/');
    // Wait for the hero title to be visible - more reliable than waitForLoadState
    await this.heroTitle.waitFor({ state: 'visible', timeout: 15000 });
  }

  /**
   * Click sign in button
   */
  async clickSignIn(): Promise<void> {
    await this.signInButton.click();
  }

  /**
   * Click Try It CTA (demo login)
   */
  async clickTryIt(): Promise<void> {
    await this.ctaTryIt.click();
  }

  /**
   * Click Begin CTA (signup)
   */
  async clickBegin(): Promise<void> {
    await this.ctaBegin.click();
  }

  /**
   * Open mobile menu
   */
  async openMobileMenu(): Promise<void> {
    await this.mobileMenuButton.click();
  }

  /**
   * Click sign in on mobile menu
   */
  async clickMobileSignIn(): Promise<void> {
    await this.openMobileMenu();
    // Wait for menu animation to complete
    await this.page.waitForTimeout(300);
    // Click the mobile sign in link with force to bypass any overlay issues
    await this.mobileSignInLink.first().click({ force: true });
  }

  /**
   * Click pricing link in footer
   */
  async clickPricing(): Promise<void> {
    await this.footerPricingLink.click();
  }

  /**
   * Click about link in footer
   */
  async clickAbout(): Promise<void> {
    await this.footerAboutLink.click();
  }

  /**
   * Click privacy link in footer
   */
  async clickPrivacy(): Promise<void> {
    await this.footerPrivacyLink.click();
  }

  /**
   * Click terms link in footer
   */
  async clickTerms(): Promise<void> {
    await this.footerTermsLink.click();
  }

  /**
   * Scroll to features section
   */
  async scrollToFeatures(): Promise<void> {
    await this.featuresSection.scrollIntoViewIfNeeded();
    // Wait for scroll-triggered animations
    await this.page.waitForTimeout(500);
  }

  /**
   * Scroll to footer
   */
  async scrollToFooter(): Promise<void> {
    await this.footer.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(300);
  }

  // Assertions

  /**
   * Assert landing page loaded
   */
  async expectLoaded(): Promise<void> {
    // Landing page should be at root path
    await expect(this.page).toHaveURL(/^https?:\/\/[^/]+\/?(\?.*)?$/);
  }

  /**
   * Assert navigation is visible
   */
  async expectNavigationVisible(): Promise<void> {
    await expect(this.navigation).toBeVisible();
  }

  /**
   * Assert sign in button is visible
   */
  async expectSignInVisible(): Promise<void> {
    await expect(this.signInButton).toBeVisible();
  }

  /**
   * Assert hero section is visible
   */
  async expectHeroVisible(): Promise<void> {
    await expect(this.heroTitle).toBeVisible({ timeout: 10000 });
  }

  /**
   * Assert hero title contains expected text
   */
  async expectHeroTitle(text: string | RegExp): Promise<void> {
    await expect(this.heroTitle).toContainText(text);
  }

  /**
   * Assert hero subtitle is visible
   */
  async expectHeroSubtitleVisible(): Promise<void> {
    await expect(this.heroSubtitle).toBeVisible();
  }

  /**
   * Assert CTA buttons are visible
   */
  async expectCtaButtonsVisible(): Promise<void> {
    await expect(this.ctaTryIt).toBeVisible();
    await expect(this.ctaBegin).toBeVisible();
  }

  /**
   * Assert Try It button is visible
   */
  async expectTryItVisible(): Promise<void> {
    await expect(this.ctaTryIt).toBeVisible();
  }

  /**
   * Assert Begin button is visible
   */
  async expectBeginVisible(): Promise<void> {
    await expect(this.ctaBegin).toBeVisible();
  }

  /**
   * Assert features section is visible
   */
  async expectFeaturesVisible(): Promise<void> {
    await expect(this.featuresSection).toBeVisible({ timeout: 10000 });
  }

  /**
   * Assert features headline is visible
   */
  async expectFeaturesHeadlineVisible(): Promise<void> {
    await expect(this.featuresHeadline).toBeVisible();
  }

  /**
   * Assert feature cards are displayed
   */
  async expectFeatureCards(expectedCount: number = 3): Promise<void> {
    await expect(this.featureCards.first()).toBeVisible({ timeout: 10000 });
    const count = await this.featureCards.count();
    expect(count).toBe(expectedCount);
  }

  /**
   * Assert all feature cards have titles and descriptions
   */
  async expectFeatureCardsHaveContent(): Promise<void> {
    const cards = this.featureCards;
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      await expect(card).toBeVisible();
      await expect(card).not.toBeEmpty();
    }
  }

  /**
   * Assert footer is visible
   */
  async expectFooterVisible(): Promise<void> {
    await expect(this.footer).toBeVisible();
  }

  /**
   * Assert footer brand is visible
   */
  async expectFooterBrandVisible(): Promise<void> {
    await expect(this.footerBrand).toBeVisible();
    await expect(this.footerBrand).toContainText('Mirror of Dreams');
  }

  /**
   * Assert copyright is visible
   */
  async expectCopyrightVisible(): Promise<void> {
    await expect(this.copyright).toBeVisible();
  }

  /**
   * Assert footer has legal links
   */
  async expectLegalLinksVisible(): Promise<void> {
    await expect(this.footerPrivacyLink).toBeVisible();
    await expect(this.footerTermsLink).toBeVisible();
  }

  /**
   * Assert footer has product links
   */
  async expectProductLinksVisible(): Promise<void> {
    await expect(this.footerPricingLink).toBeVisible();
  }

  /**
   * Assert mobile menu button is visible (on mobile)
   */
  async expectMobileMenuButtonVisible(): Promise<void> {
    await expect(this.mobileMenuButton).toBeVisible();
  }

  /**
   * Assert mobile menu is open
   */
  async expectMobileMenuOpen(): Promise<void> {
    await expect(this.mobileMenu).toBeVisible();
  }
}
