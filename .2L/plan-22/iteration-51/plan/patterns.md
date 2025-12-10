# Code Patterns & Conventions - E2E Test Expansion

## File Structure

```
e2e/
  auth/
    signin.spec.ts        # Existing - 20 tests
    signup.spec.ts        # Existing - 19 tests
  dashboard/
    dashboard.spec.ts     # New - Dashboard tests
  dreams/
    dreams.spec.ts        # New - Dreams list tests
  reflection/
    reflection.spec.ts    # New - Reflection flow tests
  landing/
    landing.spec.ts       # New - Landing page tests
  fixtures/
    auth.fixture.ts       # Existing - Auth helpers
    test-data.fixture.ts  # New - Shared test data
  pages/
    signin.page.ts        # Existing - SignInPage POM
    signup.page.ts        # Existing - SignUpPage POM
    dashboard.page.ts     # New - DashboardPage POM
    dreams.page.ts        # New - DreamsPage POM
    reflection.page.ts    # New - ReflectionPage POM
    landing.page.ts       # New - LandingPage POM
```

## Naming Conventions

- Page Objects: PascalCase (`DashboardPage.ts`)
- Spec files: kebab-case with `.spec.ts` suffix (`dashboard.spec.ts`)
- Fixture files: kebab-case with `.fixture.ts` suffix (`test-data.fixture.ts`)
- Test descriptions: Present tense, starts with verb (`displays`, `navigates`, `shows`)
- Locator properties: camelCase (`dreamsCard`, `submitButton`)
- Action methods: camelCase, verb-first (`clickCreateDream`, `fillSearchField`)
- Assertion methods: camelCase, prefixed with `expect` (`expectCardVisible`, `expectError`)

## Import Order Convention

```typescript
// 1. Playwright imports
import { test, expect, Page, Locator, devices } from '@playwright/test';

// 2. Fixture imports
import { test as authTest, expect as authExpect } from '../fixtures/auth.fixture';
import { TEST_DREAM, generateTestDream } from '../fixtures/test-data.fixture';

// 3. Page Object imports
import { DashboardPage } from '../pages/dashboard.page';
import { DreamsPage } from '../pages/dreams.page';
```

---

## Page Object Model Pattern

### Basic Page Object Structure

```typescript
// e2e/pages/dashboard.page.ts
import { Page, Locator, expect } from '@playwright/test';

/**
 * Dashboard Page Object
 *
 * Encapsulates all interactions with the dashboard page.
 * Follows existing patterns from signin.page.ts and signup.page.ts.
 */
export class DashboardPage {
  readonly page: Page;

  // Card locators
  readonly dreamsCard: Locator;
  readonly reflectionsCard: Locator;
  readonly evolutionCard: Locator;
  readonly progressCard: Locator;
  readonly visualizationCard: Locator;
  readonly subscriptionCard: Locator;
  readonly clarifyCard: Locator;

  // Navigation elements
  readonly navigation: Locator;
  readonly refreshButton: Locator;
  readonly bottomNav: Locator;

  // Hero section
  readonly heroSection: Locator;
  readonly greetingText: Locator;
  readonly reflectButton: Locator;

  // Loading states
  readonly loader: Locator;

  constructor(page: Page) {
    this.page = page;

    // Cards - use class selectors matching component structure
    this.dreamsCard = page.locator('[class*="dreams-card"], [data-testid="dreams-card"]').first();
    this.reflectionsCard = page.locator('[class*="reflections-card"], [data-testid="reflections-card"]').first();
    this.evolutionCard = page.locator('[class*="evolution-card"], [data-testid="evolution-card"]').first();
    this.progressCard = page.locator('[class*="progress-card"], [data-testid="progress-card"]').first();
    this.visualizationCard = page.locator('[class*="visualization-card"], [data-testid="visualization-card"]').first();
    this.subscriptionCard = page.locator('[class*="subscription-card"], [data-testid="subscription-card"]').first();
    this.clarifyCard = page.locator('[class*="clarify-card"], [data-testid="clarify-card"]').first();

    // Navigation
    this.navigation = page.locator('nav, [role="navigation"]').first();
    this.refreshButton = page.locator('button:has-text("Refresh"), button[aria-label*="refresh"]');
    this.bottomNav = page.locator('[class*="bottom-nav"], [data-testid="bottom-navigation"]');

    // Hero
    this.heroSection = page.locator('[class*="dashboard-hero"], [data-testid="dashboard-hero"]').first();
    this.greetingText = page.locator('text=/Good (morning|afternoon|evening)/i');
    this.reflectButton = page.locator('button:has-text("Reflect"), a:has-text("Reflect")').first();

    // Loading
    this.loader = page.locator('[class*="cosmic-loader"], [data-testid="loader"]');
  }

  /**
   * Navigate to dashboard
   */
  async goto(): Promise<void> {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for dashboard to fully load
   */
  async waitForLoad(): Promise<void> {
    // Wait for loader to disappear
    await this.loader.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
    // Wait for at least one card to be visible
    await this.page.waitForSelector('[class*="card"], [class*="Card"]', { timeout: 15000 });
  }

  /**
   * Click on dreams card
   */
  async clickDreamsCard(): Promise<void> {
    await this.dreamsCard.click();
  }

  /**
   * Click on reflections card
   */
  async clickReflectionsCard(): Promise<void> {
    await this.reflectionsCard.click();
  }

  /**
   * Click refresh button
   */
  async clickRefresh(): Promise<void> {
    await this.refreshButton.click();
  }

  /**
   * Click the reflect CTA button
   */
  async clickReflect(): Promise<void> {
    await this.reflectButton.click();
  }

  // Assertions

  /**
   * Assert dashboard has loaded
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
   * Assert greeting is displayed
   */
  async expectGreetingVisible(): Promise<void> {
    await expect(this.greetingText).toBeVisible({ timeout: 10000 });
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
   * Assert bottom navigation is visible (mobile only)
   */
  async expectBottomNavVisible(): Promise<void> {
    await expect(this.bottomNav).toBeVisible({ timeout: 5000 });
  }

  /**
   * Assert bottom navigation is hidden (desktop)
   */
  async expectBottomNavHidden(): Promise<void> {
    await expect(this.bottomNav).not.toBeVisible();
  }
}
```

### Dreams Page Object

```typescript
// e2e/pages/dreams.page.ts
import { Page, Locator, expect } from '@playwright/test';

/**
 * Dreams Page Object
 *
 * Encapsulates all interactions with the dreams list page.
 */
export class DreamsPage {
  readonly page: Page;

  // Header elements
  readonly pageTitle: Locator;
  readonly createButton: Locator;
  readonly limitsInfo: Locator;

  // Filter buttons
  readonly filterActive: Locator;
  readonly filterAchieved: Locator;
  readonly filterArchived: Locator;
  readonly filterAll: Locator;

  // Dream cards
  readonly dreamCards: Locator;
  readonly emptyState: Locator;

  // Loading
  readonly loader: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header
    this.pageTitle = page.locator('text=Your Dreams').first();
    this.createButton = page.locator('button:has-text("Create Dream"), button:has-text("+ Create")');
    this.limitsInfo = page.locator('text=/\\d+\\s*\\/\\s*(\\d+|\\u221e)/'); // Matches "X / Y" or "X / infinity"

    // Filters
    this.filterActive = page.locator('button:has-text("Active")');
    this.filterAchieved = page.locator('button:has-text("Achieved")');
    this.filterArchived = page.locator('button:has-text("Archived")');
    this.filterAll = page.locator('button:has-text("All")');

    // Cards
    this.dreamCards = page.locator('[class*="dream-card"], [data-testid="dream-card"]');
    this.emptyState = page.locator('[class*="empty-state"], text=/Dream big|Create Your First/i');

    // Loading
    this.loader = page.locator('[class*="cosmic-loader"], text=Gathering');
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
    await this.loader.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
    // Wait for either dream cards or empty state
    await Promise.race([
      this.dreamCards.first().waitFor({ state: 'visible', timeout: 15000 }),
      this.emptyState.waitFor({ state: 'visible', timeout: 15000 }),
    ]).catch(() => {});
  }

  /**
   * Click create dream button
   */
  async clickCreateDream(): Promise<void> {
    await this.createButton.click();
  }

  /**
   * Filter by status
   */
  async filterByStatus(status: 'active' | 'achieved' | 'archived' | 'all'): Promise<void> {
    const filterMap = {
      active: this.filterActive,
      achieved: this.filterAchieved,
      archived: this.filterArchived,
      all: this.filterAll,
    };
    await filterMap[status].click();
  }

  /**
   * Click on a dream card by index
   */
  async clickDreamCard(index: number = 0): Promise<void> {
    await this.dreamCards.nth(index).click();
  }

  /**
   * Get dream card count
   */
  async getDreamCount(): Promise<number> {
    return await this.dreamCards.count();
  }

  // Assertions

  /**
   * Assert page has loaded
   */
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/dreams/);
    await this.waitForLoad();
  }

  /**
   * Assert page title is visible
   */
  async expectTitleVisible(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
  }

  /**
   * Assert create button is visible
   */
  async expectCreateButtonVisible(): Promise<void> {
    await expect(this.createButton).toBeVisible();
  }

  /**
   * Assert filter buttons are visible
   */
  async expectFiltersVisible(): Promise<void> {
    await expect(this.filterActive).toBeVisible();
    await expect(this.filterAchieved).toBeVisible();
    await expect(this.filterArchived).toBeVisible();
    await expect(this.filterAll).toBeVisible();
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
   * Assert limits info is visible
   */
  async expectLimitsVisible(): Promise<void> {
    await expect(this.limitsInfo).toBeVisible();
  }

  /**
   * Assert active filter is selected
   */
  async expectActiveFilterSelected(): Promise<void> {
    // Active filter should have primary variant styling
    await expect(this.filterActive).toHaveAttribute('class', /primary|active/i);
  }
}
```

### Reflection Page Object

```typescript
// e2e/pages/reflection.page.ts
import { Page, Locator, expect } from '@playwright/test';

/**
 * Reflection Page Object
 *
 * Encapsulates all interactions with the reflection experience page.
 * Handles both desktop and mobile flows.
 */
export class ReflectionPage {
  readonly page: Page;

  // Dream selection
  readonly dreamSelector: Locator;
  readonly dreamOptions: Locator;
  readonly noDreamsMessage: Locator;

  // Form fields
  readonly dreamField: Locator;
  readonly planField: Locator;
  readonly relationshipField: Locator;
  readonly offeringField: Locator;

  // Tone selection
  readonly toneFusion: Locator;
  readonly toneGentle: Locator;
  readonly toneIntense: Locator;

  // Submit
  readonly submitButton: Locator;

  // Loading/Output states
  readonly gazingOverlay: Locator;
  readonly outputView: Locator;
  readonly outputContent: Locator;
  readonly createNewButton: Locator;

  // Demo user CTA
  readonly demoCta: Locator;

  // Mobile-specific
  readonly mobileFlow: Locator;
  readonly mobileNextButton: Locator;
  readonly mobileBackButton: Locator;

  // Loader
  readonly loader: Locator;

  constructor(page: Page) {
    this.page = page;

    // Dream selection
    this.dreamSelector = page.locator('[class*="dream-selection"], [data-testid="dream-selector"]');
    this.dreamOptions = page.locator('[class*="dream-option"], [class*="dream-card"]');
    this.noDreamsMessage = page.locator('text=/No active dreams|Create a dream/i');

    // Form fields (textarea elements)
    this.dreamField = page.locator('textarea[name="dream"], [data-testid="dream-field"]');
    this.planField = page.locator('textarea[name="plan"], [data-testid="plan-field"]');
    this.relationshipField = page.locator('textarea[name="relationship"], [data-testid="relationship-field"]');
    this.offeringField = page.locator('textarea[name="offering"], [data-testid="offering-field"]');

    // Tone selection
    this.toneFusion = page.locator('button:has-text("Fusion"), [data-tone="fusion"]');
    this.toneGentle = page.locator('button:has-text("Gentle"), [data-tone="gentle"]');
    this.toneIntense = page.locator('button:has-text("Intense"), [data-tone="intense"]');

    // Submit
    this.submitButton = page.locator('button:has-text("Gaze"), button:has-text("Submit"), button:has-text("Reflect")').first();

    // Loading/Output
    this.gazingOverlay = page.locator('[class*="gazing-overlay"], [data-testid="gazing-overlay"]');
    this.outputView = page.locator('[class*="output"], [data-testid="reflection-output"]');
    this.outputContent = page.locator('[class*="reflection-content"], [class*="prose"]');
    this.createNewButton = page.locator('button:has-text("New Reflection"), button:has-text("Create New")');

    // Demo CTA
    this.demoCta = page.locator('text=/Ready to Start Your Journey/i');

    // Mobile
    this.mobileFlow = page.locator('[class*="mobile-reflection"], [data-testid="mobile-reflection-flow"]');
    this.mobileNextButton = page.locator('[class*="mobile"] button:has-text("Next"), button:has-text("Continue")');
    this.mobileBackButton = page.locator('[class*="mobile"] button:has-text("Back"), button[aria-label="Back"]');

    // Loader
    this.loader = page.locator('[class*="cosmic-loader"]');
  }

  /**
   * Navigate to reflection page
   */
  async goto(): Promise<void> {
    await this.page.goto('/reflection');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to reflection with dream ID
   */
  async gotoWithDream(dreamId: string): Promise<void> {
    await this.page.goto(`/reflection?dreamId=${dreamId}`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to reflection output
   */
  async gotoOutput(reflectionId: string): Promise<void> {
    await this.page.goto(`/reflection?id=${reflectionId}`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for page to load
   */
  async waitForLoad(): Promise<void> {
    await this.loader.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
  }

  /**
   * Select a dream by index
   */
  async selectDream(index: number = 0): Promise<void> {
    await this.dreamOptions.nth(index).click();
  }

  /**
   * Fill reflection form
   */
  async fillForm(data: {
    dream?: string;
    plan?: string;
    relationship?: string;
    offering?: string;
  }): Promise<void> {
    if (data.dream) await this.dreamField.fill(data.dream);
    if (data.plan) await this.planField.fill(data.plan);
    if (data.relationship) await this.relationshipField.fill(data.relationship);
    if (data.offering) await this.offeringField.fill(data.offering);
  }

  /**
   * Select tone
   */
  async selectTone(tone: 'fusion' | 'gentle' | 'intense'): Promise<void> {
    const toneMap = {
      fusion: this.toneFusion,
      gentle: this.toneGentle,
      intense: this.toneIntense,
    };
    await toneMap[tone].click();
  }

  /**
   * Submit reflection
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Click create new reflection
   */
  async clickCreateNew(): Promise<void> {
    await this.createNewButton.click();
  }

  // Assertions

  /**
   * Assert reflection page loaded
   */
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/reflection/);
    await this.waitForLoad();
  }

  /**
   * Assert dream selector is visible
   */
  async expectDreamSelectorVisible(): Promise<void> {
    await expect(this.dreamSelector).toBeVisible({ timeout: 15000 });
  }

  /**
   * Assert form fields are visible
   */
  async expectFormVisible(): Promise<void> {
    await expect(this.dreamField).toBeVisible({ timeout: 10000 });
  }

  /**
   * Assert tone selector is visible
   */
  async expectToneSelectVisible(): Promise<void> {
    await expect(this.toneFusion).toBeVisible();
    await expect(this.toneGentle).toBeVisible();
    await expect(this.toneIntense).toBeVisible();
  }

  /**
   * Assert submit button is visible
   */
  async expectSubmitVisible(): Promise<void> {
    await expect(this.submitButton).toBeVisible();
  }

  /**
   * Assert gazing overlay is visible (during submission)
   */
  async expectGazingVisible(): Promise<void> {
    await expect(this.gazingOverlay).toBeVisible({ timeout: 5000 });
  }

  /**
   * Assert output view is visible
   */
  async expectOutputVisible(): Promise<void> {
    await expect(this.outputView).toBeVisible({ timeout: 60000 });
  }

  /**
   * Assert output has content
   */
  async expectOutputHasContent(): Promise<void> {
    await expect(this.outputContent).not.toBeEmpty();
  }

  /**
   * Assert demo CTA is visible
   */
  async expectDemoCtaVisible(): Promise<void> {
    await expect(this.demoCta).toBeVisible();
  }

  /**
   * Assert mobile flow is visible
   */
  async expectMobileFlowVisible(): Promise<void> {
    await expect(this.mobileFlow).toBeVisible({ timeout: 10000 });
  }

  /**
   * Assert no dreams message is visible
   */
  async expectNoDreamsMessage(): Promise<void> {
    await expect(this.noDreamsMessage).toBeVisible();
  }
}
```

### Landing Page Object

```typescript
// e2e/pages/landing.page.ts
import { Page, Locator, expect } from '@playwright/test';

/**
 * Landing Page Object
 *
 * Encapsulates all interactions with the landing/homepage.
 */
export class LandingPage {
  readonly page: Page;

  // Navigation
  readonly navigation: Locator;
  readonly signInLink: Locator;
  readonly signUpLink: Locator;
  readonly pricingLink: Locator;
  readonly aboutLink: Locator;

  // Hero section
  readonly heroSection: Locator;
  readonly heroTitle: Locator;
  readonly heroSubtitle: Locator;
  readonly ctaGetStarted: Locator;
  readonly ctaLearnMore: Locator;

  // Features section
  readonly featuresSection: Locator;
  readonly featureCards: Locator;
  readonly featuresHeadline: Locator;

  // Footer
  readonly footer: Locator;
  readonly footerLinks: Locator;
  readonly copyright: Locator;

  constructor(page: Page) {
    this.page = page;

    // Navigation
    this.navigation = page.locator('nav, [role="navigation"]').first();
    this.signInLink = page.locator('a:has-text("Sign In"), a:has-text("Login"), a[href*="signin"]');
    this.signUpLink = page.locator('a:has-text("Sign Up"), a:has-text("Get Started"), a[href*="signup"]');
    this.pricingLink = page.locator('a:has-text("Pricing"), a[href*="pricing"]');
    this.aboutLink = page.locator('a:has-text("About"), a[href*="about"]');

    // Hero
    this.heroSection = page.locator('section').first();
    this.heroTitle = page.locator('h1').first();
    this.heroSubtitle = page.locator('h1 + p, h1 ~ p').first();
    this.ctaGetStarted = page.locator('button:has-text("Get Started"), a:has-text("Get Started"), button:has-text("Begin")').first();
    this.ctaLearnMore = page.locator('button:has-text("Learn More"), a:has-text("Learn More"), a[href="#features"]');

    // Features
    this.featuresSection = page.locator('#features, section:has-text("Space for Dreamers")');
    this.featureCards = page.locator('[class*="feature-card"], [class*="landing-feature"]');
    this.featuresHeadline = page.locator('text=/Space for Dreamers/i');

    // Footer
    this.footer = page.locator('footer');
    this.footerLinks = page.locator('footer a');
    this.copyright = page.locator('footer').locator('text=/Mirror of Dreams.*All rights reserved/i');
  }

  /**
   * Navigate to landing page
   */
  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click sign in link
   */
  async clickSignIn(): Promise<void> {
    await this.signInLink.click();
  }

  /**
   * Click sign up / get started
   */
  async clickSignUp(): Promise<void> {
    await this.signUpLink.first().click();
  }

  /**
   * Click get started CTA
   */
  async clickGetStarted(): Promise<void> {
    await this.ctaGetStarted.click();
  }

  /**
   * Click pricing link
   */
  async clickPricing(): Promise<void> {
    await this.pricingLink.click();
  }

  /**
   * Click about link
   */
  async clickAbout(): Promise<void> {
    await this.aboutLink.click();
  }

  /**
   * Scroll to features section
   */
  async scrollToFeatures(): Promise<void> {
    await this.featuresSection.scrollIntoViewIfNeeded();
  }

  // Assertions

  /**
   * Assert landing page loaded
   */
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/^https?:\/\/[^/]+\/?$/);
  }

  /**
   * Assert navigation is visible
   */
  async expectNavigationVisible(): Promise<void> {
    await expect(this.navigation).toBeVisible();
  }

  /**
   * Assert hero section is visible
   */
  async expectHeroVisible(): Promise<void> {
    await expect(this.heroTitle).toBeVisible();
  }

  /**
   * Assert hero title contains expected text
   */
  async expectHeroTitle(text: string | RegExp): Promise<void> {
    await expect(this.heroTitle).toContainText(text);
  }

  /**
   * Assert CTA buttons are visible
   */
  async expectCtaVisible(): Promise<void> {
    await expect(this.ctaGetStarted).toBeVisible();
  }

  /**
   * Assert features section is visible
   */
  async expectFeaturesVisible(): Promise<void> {
    await expect(this.featuresSection).toBeVisible();
  }

  /**
   * Assert feature cards are displayed
   */
  async expectFeatureCards(minCount: number = 3): Promise<void> {
    await expect(this.featureCards.first()).toBeVisible();
    const count = await this.featureCards.count();
    expect(count).toBeGreaterThanOrEqual(minCount);
  }

  /**
   * Assert footer is visible
   */
  async expectFooterVisible(): Promise<void> {
    await expect(this.footer).toBeVisible();
  }

  /**
   * Assert copyright is visible
   */
  async expectCopyrightVisible(): Promise<void> {
    await expect(this.copyright).toBeVisible();
  }
}
```

---

## Test Fixture Patterns

### Shared Test Data Fixture

```typescript
// e2e/fixtures/test-data.fixture.ts

/**
 * Shared test data constants and factories
 *
 * Provides consistent test data across all E2E test files.
 */

export const TEST_DREAM = {
  title: 'E2E Test Dream',
  description: 'A dream created by E2E tests for validation',
  category: 'career' as const,
};

export const TEST_REFLECTION = {
  dream: 'What I am holding is my aspiration to grow professionally.',
  plan: 'I will take small steps each day toward my goal.',
  relationship: 'This dream connects to my desire for fulfillment.',
  offering: 'I offer my patience and persistence.',
};

export const DREAM_CATEGORIES = [
  'career',
  'health',
  'relationships',
  'personal_growth',
  'financial',
  'creative',
  'adventure',
] as const;

export const REFLECTION_TONES = ['fusion', 'gentle', 'intense'] as const;

/**
 * Generate unique test dream title
 */
export function generateTestDreamTitle(): string {
  return `E2E Dream ${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Generate unique test email (re-exported from auth fixture pattern)
 */
export function generateTestEmail(): string {
  return `e2e-test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.local`;
}
```

### Using Auth Fixture for Authenticated Tests

```typescript
// Pattern for authenticated tests
import { test, expect } from '../fixtures/auth.fixture';
import { DashboardPage } from '../pages/dashboard.page';

test.describe('Dashboard', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    dashboardPage = new DashboardPage(authenticatedPage);
    await dashboardPage.goto();
    await dashboardPage.waitForLoad();
  });

  test('displays dashboard cards', async () => {
    await dashboardPage.expectDreamsCardVisible();
    await dashboardPage.expectReflectionsCardVisible();
  });
});
```

### Using Standard Test for Unauthenticated Tests

```typescript
// Pattern for unauthenticated tests (landing page)
import { test, expect } from '@playwright/test';
import { LandingPage } from '../pages/landing.page';

test.describe('Landing Page', () => {
  let landingPage: LandingPage;

  test.beforeEach(async ({ page }) => {
    landingPage = new LandingPage(page);
    await landingPage.goto();
  });

  test('displays hero section', async () => {
    await landingPage.expectHeroVisible();
  });
});
```

---

## Test Organization Patterns

### Standard Spec File Structure

```typescript
// e2e/dashboard/dashboard.spec.ts
import { test, expect } from '../fixtures/auth.fixture';
import { DashboardPage } from '../pages/dashboard.page';

test.describe('Dashboard', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    dashboardPage = new DashboardPage(authenticatedPage);
    await dashboardPage.goto();
  });

  test.describe('Page Display', () => {
    test('displays hero section', async () => {
      await dashboardPage.expectHeroVisible();
    });

    test('displays greeting', async () => {
      await dashboardPage.expectGreetingVisible();
    });

    // More display tests...
  });

  test.describe('Navigation', () => {
    test('navigates to dreams from card', async ({ authenticatedPage }) => {
      await dashboardPage.clickDreamsCard();
      await authenticatedPage.waitForURL('/dreams');
      expect(authenticatedPage.url()).toContain('/dreams');
    });

    // More navigation tests...
  });

  test.describe('Interaction', () => {
    test('refresh button updates data', async () => {
      await dashboardPage.clickRefresh();
      // Assert toast or data update
    });

    // More interaction tests...
  });
});
```

### Mobile Test Block Pattern

```typescript
import { test, expect, devices } from '@playwright/test';
import { test as authTest } from '../fixtures/auth.fixture';
import { DashboardPage } from '../pages/dashboard.page';

test.describe('Dashboard Mobile', () => {
  // Apply mobile device settings to all tests in this block
  test.use({ ...devices['iPhone 13'] });

  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    // Note: For mobile tests needing auth, use authenticatedPage fixture
    dashboardPage = new DashboardPage(page);
  });

  test('displays bottom navigation on mobile', async ({ page }) => {
    // Navigate with demo login for mobile
    await page.goto('/auth/signin');
    const demoButton = page.locator('button:has-text("Demo")');
    if (await demoButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await demoButton.click();
      await page.waitForURL('/dashboard');
      await dashboardPage.expectBottomNavVisible();
    }
  });

  test('cards stack vertically on mobile', async () => {
    // Mobile layout assertions
  });
});
```

---

## Wait Strategy Patterns

### Explicit Element Waits

```typescript
// Wait for element to be visible
await expect(page.locator('[data-testid="card"]')).toBeVisible({ timeout: 10000 });

// Wait for element to disappear (loading states)
await page.locator('.loader').waitFor({ state: 'hidden', timeout: 30000 });

// Wait for URL navigation
await page.waitForURL('/dashboard', { timeout: 30000 });

// Wait for network idle
await page.waitForLoadState('networkidle');
```

### Race Conditions Pattern

```typescript
// Wait for either success state or empty state
async waitForLoad(): Promise<void> {
  await Promise.race([
    this.dreamCards.first().waitFor({ state: 'visible', timeout: 15000 }),
    this.emptyState.waitFor({ state: 'visible', timeout: 15000 }),
  ]).catch(() => {});
}
```

### Animation Wait Pattern

```typescript
// Wait for stagger animations to complete
async waitForAnimations(): Promise<void> {
  // Wait for any animated elements to become visible
  await this.page.waitForFunction(() => {
    const cards = document.querySelectorAll('[class*="card"]');
    return cards.length > 0 && Array.from(cards).every(
      card => window.getComputedStyle(card).opacity === '1'
    );
  }, { timeout: 10000 }).catch(() => {});
}
```

---

## Assertion Patterns

### Visibility Assertions

```typescript
// Basic visibility
await expect(locator).toBeVisible();

// With timeout
await expect(locator).toBeVisible({ timeout: 15000 });

// Count assertion
await expect(locator).toHaveCount(5);

// At least N items
const count = await locator.count();
expect(count).toBeGreaterThanOrEqual(3);
```

### Text Content Assertions

```typescript
// Exact text
await expect(locator).toHaveText('Expected Text');

// Contains text
await expect(locator).toContainText('partial');

// Regex match
await expect(locator).toContainText(/pattern/i);
```

### URL Assertions

```typescript
// Exact URL
await expect(page).toHaveURL('/dashboard');

// URL pattern
await expect(page).toHaveURL(/\/dreams/);

// Contains path
expect(page.url()).toContain('/dreams');
```

### Attribute Assertions

```typescript
// Has attribute
await expect(locator).toHaveAttribute('type', 'submit');

// Class contains
await expect(locator).toHaveClass(/active/);

// Disabled state
await expect(locator).toBeDisabled();
await expect(locator).toBeEnabled();
```

---

## Error Handling Patterns

### Graceful Fallbacks

```typescript
// Try to find element, continue if not present
const isVisible = await locator.isVisible({ timeout: 2000 }).catch(() => false);
if (isVisible) {
  await locator.click();
}
```

### Conditional Test Logic

```typescript
test('handles paid user features', async ({ authenticatedPage }) => {
  // Check if user is paid before testing paid features
  const clarifyCard = authenticatedPage.locator('[data-testid="clarify-card"]');
  const isPaidUser = await clarifyCard.isVisible({ timeout: 5000 }).catch(() => false);

  if (isPaidUser) {
    await expect(clarifyCard).toBeVisible();
    // Test paid user flow
  } else {
    // Free user - card should not be visible
    await expect(clarifyCard).not.toBeVisible();
  }
});
```

---

## Testing Patterns (Production Mode)

### Test File Naming Conventions

- E2E specs: `{feature}.spec.ts` (in `e2e/{feature}/` directory)
- Page objects: `{page}.page.ts` (in `e2e/pages/` directory)
- Fixtures: `{name}.fixture.ts` (in `e2e/fixtures/` directory)

### Test Structure Pattern

```typescript
import { test, expect } from '@playwright/test';
import { PageObject } from '../pages/page.page';

test.describe('Feature Name', () => {
  let pageObject: PageObject;

  test.beforeEach(async ({ page }) => {
    // Arrange - Set up page object
    pageObject = new PageObject(page);
    await pageObject.goto();
  });

  test('should handle normal case', async () => {
    // Act
    await pageObject.performAction();

    // Assert
    await pageObject.expectResult();
  });

  test('should handle edge case', async () => {
    // Specific edge case handling
  });
});
```

### Coverage Expectations

| Test Type | Target Coverage |
|-----------|-----------------|
| Dashboard | 15+ tests |
| Dreams | 15+ tests |
| Reflection | 20+ tests |
| Landing | 12+ tests |
| **Total New** | **62+ tests** |
| **Total (with existing)** | **101+ tests** |

---

## Security Patterns

### No Hardcoded Credentials

```typescript
// NEVER do this:
// const password = "hardcoded-secret";

// ALWAYS use fixtures:
import { TEST_USER } from '../fixtures/auth.fixture';
await page.fill('#password', TEST_USER.password);
```

### Test Data Isolation

```typescript
// Use unique identifiers for test data
const uniqueTitle = `E2E Dream ${Date.now()}`;
```

---

## CI/CD Patterns

### Playwright Configuration for CI

```typescript
// playwright.config.ts patterns
export default defineConfig({
  // CI-specific settings
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Single browser in CI for speed
  projects: process.env.CI
    ? [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
    : [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
      ],
});
```

### Test Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test e2e/dashboard/dashboard.spec.ts

# Run with UI (local development)
npx playwright test --ui

# Run headed (see browser)
npx playwright test --headed

# Generate HTML report
npx playwright show-report
```
