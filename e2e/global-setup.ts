// e2e/global-setup.ts - Global setup for auth state persistence

import path from 'path';

import { chromium, FullConfig } from '@playwright/test';

const AUTH_FILE = path.join(__dirname, '.auth/user.json');

/**
 * Global setup runs once before all tests.
 * Performs demo login and saves auth state for reuse.
 */
async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to landing page
    await page.goto(baseURL || 'http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Click the "Try It" demo login button
    const demoButton = page.locator('button').filter({ hasText: 'Try It' }).first();
    await demoButton.waitFor({ state: 'visible', timeout: 15000 });
    await demoButton.click();

    // Wait for redirect to dashboard (use domcontentloaded, not load - API calls may take longer)
    await page.waitForURL('/dashboard', { timeout: 30000, waitUntil: 'domcontentloaded' });

    // Verify we're on dashboard by waiting for the main dashboard element
    await page.waitForSelector('.dashboard-main, .dashboard', { timeout: 10000 }).catch(() => {
      // Fallback: just verify URL is /dashboard
      console.log('Dashboard element not found, but URL is correct - continuing');
    });

    // Save auth state
    await context.storageState({ path: AUTH_FILE });

    console.log('✓ Auth state saved successfully');
  } catch (error) {
    console.error('✗ Failed to setup auth state:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
