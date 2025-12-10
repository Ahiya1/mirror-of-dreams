// playwright.config.ts - Playwright E2E Test Configuration

import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Mirror of Dreams E2E tests
 *
 * Features:
 * - Auto-starts dev server in CI
 * - Reuses existing server in development
 * - Chromium-only in CI for speed
 * - Multi-browser testing locally
 * - Screenshot/video on failure
 * - HTML report generation
 */
export default defineConfig({
  // Test directory
  testDir: './e2e',

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only (flaky test protection)
  retries: process.env.CI ? 2 : 0,

  // Limit workers in CI for reliability
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    // GitHub Actions integration
    ...(process.env.CI ? [['github'] as const] : []),
  ],

  // Shared settings for all projects
  use: {
    // Base URL for navigation
    baseURL: 'http://localhost:3000',

    // Collect trace on first retry
    trace: 'on-first-retry',

    // Screenshot on failure only
    screenshot: 'only-on-failure',

    // Video on first retry
    video: 'on-first-retry',

    // Timeout for actions
    actionTimeout: 15000,

    // Navigation timeout
    navigationTimeout: 30000,
  },

  // Test timeout
  timeout: 60000,

  // Expect timeout
  expect: {
    timeout: 10000,
  },

  // Browser projects
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Additional browsers for local development
    ...(process.env.CI
      ? []
      : [
          {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
          },
          {
            name: 'mobile-safari',
            use: { ...devices['iPhone 13'] },
          },
        ]),
  ],

  // Web server configuration
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes to start
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
