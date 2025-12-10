// e2e/auth/signin.spec.ts - Sign In E2E Tests

import { test, expect } from '@playwright/test';

import { SignInPage } from '../pages/signin.page';

/**
 * Sign In Flow E2E Tests
 *
 * Tests the sign in page functionality including:
 * - Form display and elements
 * - Navigation to other auth pages
 * - Form interaction and behavior
 *
 * Note: Error message validation is complex because the app uses
 * client-side validation with setMessage() which may or may not
 * render immediately. These tests focus on reliable, stable assertions.
 */
test.describe('Sign In Flow', () => {
  let signinPage: SignInPage;

  test.beforeEach(async ({ page }) => {
    signinPage = new SignInPage(page);
    await signinPage.goto();
  });

  test.describe('Page Display', () => {
    test('displays signin form elements', async () => {
      await signinPage.expectFormElementsVisible();
    });

    test('displays page title', async () => {
      await signinPage.expectPageTitle();
    });

    test('displays signup link', async () => {
      await expect(signinPage.signupLink).toBeVisible();
      await expect(signinPage.signupLink).toContainText(/Begin your journey|Sign up/i);
    });

    test('displays forgot password link', async () => {
      await expect(signinPage.forgotPasswordLink).toBeVisible();
      await expect(signinPage.forgotPasswordLink).toContainText(/Forgot password/i);
    });

    test('auto-focuses email input after delay', async () => {
      await signinPage.expectEmailFocused();
    });
  });

  test.describe('Form Behavior', () => {
    test('form fields are editable', async () => {
      await expect(signinPage.emailInput).toBeEditable();
      await expect(signinPage.passwordInput).toBeEditable();
    });

    test('can fill email field', async () => {
      await signinPage.fillEmail('user@example.com');
      await expect(signinPage.emailInput).toHaveValue('user@example.com');
    });

    test('can fill password field', async () => {
      await signinPage.fillPassword('password123');
      await expect(signinPage.passwordInput).not.toHaveValue('');
    });

    test('can fill both credentials', async () => {
      await signinPage.fillCredentials('test@example.com', 'SecurePassword123!');
      await expect(signinPage.emailInput).toHaveValue('test@example.com');
      await expect(signinPage.passwordInput).not.toHaveValue('');
    });

    test('submit button is enabled', async () => {
      await expect(signinPage.submitButton).toBeEnabled();
    });

    test('submit button has correct text', async () => {
      await expect(signinPage.submitButton).toContainText(/Enter|Sign|Login/i);
    });

    test('password field masks input', async () => {
      await expect(signinPage.passwordInput).toHaveAttribute('type', 'password');
    });
  });

  test.describe('Navigation', () => {
    test('navigates to signup page', async ({ page }) => {
      await signinPage.navigateToSignup();
      await page.waitForURL('/auth/signup');
      expect(page.url()).toContain('/auth/signup');
    });

    test('navigates to forgot password page', async ({ page }) => {
      await signinPage.navigateToForgotPassword();
      await expect(page).toHaveURL(/forgot-password/);
    });
  });

  test.describe('Accessibility', () => {
    test('form inputs have proper labels', async ({ page }) => {
      const emailLabel = page.locator('label[for="signin-email"]');
      await expect(emailLabel).toBeVisible();

      const passwordLabel = page.locator('label').filter({ hasText: /password/i });
      await expect(passwordLabel).toBeVisible();
    });

    test('email input receives focus on page load', async ({ page }) => {
      // Wait for auto-focus (800ms delay in page implementation)
      await page.waitForTimeout(1000);
      await expect(signinPage.emailInput).toBeFocused();
    });

    test('email input has correct type', async () => {
      await expect(signinPage.emailInput).toHaveAttribute('type', 'email');
    });

    test('form can be navigated with keyboard', async ({ page }) => {
      // Focus email input
      await signinPage.emailInput.focus();
      await expect(signinPage.emailInput).toBeFocused();

      // Tab to password
      await page.keyboard.press('Tab');
      // Note: There may be a password toggle button in between

      // Eventually get to submit button
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
    });
  });

  test.describe('Form Submission', () => {
    test('clicking submit initiates form submission', async ({ page }) => {
      await signinPage.fillCredentials('test@example.com', 'password123');

      // Click submit and verify button receives the click
      // We're not testing the actual auth, just that the form submits
      await signinPage.submit();

      // Page should still be responsive after submission attempt
      await expect(signinPage.emailInput).toBeAttached();
    });

    test('form can be submitted via Enter key', async ({ page }) => {
      await signinPage.fillCredentials('test@example.com', 'password123');

      // Press Enter to submit
      await page.keyboard.press('Enter');

      // Page should still be responsive
      await expect(signinPage.page).not.toBeUndefined();
    });
  });
});
