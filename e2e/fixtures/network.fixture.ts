// e2e/fixtures/network.fixture.ts - Network simulation fixtures
// Builder: Builder-1 (Plan-24 Iteration 58)
// Purpose: Provides network simulation utilities for error handling tests

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
    downloadThroughput: (400 * 1024) / 8, // 400 Kbps
    uploadThroughput: (400 * 1024) / 8,
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
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.continue();
  });

  await page.route('**/trpc/**', async (route: Route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
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
  restoreNetwork: () => Promise<void>;
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

  restoreNetwork: async ({ page }, use) => {
    const fn = async () => await clearNetworkMocks(page);
    await use(fn);
  },
});

export { expect };
