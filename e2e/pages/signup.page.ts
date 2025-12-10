// e2e/pages/signup.page.ts - Sign Up Page Object Model

import { Page, Locator, expect } from '@playwright/test';

/**
 * Sign Up Page Object
 *
 * Encapsulates all interactions with the sign up page.
 * Uses Page Object Model pattern for maintainable E2E tests.
 *
 * Locators are based on the actual page structure:
 * - Name: #name
 * - Email: #email
 * - Password: #password
 * - Confirm Password: #confirmPassword
 * - Submit: button[type="submit"]
 * - Error: .status-box-error
 * - Success: .status-box-success
 */
export class SignUpPage {
  readonly page: Page;

  // Form elements
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;

  // Messages
  readonly errorMessage: Locator;
  readonly successMessage: Locator;

  // Field-level error messages
  readonly nameError: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;
  readonly confirmPasswordError: Locator;

  // Navigation links
  readonly signinLink: Locator;

  // Page elements
  readonly pageTitle: Locator;
  readonly passwordStrengthIndicator: Locator;

  constructor(page: Page) {
    this.page = page;

    // Form elements using explicit IDs from the page
    this.nameInput = page.locator('#name');
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.confirmPasswordInput = page.locator('#confirmPassword');
    this.submitButton = page.locator('button[type="submit"]');

    // Message containers
    this.errorMessage = page.locator('.status-box-error');
    this.successMessage = page.locator('.status-box-success');

    // Field-level error messages (inline errors below inputs)
    // Using the error message structure: <p class="text-sm text-mirror-error">
    this.nameError = page
      .locator('#name')
      .locator('..')
      .locator('..')
      .locator('p.text-mirror-error');
    this.emailError = page
      .locator('#email')
      .locator('..')
      .locator('..')
      .locator('p.text-mirror-error');
    this.passwordError = page
      .locator('#password')
      .locator('..')
      .locator('..')
      .locator('..')
      .locator('p.text-mirror-error');
    this.confirmPasswordError = page
      .locator('#confirmPassword')
      .locator('..')
      .locator('..')
      .locator('p.text-mirror-error');

    // Navigation links
    this.signinLink = page.locator('a[href="/auth/signin"]');

    // Page elements
    this.pageTitle = page.locator('h1, h2').filter({ hasText: /Begin Your Journey/i });
    this.passwordStrengthIndicator = page.locator('text=characters');
  }

  /**
   * Navigate to sign up page
   */
  async goto(): Promise<void> {
    await this.page.goto('/auth/signup');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Fill name field
   */
  async fillName(name: string): Promise<void> {
    await this.nameInput.fill(name);
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
   * Fill confirm password field
   */
  async fillConfirmPassword(confirmPassword: string): Promise<void> {
    await this.confirmPasswordInput.fill(confirmPassword);
  }

  /**
   * Fill all form fields
   */
  async fillForm(
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ): Promise<void> {
    await this.fillName(name);
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.fillConfirmPassword(confirmPassword);
  }

  /**
   * Click submit button
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Complete sign up flow
   */
  async signup(name: string, email: string, password: string): Promise<void> {
    await this.fillForm(name, email, password, password);
    await this.submit();
  }

  /**
   * Navigate to signin page via link
   */
  async navigateToSignin(): Promise<void> {
    await this.signinLink.click();
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
   * Assert field-level error for name
   */
  async expectNameError(message?: string | RegExp): Promise<void> {
    await expect(this.nameError).toBeVisible();
    if (message) {
      await expect(this.nameError).toContainText(message);
    }
  }

  /**
   * Assert field-level error for email
   */
  async expectEmailError(message?: string | RegExp): Promise<void> {
    await expect(this.emailError).toBeVisible();
    if (message) {
      await expect(this.emailError).toContainText(message);
    }
  }

  /**
   * Assert field-level error for password
   */
  async expectPasswordError(message?: string | RegExp): Promise<void> {
    await expect(this.passwordError).toBeVisible();
    if (message) {
      await expect(this.passwordError).toContainText(message);
    }
  }

  /**
   * Assert field-level error for confirm password
   */
  async expectConfirmPasswordError(message?: string | RegExp): Promise<void> {
    await expect(this.confirmPasswordError).toBeVisible();
    if (message) {
      await expect(this.confirmPasswordError).toContainText(message);
    }
  }

  /**
   * Assert redirect to verification page after signup
   */
  async expectRedirectToVerification(): Promise<void> {
    await this.page.waitForURL('/auth/verify-required', { timeout: 30000 });
  }

  /**
   * Assert all form elements are visible
   */
  async expectFormElementsVisible(): Promise<void> {
    await expect(this.nameInput).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.confirmPasswordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  /**
   * Assert page title is visible
   */
  async expectPageTitle(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
  }

  /**
   * Assert password strength indicator shows specific text
   */
  async expectPasswordStrength(text: string): Promise<void> {
    await expect(this.page.locator(`text=${text}`)).toBeVisible();
  }
}
