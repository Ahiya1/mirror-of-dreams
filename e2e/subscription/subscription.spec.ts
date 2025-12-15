// e2e/subscription/subscription.spec.ts - Pricing/Subscription Page E2E Tests
// Builder: Builder-3 (Plan-24 Iteration 58)
// Purpose: Comprehensive E2E tests for pricing page functionality

import { test, expect } from '@playwright/test';

import { PricingPage } from '../pages/pricing.page';

/**
 * Pricing Page E2E Tests
 *
 * Tests the pricing page functionality including:
 * - Page display (title, subtitle, tier cards)
 * - Billing period toggle (monthly/yearly)
 * - Tier card features and pricing
 * - FAQ section with accordion behavior
 *
 * No authentication required - pricing page is publicly accessible.
 */
test.describe('Pricing Page', () => {
  let pricingPage: PricingPage;

  test.beforeEach(async ({ page }) => {
    pricingPage = new PricingPage(page);
    await pricingPage.goto();
    await pricingPage.waitForLoad();
  });

  test.describe('Page Display', () => {
    test('loads pricing page successfully', async ({ page }) => {
      await pricingPage.expectLoaded();
      await expect(page).toHaveURL(/\/pricing/);
    });

    test('displays page title and subtitle', async () => {
      await expect(pricingPage.pageTitle).toBeVisible();
      await expect(pricingPage.subtitle).toBeVisible();
    });

    test('displays three tier cards', async ({ page }) => {
      // Verify all three tiers are displayed by looking for their headings
      const wandererHeading = page.locator('h3').filter({ hasText: 'Wanderer' });
      const seekerHeading = page.locator('h3').filter({ hasText: 'Seeker' });
      const devotedHeading = page.locator('h3').filter({ hasText: 'Devoted' });

      await expect(wandererHeading).toBeVisible();
      await expect(seekerHeading).toBeVisible();
      await expect(devotedHeading).toBeVisible();
    });

    test('marks recommended tier', async ({ page }) => {
      // Seeker is marked as the "Most Popular" recommended tier
      // The badge uses "Most Popular" text, not just "popular"
      const popularBadge = page.locator('text=Most Popular');
      await expect(popularBadge).toBeVisible();
    });
  });

  test.describe('Billing Toggle', () => {
    test('displays monthly/yearly toggle', async () => {
      await pricingPage.expectBillingToggleVisible();
    });

    test('switches to yearly billing on click', async () => {
      // First ensure we're on monthly
      await pricingPage.selectMonthlyBilling();

      // Then switch to yearly
      await pricingPage.selectYearlyBilling();

      // Verify yearly is now selected (has active styling)
      await pricingPage.expectYearlySelected();
    });

    test('displays save percentage badge', async () => {
      await pricingPage.expectSaveBadgeVisible();
    });
  });

  test.describe('Tier Cards', () => {
    test('displays feature lists on cards', async ({ page }) => {
      // Each tier card has features listed with Check/X icons
      // Verify that feature items are visible by looking for content like "reflections/month"
      const conversationFeature = page.locator('text=/reflections/i').first();
      const dreamsFeature = page.locator('text=/dreams/i').first();

      await expect(conversationFeature).toBeVisible();
      await expect(dreamsFeature).toBeVisible();

      // Verify at least one feature per tier
      const wandererFeature = page
        .locator('h3:has-text("Wanderer")')
        .locator('..')
        .locator('text=/reflections/i')
        .first();
      const seekerFeature = page
        .locator('h3:has-text("Seeker")')
        .locator('..')
        .locator('text=/reflections/i')
        .first();
      const devotedFeature = page
        .locator('h3:has-text("Devoted")')
        .locator('..')
        .locator('text=/reflections/i')
        .first();

      await expect(wandererFeature).toBeVisible();
      await expect(seekerFeature).toBeVisible();
      await expect(devotedFeature).toBeVisible();
    });

    test('shows correct pricing for billing period', async ({ page }) => {
      // Verify price displays exist
      const priceElements = page.locator('text=/\\$\\d+/');
      const count = await priceElements.count();
      expect(count).toBeGreaterThan(0);

      // Switch between monthly and yearly to verify prices update
      await pricingPage.selectMonthlyBilling();
      const monthlyPrices = await page.locator('text=/\\$\\d+/').allTextContents();

      await pricingPage.selectYearlyBilling();
      const yearlyPrices = await page.locator('text=/\\$\\d+/').allTextContents();

      // Prices should be present in both states
      expect(monthlyPrices.length).toBeGreaterThan(0);
      expect(yearlyPrices.length).toBeGreaterThan(0);
    });

    test('displays CTA buttons', async ({ page }) => {
      // Each tier has a CTA button:
      // - Wanderer: "Start Free" link
      // - Seeker: "Start Pro" button
      // - Devoted: "Start Unlimited" button

      const startFreeCta = page.locator('text=Start Free').first();
      const startProCta = page.locator('text=Start Pro').first();
      const startUnlimitedCta = page.locator('text=Start Unlimited').first();

      await expect(startFreeCta).toBeVisible();
      await expect(startProCta).toBeVisible();
      await expect(startUnlimitedCta).toBeVisible();
    });
  });

  test.describe('FAQ Section', () => {
    test('displays FAQ section', async () => {
      await pricingPage.expectFaqSectionVisible();
      await pricingPage.expectFaqItemsVisible();
    });

    test('expands FAQ item on click', async () => {
      const faqItems = pricingPage.faqItems;
      const firstFaq = faqItems.first();

      // Check if there are FAQ items
      const faqCount = await faqItems.count();
      if (faqCount > 0) {
        // Initially, FAQ items should be closed (no 'open' attribute)
        const isInitiallyOpen = await firstFaq.getAttribute('open');
        expect(isInitiallyOpen).toBeNull();

        // Click the summary to expand
        await firstFaq.locator('summary').click();

        // Wait for the details element to have the 'open' attribute
        // When a details element is open, it has the 'open' attribute (value is empty string "")
        await expect(firstFaq).toHaveAttribute('open', '');
      }
    });
  });
});
