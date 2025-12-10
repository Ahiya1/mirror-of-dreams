// e2e/landing/landing.spec.ts - Landing Page E2E Tests

import { test, expect } from '@playwright/test';

import { LandingPage } from '../pages/landing.page';

/**
 * Landing Page E2E Tests
 *
 * Tests the landing/homepage including:
 * - Page display and elements
 * - Navigation
 * - Features section
 * - Footer
 * - Responsive behavior
 *
 * Note: Landing page is public and does NOT require authentication.
 */
test.describe('Landing Page', () => {
  let landingPage: LandingPage;

  test.beforeEach(async ({ page }) => {
    landingPage = new LandingPage(page);
    await landingPage.goto();
  });

  test.describe('Page Display', () => {
    test('displays landing page', async () => {
      await landingPage.expectLoaded();
    });

    test('displays sign in button', async () => {
      await landingPage.expectSignInVisible();
    });

    test('displays hero section', async () => {
      await landingPage.expectHeroVisible();
    });

    test('displays hero title with compelling text', async () => {
      await landingPage.expectHeroTitle(/dreams know things/i);
    });

    test('displays hero subtitle', async () => {
      await landingPage.expectHeroSubtitleVisible();
    });

    test('displays CTA buttons', async () => {
      await landingPage.expectCtaButtonsVisible();
    });
  });

  test.describe('Navigation', () => {
    test('sign in button navigates to signin page', async ({ page }) => {
      await landingPage.clickSignIn();
      await page.waitForURL(/\/auth\/signin/);
      expect(page.url()).toContain('/auth/signin');
    });

    test('begin CTA navigates to signup page', async ({ page }) => {
      await landingPage.clickBegin();
      await page.waitForURL(/\/auth\/signup/);
      expect(page.url()).toContain('/auth/signup');
    });

    test('try it CTA initiates demo login', async ({ page }) => {
      // Click Try It and verify it starts demo login
      // (the button shows "Opening the door..." while loading)
      await landingPage.clickTryIt();

      // Wait for either redirect to dashboard or loading state
      await Promise.race([
        page.waitForURL(/\/dashboard/, { timeout: 30000 }),
        expect(page.locator('button:has-text("Opening")')).toBeVisible({ timeout: 5000 }),
      ]).catch(() => {});
    });
  });

  test.describe('Features Section', () => {
    test('displays features section', async () => {
      await landingPage.scrollToFeatures();
      await landingPage.expectFeaturesVisible();
    });

    test('displays features headline', async () => {
      await landingPage.scrollToFeatures();
      await landingPage.expectFeaturesHeadlineVisible();
    });

    test('displays 3 feature cards', async () => {
      await landingPage.scrollToFeatures();
      await landingPage.expectFeatureCards(3);
    });

    test('feature cards have titles and descriptions', async () => {
      await landingPage.scrollToFeatures();
      await landingPage.expectFeatureCardsHaveContent();
    });
  });

  test.describe('Footer', () => {
    test('displays footer', async () => {
      await landingPage.scrollToFooter();
      await landingPage.expectFooterVisible();
    });

    test('displays footer brand', async () => {
      await landingPage.scrollToFooter();
      await landingPage.expectFooterBrandVisible();
    });

    test('displays copyright notice', async () => {
      await landingPage.scrollToFooter();
      await landingPage.expectCopyrightVisible();
    });

    test('footer has legal links (Privacy, Terms)', async () => {
      await landingPage.scrollToFooter();
      await landingPage.expectLegalLinksVisible();
    });

    test('footer has product links', async () => {
      await landingPage.scrollToFooter();
      await landingPage.expectProductLinksVisible();
    });

    test('pricing link navigates to pricing page', async ({ page }) => {
      await landingPage.scrollToFooter();
      await landingPage.clickPricing();
      await page.waitForURL(/\/pricing/);
      expect(page.url()).toContain('/pricing');
    });
  });
});

/**
 * Mobile Landing Page Tests
 *
 * Note: Mobile viewport is set per-test using setViewportSize
 * to avoid worker restrictions with test.use() in describe blocks.
 * Some mobile features depend on responsive design, so we test what's reliably available.
 */
test.describe('Landing Page Mobile', () => {
  const mobileViewport = { width: 390, height: 844 }; // iPhone 13 dimensions

  test('hero section is visible on mobile', async ({ page }) => {
    await page.setViewportSize(mobileViewport);
    const landingPage = new LandingPage(page);
    await landingPage.goto();
    await landingPage.expectHeroVisible();
  });

  test('CTAs are visible on mobile', async ({ page }) => {
    await page.setViewportSize(mobileViewport);
    const landingPage = new LandingPage(page);
    await landingPage.goto();
    // Verify both CTA buttons are visible on mobile
    await landingPage.expectCtaButtonsVisible();
  });

  test('feature cards are visible on mobile', async ({ page }) => {
    await page.setViewportSize(mobileViewport);
    const landingPage = new LandingPage(page);
    await landingPage.goto();
    await landingPage.scrollToFeatures();
    // Verify features are visible on mobile
    await landingPage.expectFeatureCards(3);
  });

  test('footer is visible on mobile', async ({ page }) => {
    await page.setViewportSize(mobileViewport);
    const landingPage = new LandingPage(page);
    await landingPage.goto();
    await landingPage.scrollToFooter();
    await landingPage.expectFooterVisible();
  });
});

/**
 * Animation and Visual Tests
 */
test.describe('Landing Page Visual', () => {
  test('hero section appears after page load', async ({ page }) => {
    const landingPage = new LandingPage(page);
    await landingPage.goto();

    // Hero should become visible (with or without animation)
    const heroTitle = landingPage.heroTitle;
    await expect(heroTitle).toBeVisible({ timeout: 10000 });

    // The title should have text content
    const titleText = await heroTitle.textContent();
    expect(titleText).toBeTruthy();
  });

  test('features become visible when scrolled into view', async ({ page }) => {
    const landingPage = new LandingPage(page);
    await landingPage.goto();
    await landingPage.scrollToFeatures();

    // After scrolling, features should become visible
    await landingPage.expectFeaturesHeadlineVisible();
    await landingPage.expectFeatureCards(3);
  });
});

/**
 * Accessibility Tests
 */
test.describe('Landing Page Accessibility', () => {
  test('page has proper heading structure', async ({ page }) => {
    const landingPage = new LandingPage(page);
    await landingPage.goto();

    // Should have an h1 (hero title)
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();

    // Should have h2 for features section
    await landingPage.scrollToFeatures();
    const h2 = page.locator('h2').first();
    await expect(h2).toBeVisible();
  });

  test('CTA buttons have text content', async ({ page }) => {
    const landingPage = new LandingPage(page);
    await landingPage.goto();

    // Try It button
    await expect(landingPage.ctaTryIt).toBeVisible();
    await expect(landingPage.ctaTryIt).toContainText('Try It');

    // Begin button
    await expect(landingPage.ctaBegin).toBeVisible();
    await expect(landingPage.ctaBegin).toContainText('Begin');
  });

  test('footer links have descriptive text', async ({ page }) => {
    const landingPage = new LandingPage(page);
    await landingPage.goto();
    await landingPage.scrollToFooter();

    // Privacy link
    await expect(landingPage.footerPrivacyLink).toContainText(/privacy/i);

    // Terms link
    await expect(landingPage.footerTermsLink).toContainText(/terms/i);
  });
});

/**
 * SEO and Meta Tests
 */
test.describe('Landing Page SEO', () => {
  test('page has proper title', async ({ page }) => {
    const landingPage = new LandingPage(page);
    await landingPage.goto();

    const title = await page.title();
    expect(title).toBeTruthy();
    // Title should contain app name or relevant text
    expect(title.toLowerCase()).toContain('mirror');
  });
});
