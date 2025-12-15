// playwright.config.ts - Playwright E2E Test Configuration

import path from 'path';

import { defineConfig, devices } from '@playwright/test';

const AUTH_FILE = path.join(__dirname, 'e2e/.auth/user.json');

/**
 * Playwright configuration for Mirror of Dreams E2E tests
 *
 * Performance optimizations for CI:
 * - 4 parallel workers (was 1)
 * - Production build instead of dev server
 * - Auth state persistence (login once, reuse)
 * - Reduced timeouts
 * - Single retry (was 2)
 * - Traces/videos only on failure
 */
export default defineConfig({
  testDir: './e2e',

  // Global setup performs demo login once (CI only - local dev uses per-test auth)
  globalSetup: process.env.CI ? require.resolve('./e2e/global-setup') : undefined,

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Single retry for flaky tests (was 2)
  retries: process.env.CI ? 1 : 0,

  // Parallel workers: 4 in CI (was 1), auto locally
  workers: process.env.CI ? 4 : undefined,

  // Reporter configuration
  reporter: process.env.CI
    ? [['html', { outputFolder: 'playwright-report' }], ['github'], ['list']]
    : [['html', { outputFolder: 'playwright-report' }], ['list']],

  // Shared settings for all projects
  use: {
    baseURL: 'http://localhost:3000',

    // Only collect traces on failure (saves time)
    trace: 'retain-on-failure',

    // Screenshot on failure only
    screenshot: 'only-on-failure',

    // No video by default (saves significant time)
    video: 'off',

    // Reduced timeouts
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },

  // Reduced test timeout (was 60s)
  timeout: 30000,

  // Expect timeout
  expect: {
    timeout: 5000,
  },

  // Browser projects
  projects: process.env.CI
    ? [
        // CI: Split into auth and non-auth projects with storage state
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
          testMatch: /\/(landing|signin|signup|error)\.spec\.ts$/,
        },
        {
          name: 'chromium-auth',
          use: {
            ...devices['Desktop Chrome'],
            storageState: AUTH_FILE,
          },
          testIgnore: /\/(landing|signin|signup|error)\.spec\.ts$/,
        },
      ]
    : [
        // Local: Single project, tests handle their own auth
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
        {
          name: 'firefox',
          use: { ...devices['Desktop Firefox'] },
        },
        {
          name: 'mobile-safari',
          use: { ...devices['iPhone 13'] },
        },
      ],

  // Web server configuration
  webServer: {
    // Use production build in CI (much faster), dev locally
    command: process.env.CI ? 'npm run start' : 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
