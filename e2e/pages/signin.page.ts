// e2e/pages/signin.page.ts - Sign In Page Object Model

import { Page, Locator, expect } from '@playwright/test';

/**
 * Sign In Page Object
 *
 * Encapsulates all interactions with the sign in page.
 * Uses Page Object Model pattern for maintainable E2E tests.
 *
 * Locators are based on the actual page structure:
 * - Email: #signin-email (explicit id)
 * - Password: input with type password (second input in form)
 * - Submit: button[type="submit"]
 * - Error: .status-box-error
 * - Success: .status-box-success
 */
export class SignInPage {
  readonly page: Page;

  // Form elements
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  // Messages
  readonly errorMessage: Locator;
  readonly successMessage: Locator;

  // Navigation links
  readonly signupLink: Locator;
  readonly forgotPasswordLink: Locator;

  // Page elements
  readonly pageTitle: Locator;
  readonly demoButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Form elements using stable selectors
    this.emailInput = page.locator('#signin-email');
    this.passwordInput = page.locator('input[type="password"]');
    this.submitButton = page.locator('button[type="submit"]');

    // Message containers
    this.errorMessage = page.locator('.status-box-error');
    this.successMessage = page.locator('.status-box-success');

    // Navigation links
    this.signupLink = page.locator('a[href="/auth/signup"]');
    this.forgotPasswordLink = page.locator('a[href="/auth/forgot-password.html"]');

    // Page elements
    this.pageTitle = page.locator('h1, h2').filter({ hasText: /Welcome Back/i });
    this.demoButton = page.locator('button:has-text("Demo"), button:has-text("Try Demo")');
  }

  /**
   * Navigate to sign in page
   * Uses element wait instead of waitForLoadState for CI reliability
   */
  async goto(): Promise<void> {
    await this.page.goto('/auth/signin');
    // Wait for the email input to be visible - more reliable than waitForLoadState
    await this.emailInput.waitFor({ state: 'visible', timeout: 15000 });
  }

  /**
   * Fill email field
   */
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  /**
   * Fill password field
   */
  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  /**
   * Fill both email and password
   */
  async fillCredentials(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
  }

  /**
   * Click submit button
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Complete sign in flow
   */
  async signin(email: string, password: string): Promise<void> {
    await this.fillCredentials(email, password);
    await this.submit();
  }

  /**
   * Sign in with demo account (if available)
   */
  async signinWithDemo(): Promise<void> {
    const isVisible = await this.demoButton.isVisible({ timeout: 2000 }).catch(() => false);
    if (!isVisible) {
      throw new Error('Demo login button not available');
    }
    await this.demoButton.click();
  }

  /**
   * Navigate to signup page via link
   */
  async navigateToSignup(): Promise<void> {
    await this.signupLink.click();
  }

  /**
   * Navigate to forgot password page via link
   */
  async navigateToForgotPassword(): Promise<void> {
    await this.forgotPasswordLink.click();
  }

  // Assertions

  /**
   * Assert error message is displayed
   */
  async expectError(message?: string | RegExp): Promise<void> {
    await expect(this.errorMessage).toBeVisible({ timeout: 10000 });
    if (message) {
      await expect(this.errorMessage).toContainText(message);
    }
  }

  /**
   * Assert success message is displayed
   */
  async expectSuccess(message?: string | RegExp): Promise<void> {
    await expect(this.successMessage).toBeVisible({ timeout: 10000 });
    if (message) {
      await expect(this.successMessage).toContainText(message);
    }
  }

  /**
   * Assert redirect to dashboard after successful login
   */
  async expectRedirectToDashboard(): Promise<void> {
    await this.page.waitForURL('/dashboard', { timeout: 30000 });
  }

  /**
   * Assert all form elements are visible
   */
  async expectFormElementsVisible(): Promise<void> {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  /**
   * Assert page title is visible
   */
  async expectPageTitle(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
  }

  /**
   * Assert email input has focus
   */
  async expectEmailFocused(): Promise<void> {
    // Wait for auto-focus (800ms delay in page)
    await this.page.waitForTimeout(1000);
    await expect(this.emailInput).toBeFocused();
  }
}
