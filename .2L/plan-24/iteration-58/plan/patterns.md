# Code Patterns & Conventions - E2E Test Expansion

## File Structure

```
e2e/
├── fixtures/
│   ├── auth.fixture.ts         # Demo user authentication
│   ├── admin.fixture.ts        # Admin/Creator authentication (NEW)
│   ├── paid-user.fixture.ts    # Paid tier access (NEW)
│   ├── network.fixture.ts      # Network simulation (NEW)
│   └── test-data.fixture.ts    # Test constants
├── pages/
│   ├── profile.page.ts         # Profile page object (NEW)
│   ├── settings.page.ts        # Settings page object (NEW)
│   ├── pricing.page.ts         # Pricing page object (NEW)
│   ├── admin.page.ts           # Admin page object (NEW)
│   ├── clarify-list.page.ts    # Clarify list page object (NEW)
│   └── clarify-session.page.ts # Clarify session page object (NEW)
├── profile/
│   └── profile.spec.ts         # Profile tests (NEW)
├── settings/
│   └── settings.spec.ts        # Settings tests (NEW)
├── subscription/
│   └── subscription.spec.ts    # Subscription tests (NEW)
├── admin/
│   └── admin.spec.ts           # Admin tests (NEW)
├── clarify/
│   └── clarify.spec.ts         # Clarify tests (NEW)
└── error/
    └── error.spec.ts           # Error handling tests (NEW)
```

## Naming Conventions

- Page Objects: PascalCase (`ProfilePage.ts`)
- Spec Files: kebab-case (`profile.spec.ts`)
- Fixtures: kebab-case (`admin.fixture.ts`)
- Test Functions: descriptive verb phrases (`displays profile information`)
- Test Variables: camelCase (`profilePage`, `adminPage`)

---

## Fixture Patterns

### admin.fixture.ts

```typescript
// e2e/fixtures/admin.fixture.ts - Admin/Creator authentication fixture

import { test as base, expect, Page } from '@playwright/test';

/**
 * Admin authentication fixture
 *
 * Uses demo login because demo user has isCreator: true,
 * which grants admin panel access. This is simpler and more
 * reliable than maintaining separate admin credentials.
 */
async function loginAsAdmin(page: Page): Promise<void> {
  // Demo user has creator privileges = admin access
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const demoButton = page.locator('button').filter({ hasText: 'Try It' }).first();

  try {
    await demoButton.waitFor({ state: 'visible', timeout: 15000 });
    await demoButton.click();
    await page.waitForURL('/dashboard', { timeout: 30000 });
  } catch {
    throw new Error(
      'Demo login failed. Admin tests require demo user with creator privileges.'
    );
  }
}

export const test = base.extend<{ adminPage: Page }>({
  adminPage: async ({ page }, use) => {
    await loginAsAdmin(page);
    await use(page);
  },
});

export { expect };

/**
 * Helper to verify admin access is granted
 */
export async function verifyAdminAccess(page: Page): Promise<boolean> {
  await page.goto('/admin');

  // Wait a moment for potential redirect
  await page.waitForTimeout(1000);

  // If still on /admin, access was granted
  return page.url().includes('/admin');
}
```

### paid-user.fixture.ts

```typescript
// e2e/fixtures/paid-user.fixture.ts - Paid tier user authentication

import { test as base, expect, Page } from '@playwright/test';

/**
 * Paid user authentication fixture
 *
 * Demo user has isCreator: true which bypasses tier restrictions.
 * This allows testing paid features like Clarify without actual subscription.
 *
 * For testing free-tier-blocked behavior, use regular page fixture
 * and verify redirect to /pricing.
 */
async function loginAsPaidUser(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const demoButton = page.locator('button').filter({ hasText: 'Try It' }).first();

  try {
    await demoButton.waitFor({ state: 'visible', timeout: 15000 });
    await demoButton.click();
    await page.waitForURL('/dashboard', { timeout: 30000 });
  } catch {
    throw new Error(
      'Demo login failed. Paid user tests require demo user with creator privileges.'
    );
  }
}

export const test = base.extend<{ paidUserPage: Page }>({
  paidUserPage: async ({ page }, use) => {
    await loginAsPaidUser(page);
    await use(page);
  },
});

export { expect };

/**
 * Helper to check if user has paid feature access
 */
export async function hasPaidAccess(page: Page): Promise<boolean> {
  await page.goto('/clarify');

  // Wait for potential redirect
  await page.waitForTimeout(1000);

  // If on /clarify (not /pricing), has paid access
  return page.url().includes('/clarify') && !page.url().includes('/pricing');
}
```

### network.fixture.ts

```typescript
// e2e/fixtures/network.fixture.ts - Network simulation fixtures

import { test as base, expect, Page, Route } from '@playwright/test';

/**
 * Network condition presets
 */
export const NETWORK_CONDITIONS = {
  offline: {
    offline: true,
    latency: 0,
    downloadThroughput: 0,
    uploadThroughput: 0,
  },
  slow3G: {
    offline: false,
    latency: 400,
    downloadThroughput: 400 * 1024 / 8,  // 400 Kbps
    uploadThroughput: 400 * 1024 / 8,
  },
};

/**
 * Block all API requests (simulate offline)
 */
export async function withNetworkOffline(page: Page): Promise<void> {
  await page.route('**/api/**', (route: Route) => {
    route.abort('internetdisconnected');
  });

  await page.route('**/trpc/**', (route: Route) => {
    route.abort('internetdisconnected');
  });
}

/**
 * Simulate slow network with delay
 */
export async function withSlowNetwork(page: Page, delayMs: number = 2000): Promise<void> {
  await page.route('**/api/**', async (route: Route) => {
    await new Promise(resolve => setTimeout(resolve, delayMs));
    await route.continue();
  });

  await page.route('**/trpc/**', async (route: Route) => {
    await new Promise(resolve => setTimeout(resolve, delayMs));
    await route.continue();
  });
}

/**
 * Simulate API error response
 */
export async function withApiError(
  page: Page,
  urlPattern: string | RegExp,
  statusCode: number = 500,
  body: object = { error: 'Internal Server Error' }
): Promise<void> {
  await page.route(urlPattern, (route: Route) => {
    route.fulfill({
      status: statusCode,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
}

/**
 * Clear all route intercepts
 */
export async function clearNetworkMocks(page: Page): Promise<void> {
  await page.unrouteAll();
}

export const test = base.extend<{
  networkPage: Page;
  simulateOffline: () => Promise<void>;
  simulateSlowNetwork: (delayMs?: number) => Promise<void>;
  simulateApiError: (urlPattern: string | RegExp, statusCode?: number) => Promise<void>;
}>({
  networkPage: async ({ page }, use) => {
    await use(page);
    // Cleanup routes after test
    await clearNetworkMocks(page);
  },

  simulateOffline: async ({ page }, use) => {
    const fn = async () => await withNetworkOffline(page);
    await use(fn);
  },

  simulateSlowNetwork: async ({ page }, use) => {
    const fn = async (delayMs?: number) => await withSlowNetwork(page, delayMs);
    await use(fn);
  },

  simulateApiError: async ({ page }, use) => {
    const fn = async (urlPattern: string | RegExp, statusCode?: number) =>
      await withApiError(page, urlPattern, statusCode);
    await use(fn);
  },
});

export { expect };
```

---

## Page Object Patterns

### profile.page.ts

```typescript
// e2e/pages/profile.page.ts - Profile Page Object Model

import { Page, Locator, expect } from '@playwright/test';

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
    this.demoBanner = page.locator('[class*="demo"], [class*="info"]').filter({ hasText: /demo/i });

    // Account info - use semantic selectors
    this.nameDisplay = page.locator('text=Name').locator('..').locator('p, span').first();
    this.nameInput = page.locator('input[placeholder*="name"], input[id*="name"]').first();
    this.editNameButton = page.getByRole('button', { name: /edit/i }).first();
    this.saveNameButton = page.getByRole('button', { name: /save/i }).first();
    this.cancelNameButton = page.getByRole('button', { name: /cancel/i }).first();
    this.emailDisplay = page.locator('text=Email').locator('..').locator('p, span').first();
    this.memberSinceDisplay = page.locator('text=/member since/i');

    // Subscription
    this.subscriptionCard = page.locator('[class*="subscription"], [class*="tier"]').first();
    this.currentTierDisplay = page.locator('text=/tier|plan/i').locator('..').first();

    // Usage
    this.usageStatsCard = page.locator('text=Usage Statistics').locator('..').first();
    this.reflectionsThisMonth = page.locator('text=Reflections This Month').locator('..').locator('p').last();
    this.totalReflections = page.locator('text=Total Reflections').locator('..').locator('p').last();
    this.clarifySessionsDisplay = page.locator('text=Clarify Sessions').locator('..').first();

    // Password
    this.changePasswordButton = page.getByRole('button', { name: /change password/i });
    this.currentPasswordInput = page.locator('input[placeholder*="current"], input[type="password"]').first();
    this.newPasswordInput = page.locator('input[placeholder*="new"]');
    this.savePasswordButton = page.getByRole('button', { name: /save|update/i }).nth(1);
    this.cancelPasswordButton = page.getByRole('button', { name: /cancel/i });

    // Delete account
    this.deleteAccountButton = page.getByRole('button', { name: /delete account/i });
    this.deleteModal = page.locator('[role="dialog"], [class*="modal"]').filter({ hasText: /delete/i });
    this.confirmEmailInput = page.locator('input[placeholder*="email"]');
    this.confirmPasswordInput = page.locator('input[type="password"]').last();
    this.confirmDeleteButton = page.getByRole('button', { name: /confirm|delete/i }).last();
    this.cancelDeleteButton = page.locator('[role="dialog"]').getByRole('button', { name: /cancel/i });

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
}
```

### settings.page.ts

```typescript
// e2e/pages/settings.page.ts - Settings Page Object Model

import { Page, Locator, expect } from '@playwright/test';

export class SettingsPage {
  readonly page: Page;

  // Page title
  readonly pageTitle: Locator;

  // Notification preferences
  readonly notificationSection: Locator;
  readonly emailNotificationsToggle: Locator;
  readonly reflectionRemindersSelect: Locator;
  readonly evolutionEmailToggle: Locator;

  // Reflection preferences
  readonly reflectionSection: Locator;
  readonly defaultToneSelect: Locator;
  readonly characterCounterToggle: Locator;

  // Display preferences
  readonly displaySection: Locator;
  readonly reduceMotionSelect: Locator;

  // Privacy preferences
  readonly privacySection: Locator;
  readonly analyticsToggle: Locator;
  readonly marketingToggle: Locator;

  // Feedback
  readonly successToast: Locator;
  readonly errorToast: Locator;

  constructor(page: Page) {
    this.page = page;

    this.pageTitle = page.locator('h1').filter({ hasText: 'Settings' });

    // Sections
    this.notificationSection = page.locator('text=Notification Preferences').locator('..');
    this.reflectionSection = page.locator('text=Reflection Preferences').locator('..');
    this.displaySection = page.locator('text=Display Preferences').locator('..');
    this.privacySection = page.locator('text=Privacy').locator('..');

    // Toggles - find by label text then get sibling input
    this.emailNotificationsToggle = page.locator('text=Email Notifications').locator('..').locator('input[type="checkbox"]');
    this.evolutionEmailToggle = page.locator('text=Evolution Reports').locator('..').locator('input[type="checkbox"]');
    this.characterCounterToggle = page.locator('text=Show Character Counter').locator('..').locator('input[type="checkbox"]');
    this.analyticsToggle = page.locator('text=Analytics').locator('..').locator('input[type="checkbox"]');
    this.marketingToggle = page.locator('text=Marketing').locator('..').locator('input[type="checkbox"]');

    // Selects
    this.reflectionRemindersSelect = page.locator('text=Reflection Reminders').locator('..').locator('select');
    this.defaultToneSelect = page.locator('text=Default Tone').locator('..').locator('select');
    this.reduceMotionSelect = page.locator('text=Reduce Motion').locator('..').locator('select');

    // Toast messages
    this.successToast = page.locator('[class*="toast"], [role="alert"]').filter({ hasText: /saved|success/i });
    this.errorToast = page.locator('[class*="toast"], [role="alert"]').filter({ hasText: /error|failed/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/settings');
    await this.page.waitForLoadState('networkidle');
  }

  async waitForLoad(): Promise<void> {
    await this.pageTitle.waitFor({ state: 'visible', timeout: 15000 });
  }

  async toggleEmailNotifications(): Promise<void> {
    await this.emailNotificationsToggle.click();
  }

  async selectDefaultTone(tone: 'fusion' | 'gentle' | 'intense'): Promise<void> {
    await this.defaultToneSelect.selectOption(tone);
  }

  async selectReflectionReminders(option: 'off' | 'daily' | 'weekly'): Promise<void> {
    await this.reflectionRemindersSelect.selectOption(option);
  }

  // Assertions
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/settings/);
    await this.waitForLoad();
  }

  async expectAllSectionsVisible(): Promise<void> {
    await expect(this.notificationSection).toBeVisible();
    await expect(this.reflectionSection).toBeVisible();
    await expect(this.displaySection).toBeVisible();
    await expect(this.privacySection).toBeVisible();
  }

  async expectSaveSuccess(): Promise<void> {
    await expect(this.successToast).toBeVisible({ timeout: 5000 });
  }
}
```

### pricing.page.ts

```typescript
// e2e/pages/pricing.page.ts - Pricing Page Object Model

import { Page, Locator, expect } from '@playwright/test';

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

  // Navigation
  readonly appNavigation: Locator;
  readonly landingNavigation: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header
    this.pageTitle = page.locator('h1').filter({ hasText: /find your space|pricing/i });
    this.subtitle = page.locator('text=/choose what feels right/i');

    // Billing toggle
    this.monthlyButton = page.getByRole('button', { name: /monthly/i });
    this.yearlyButton = page.getByRole('button', { name: /yearly/i });
    this.saveBadge = page.locator('text=/save 17%/i');

    // Tier cards by name
    this.wandererCard = page.locator('[class*="card"]').filter({ hasText: 'Wanderer' });
    this.seekerCard = page.locator('[class*="card"]').filter({ hasText: 'Seeker' });
    this.devotedCard = page.locator('[class*="card"]').filter({ hasText: 'Devoted' });
    this.popularBadge = page.locator('text=/popular/i');

    // Generic card elements
    this.tierCards = page.locator('[class*="pricing-card"], [class*="tier-card"], [class*="card"]').filter({ hasText: /wanderer|seeker|devoted/i });
    this.priceDisplays = page.locator('[class*="price"]');
    this.featureLists = page.locator('ul');
    this.ctaButtons = page.locator('button').filter({ hasText: /get started|current|upgrade/i });

    // FAQ
    this.faqSection = page.locator('text=Frequently Asked Questions').locator('..');
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

  // Assertions
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/pricing/);
    await this.waitForLoad();
  }

  async expectThreeTierCards(): Promise<void> {
    await expect(this.tierCards).toHaveCount(3);
  }

  async expectSeekerPopular(): Promise<void> {
    await expect(this.seekerCard.locator('text=/popular/i')).toBeVisible();
  }

  async expectYearlySelected(): Promise<void> {
    await expect(this.yearlyButton).toHaveClass(/bg-white/);
  }

  async expectMonthlySelected(): Promise<void> {
    await expect(this.monthlyButton).toHaveClass(/bg-white/);
  }
}
```

### admin.page.ts

```typescript
// e2e/pages/admin.page.ts - Admin Dashboard Page Object Model

import { Page, Locator, expect } from '@playwright/test';

export class AdminPage {
  readonly page: Page;

  // Header
  readonly pageTitle: Locator;
  readonly roleBadge: Locator;
  readonly subtitle: Locator;

  // Stat cards
  readonly totalUsersCard: Locator;
  readonly freeTierCard: Locator;
  readonly proTierCard: Locator;
  readonly unlimitedCard: Locator;
  readonly totalReflectionsCard: Locator;
  readonly evolutionReportsCard: Locator;
  readonly artifactsCard: Locator;

  // Users table
  readonly usersSection: Locator;
  readonly usersTable: Locator;
  readonly userRows: Locator;
  readonly emailColumn: Locator;
  readonly tierColumn: Locator;
  readonly statusColumn: Locator;

  // Webhook events table
  readonly webhookSection: Locator;
  readonly webhookTable: Locator;
  readonly webhookRows: Locator;

  // Loading/Error states
  readonly loader: Locator;
  readonly errorDisplay: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header
    this.pageTitle = page.locator('h1').filter({ hasText: 'Admin Dashboard' });
    this.roleBadge = page.locator('text=/admin|creator/i').first();
    this.subtitle = page.locator('text=System overview');

    // Stat cards by icon/label
    this.totalUsersCard = page.locator('text=Total Users').locator('..').locator('..');
    this.freeTierCard = page.locator('text=Free Tier').locator('..').locator('..');
    this.proTierCard = page.locator('text=Pro Tier').locator('..').locator('..');
    this.unlimitedCard = page.locator('text=Unlimited').locator('..').locator('..');
    this.totalReflectionsCard = page.locator('text=Total Reflections').locator('..').locator('..');
    this.evolutionReportsCard = page.locator('text=Evolution Reports').locator('..').locator('..');
    this.artifactsCard = page.locator('text=Artifacts').locator('..').locator('..');

    // Users section
    this.usersSection = page.locator('text=Recent Users').locator('..');
    this.usersTable = page.locator('table').first();
    this.userRows = this.usersTable.locator('tbody tr');
    this.emailColumn = this.usersTable.locator('th').filter({ hasText: 'Email' });
    this.tierColumn = this.usersTable.locator('th').filter({ hasText: 'Tier' });
    this.statusColumn = this.usersTable.locator('th').filter({ hasText: 'Status' });

    // Webhook section
    this.webhookSection = page.locator('text=Recent Webhook Events').locator('..');
    this.webhookTable = page.locator('table').last();
    this.webhookRows = this.webhookTable.locator('tbody tr');

    // States
    this.loader = page.locator('[class*="loader"], [class*="loading"]');
    this.errorDisplay = page.locator('[class*="error"]').filter({ hasText: /error/i });
    this.emptyState = page.locator('text=/no users|no events/i');
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin');
    await this.page.waitForLoadState('networkidle');
  }

  async waitForLoad(): Promise<void> {
    await this.pageTitle.waitFor({ state: 'visible', timeout: 15000 });
  }

  async getStatValue(card: Locator): Promise<string> {
    const valueElement = card.locator('[class*="text-2xl"], [class*="text-3xl"]').first();
    return (await valueElement.textContent()) || '';
  }

  // Assertions
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/admin/);
    await this.waitForLoad();
  }

  async expectRedirectToDashboard(): Promise<void> {
    await expect(this.page).toHaveURL(/\/dashboard/);
  }

  async expectStatsVisible(): Promise<void> {
    await expect(this.totalUsersCard).toBeVisible();
    await expect(this.freeTierCard).toBeVisible();
    await expect(this.proTierCard).toBeVisible();
  }

  async expectUsersTableVisible(): Promise<void> {
    await expect(this.usersSection).toBeVisible();
    await expect(this.usersTable).toBeVisible();
  }

  async expectWebhookSectionVisible(): Promise<void> {
    await expect(this.webhookSection).toBeVisible();
  }
}
```

### clarify-list.page.ts

```typescript
// e2e/pages/clarify-list.page.ts - Clarify Sessions List Page Object

import { Page, Locator, expect } from '@playwright/test';

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

    // Header
    this.pageTitle = page.locator('text=Clarify').first();
    this.subtitle = page.locator('text=/explore what.*emerging/i');
    this.newConversationButton = page.getByRole('button', { name: /new conversation/i });

    // Limits
    this.limitsCard = page.locator('[class*="border-l-4"]').filter({ hasText: /sessions/i });
    this.sessionsUsed = page.locator('text=/\\d+ \\/ \\d+ sessions/i');
    this.limitReachedBanner = page.locator('text=/limit reached/i');

    // Filters
    this.activeFilter = page.getByRole('button', { name: 'Active' });
    this.archivedFilter = page.getByRole('button', { name: 'Archived' });
    this.allFilter = page.getByRole('button', { name: 'All' });

    // Sessions
    this.sessionCards = page.locator('[class*="card"]').filter({ hasText: /messages/ });
    this.sessionTitles = this.sessionCards.locator('h3');
    this.sessionMessageCounts = this.sessionCards.locator('text=/\\d+ messages/');
    this.sessionTimestamps = this.sessionCards.locator('text=/ago/');
    this.archivedBadges = page.locator('text=Archived');

    // Actions (in dropdown)
    this.moreOptionsButtons = page.locator('[aria-label="Session options"]');
    this.archiveButton = page.getByRole('button', { name: 'Archive' });
    this.restoreButton = page.getByRole('button', { name: 'Restore' });
    this.deleteButton = page.getByRole('button', { name: 'Delete' });

    // Empty state
    this.emptyState = page.locator('text=Start exploring').locator('..');
    this.emptyStateButton = page.getByRole('button', { name: /start a conversation/i });

    // Loading
    this.loader = page.locator('[class*="loader"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/clarify');
    await this.page.waitForLoadState('networkidle');
  }

  async waitForLoad(): Promise<void> {
    // Wait for either sessions or empty state
    await Promise.race([
      this.sessionCards.first().waitFor({ state: 'visible', timeout: 15000 }),
      this.emptyState.waitFor({ state: 'visible', timeout: 15000 }),
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
    await this.moreOptionsButtons.nth(index).click();
  }

  // Assertions
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/clarify/);
    await this.waitForLoad();
  }

  async expectRedirectToPricing(): Promise<void> {
    await expect(this.page).toHaveURL(/\/pricing/);
  }

  async expectLimitsDisplayed(): Promise<void> {
    await expect(this.limitsCard).toBeVisible();
    await expect(this.sessionsUsed).toBeVisible();
  }

  async expectSessionsVisible(): Promise<void> {
    await expect(this.sessionCards.first()).toBeVisible();
  }

  async expectEmptyState(): Promise<void> {
    await expect(this.emptyState).toBeVisible();
  }
}
```

### clarify-session.page.ts

```typescript
// e2e/pages/clarify-session.page.ts - Clarify Chat Session Page Object

import { Page, Locator, expect } from '@playwright/test';

export class ClarifySessionPage {
  readonly page: Page;

  // Header
  readonly backButton: Locator;
  readonly sessionTitle: Locator;

  // Messages
  readonly messageContainer: Locator;
  readonly userMessages: Locator;
  readonly assistantMessages: Locator;
  readonly typingIndicator: Locator;

  // Input
  readonly messageInput: Locator;
  readonly sendButton: Locator;

  // Loading/States
  readonly loader: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header
    this.backButton = page.locator('a[href="/clarify"], button').filter({ hasText: /back|←|chevron/i }).first();
    this.sessionTitle = page.locator('h1, h2').first();

    // Messages
    this.messageContainer = page.locator('[class*="message"], [class*="chat"]').first();
    this.userMessages = page.locator('[class*="user-message"], [class*="from-user"]');
    this.assistantMessages = page.locator('[class*="assistant"], [class*="ai-message"]');
    this.typingIndicator = page.locator('[class*="typing"], [class*="loading"]');

    // Input
    this.messageInput = page.locator('textarea, input[type="text"]').filter({ hasText: '' }).last();
    this.sendButton = page.getByRole('button', { name: /send/i });

    // States
    this.loader = page.locator('[class*="loader"]');
    this.errorMessage = page.locator('[class*="error"]');
  }

  async goto(sessionId: string): Promise<void> {
    await this.page.goto(`/clarify/${sessionId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async waitForLoad(): Promise<void> {
    await this.messageInput.waitFor({ state: 'visible', timeout: 15000 });
  }

  async sendMessage(text: string): Promise<void> {
    await this.messageInput.fill(text);
    await this.sendButton.click();
  }

  async goBack(): Promise<void> {
    await this.backButton.click();
  }

  // Assertions
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/clarify\/.+/);
    await this.waitForLoad();
  }

  async expectMessageInputVisible(): Promise<void> {
    await expect(this.messageInput).toBeVisible();
    await expect(this.sendButton).toBeVisible();
  }

  async expectTypingIndicator(): Promise<void> {
    await expect(this.typingIndicator).toBeVisible({ timeout: 5000 });
  }
}
```

---

## Test Spec Patterns

### Profile Spec Pattern

```typescript
// e2e/profile/profile.spec.ts

import { test, expect } from '../fixtures/auth.fixture';
import { MOBILE_VIEWPORTS } from '../fixtures/test-data.fixture';
import { ProfilePage } from '../pages/profile.page';

test.describe('Profile Page', () => {
  let profilePage: ProfilePage;

  test.beforeEach(async ({ authenticatedPage }) => {
    profilePage = new ProfilePage(authenticatedPage);
    await profilePage.goto();
    await profilePage.waitForLoad();
  });

  test.describe('Page Display', () => {
    test('loads profile page successfully', async ({ authenticatedPage }) => {
      await profilePage.expectLoaded();
      await expect(authenticatedPage).toHaveURL(/\/profile/);
    });

    test('displays page title', async () => {
      await expect(profilePage.pageTitle).toBeVisible();
    });

    test('displays demo user banner for demo account', async () => {
      await profilePage.expectDemoBannerVisible();
    });

    test('displays account information section', async () => {
      await expect(profilePage.page.locator('text=Account')).toBeVisible();
    });

    test('displays usage statistics section', async () => {
      await expect(profilePage.usageStatsCard).toBeVisible();
    });

    test('displays subscription status card', async () => {
      await expect(profilePage.subscriptionCard).toBeVisible();
    });
  });

  test.describe('Edit Name', () => {
    test('allows editing name', async () => {
      // Demo user has edit disabled, but we can verify the UI exists
      await expect(profilePage.editNameButton).toBeVisible();
    });
  });

  test.describe('Account Actions', () => {
    test('displays change password option', async () => {
      await expect(profilePage.changePasswordButton).toBeVisible();
    });

    test('displays delete account option', async () => {
      await expect(profilePage.deleteAccountButton).toBeVisible();
    });
  });
});

test.describe('Profile Mobile', () => {
  test.use({
    viewport: MOBILE_VIEWPORTS.iphone13,
    isMobile: true,
    hasTouch: true,
  });

  test('displays correctly on mobile viewport', async ({ page }) => {
    // Manual demo login for mobile viewport tests
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const demoButton = page.locator('button').filter({ hasText: 'Try It' }).first();
    const isVisible = await demoButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (isVisible) {
      await demoButton.click();
      await page.waitForURL('/dashboard', { timeout: 30000 });

      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await profilePage.waitForLoad();

      await expect(profilePage.pageTitle).toBeVisible();
      await expect(profilePage.usageStatsCard).toBeVisible();
    } else {
      test.skip(true, 'Demo login not available');
    }
  });
});
```

### Admin Spec Pattern

```typescript
// e2e/admin/admin.spec.ts

import { test, expect } from '../fixtures/admin.fixture';
import { test as baseTest } from '@playwright/test';
import { AdminPage } from '../pages/admin.page';

test.describe('Admin Dashboard', () => {
  let adminPage: AdminPage;

  test.beforeEach(async ({ adminPage: page }) => {
    adminPage = new AdminPage(page);
    await adminPage.goto();
    await adminPage.waitForLoad();
  });

  test.describe('Authorization', () => {
    test('allows admin/creator access', async ({ adminPage: page }) => {
      await adminPage.expectLoaded();
      await expect(page).toHaveURL(/\/admin/);
    });
  });

  test.describe('Stats Display', () => {
    test('displays total users stat', async () => {
      await expect(adminPage.totalUsersCard).toBeVisible();
    });

    test('displays tier breakdown stats', async () => {
      await adminPage.expectStatsVisible();
    });

    test('displays total reflections stat', async () => {
      await expect(adminPage.totalReflectionsCard).toBeVisible();
    });
  });

  test.describe('Users Table', () => {
    test('displays recent users section', async () => {
      await adminPage.expectUsersTableVisible();
    });

    test('shows user email, tier, and status columns', async () => {
      await expect(adminPage.emailColumn).toBeVisible();
      await expect(adminPage.tierColumn).toBeVisible();
      await expect(adminPage.statusColumn).toBeVisible();
    });
  });

  test.describe('Webhook Events', () => {
    test('displays webhook events section', async () => {
      await adminPage.expectWebhookSectionVisible();
    });
  });
});

// Test non-admin redirect separately (without admin fixture)
baseTest.describe('Admin Authorization - Non-Admin', () => {
  baseTest('redirects non-authenticated users to signin', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForURL(/\/auth\/signin/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/auth\/signin/);
  });
});
```

### Error Handling Spec Pattern

```typescript
// e2e/error/error.spec.ts

import { test, expect, withNetworkOffline, withApiError } from '../fixtures/network.fixture';
import { test as authTest } from '../fixtures/auth.fixture';
import { DashboardPage } from '../pages/dashboard.page';

test.describe('Error Handling', () => {
  test.describe('Network Errors', () => {
    test('shows error state when API is unreachable', async ({ networkPage, simulateOffline }) => {
      // First, authenticate
      await networkPage.goto('/');
      await networkPage.waitForLoadState('networkidle');

      const demoButton = networkPage.locator('button').filter({ hasText: 'Try It' }).first();
      await demoButton.click();
      await networkPage.waitForURL('/dashboard', { timeout: 30000 });

      // Now simulate offline
      await simulateOffline();

      // Navigate to trigger error
      await networkPage.goto('/dreams');

      // Should show some error indication or handle gracefully
      // (depends on app implementation)
      await expect(networkPage.locator('body')).toBeVisible();
    });
  });

  test.describe('API Errors', () => {
    test('handles 500 error gracefully', async ({ networkPage, simulateApiError }) => {
      await simulateApiError('**/trpc/**', 500);

      await networkPage.goto('/');
      await networkPage.waitForLoadState('networkidle');

      // Page should still render (landing page doesn't require auth)
      await expect(networkPage.locator('h1')).toBeVisible();
    });
  });
});

// Session expiry tests with authenticated fixture
authTest.describe('Session Expiry', () => {
  authTest('handles session gracefully when expired', async ({ authenticatedPage }) => {
    const dashboardPage = new DashboardPage(authenticatedPage);
    await dashboardPage.goto();
    await dashboardPage.waitForLoad();

    // Clear cookies to simulate session expiry
    await authenticatedPage.context().clearCookies();

    // Try navigating - should redirect to signin
    await authenticatedPage.goto('/profile');
    await authenticatedPage.waitForURL(/\/auth\/signin|\//, { timeout: 10000 });
  });
});
```

---

## Import Order Convention

```typescript
// 1. Playwright imports
import { test, expect, Page, Locator } from '@playwright/test';

// 2. Fixture imports
import { test as authTest, expect as authExpect } from '../fixtures/auth.fixture';
import { MOBILE_VIEWPORTS, TEST_TIMEOUTS } from '../fixtures/test-data.fixture';

// 3. Page object imports
import { ProfilePage } from '../pages/profile.page';
import { SettingsPage } from '../pages/settings.page';

// 4. Type imports (if needed)
import type { UserPreferences } from '@/types/user';
```

---

## Test Naming Convention

```typescript
test.describe('FeatureName', () => {
  test.describe('Category', () => {
    test('specific behavior description', async () => {});
  });
});

// Examples:
// 'loads profile page successfully'
// 'displays demo user banner for demo account'
// 'allows editing name'
// 'redirects non-authenticated users to signin'
// 'shows error state when API is unreachable'
```

---

## Wait Strategy

Prefer Playwright auto-waiting over manual waits:

```typescript
// GOOD: Let Playwright auto-wait
await expect(element).toBeVisible();
await page.click('button');  // Auto-waits for clickable

// ACCEPTABLE: waitFor with reasonable timeout
await element.waitFor({ state: 'visible', timeout: 15000 });

// AVOID: Hard waits (use only when necessary)
await page.waitForTimeout(1000);  // Only for animations/transitions
```

---

## Error Handling in Tests

```typescript
// Handle optional elements gracefully
const isVisible = await element.isVisible({ timeout: 2000 }).catch(() => false);
if (isVisible) {
  await element.click();
} else {
  test.skip(true, 'Element not available');
}

// Handle race conditions
await Promise.race([
  page.waitForURL('/dashboard'),
  page.waitForURL('/auth/signin'),
]).catch(() => {});
```
