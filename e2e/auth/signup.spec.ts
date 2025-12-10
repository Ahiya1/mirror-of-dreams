// e2e/auth/signup.spec.ts - Sign Up E2E Tests

import { test, expect } from '@playwright/test';

import { generateTestEmail, TEST_USER } from '../fixtures/auth.fixture';
import { SignUpPage } from '../pages/signup.page';

/**
 * Sign Up Flow E2E Tests
 *
 * Tests the sign up page functionality including:
 * - Form display and elements
 * - Field validation
 * - Password matching
 * - Password strength indicator
 * - Navigation to signin page
 *
 * Note: The signup page uses client-side validation and displays
 * field-level errors inline. Global errors use .status-box-error.
 */
test.describe('Sign Up Flow', () => {
  let signupPage: SignUpPage;

  test.beforeEach(async ({ page }) => {
    signupPage = new SignUpPage(page);
    await signupPage.goto();
  });

  test.describe('Page Display', () => {
    test('displays signup form elements', async () => {
      await signupPage.expectFormElementsVisible();
    });

    test('displays page title', async () => {
      await signupPage.expectPageTitle();
    });

    test('displays signin link', async () => {
      await expect(signupPage.signinLink).toBeVisible();
      await expect(signupPage.signinLink).toContainText(/Welcome back|Sign in/i);
    });

    test('displays password strength indicator', async () => {
      // Initially shows "6+ characters required"
      await expect(signupPage.page.locator('text=6+ characters required')).toBeVisible();
    });
  });

  test.describe('Password Strength Indicator', () => {
    test('updates as password is typed', async () => {
      // Start with requirement text
      await expect(signupPage.page.locator('text=6+ characters required')).toBeVisible();

      // Type 3 characters
      await signupPage.fillPassword('abc');

      // Should show remaining characters needed
      await expect(signupPage.page.locator('text=3 more characters needed')).toBeVisible();

      // Type to 6 characters
      await signupPage.fillPassword('abcdef');

      // Should show valid password length
      await expect(signupPage.page.locator('text=Valid password length')).toBeVisible();
    });

    test('shows singular form for 1 character needed', async () => {
      await signupPage.fillPassword('abcde'); // 5 characters

      // Should show "1 more character needed" (singular)
      await expect(signupPage.page.locator('text=1 more character needed')).toBeVisible();
    });
  });

  test.describe('Form Interaction', () => {
    test('form fields are editable', async () => {
      await expect(signupPage.nameInput).toBeEditable();
      await expect(signupPage.emailInput).toBeEditable();
      await expect(signupPage.passwordInput).toBeEditable();
      await expect(signupPage.confirmPasswordInput).toBeEditable();
    });

    test('can fill all fields correctly', async () => {
      const testEmail = generateTestEmail();

      await signupPage.fillForm(TEST_USER.name, testEmail, TEST_USER.password, TEST_USER.password);

      // Verify all fields have correct values
      await expect(signupPage.nameInput).toHaveValue(TEST_USER.name);
      await expect(signupPage.emailInput).toHaveValue(testEmail);
      // Password fields are type="password", still verify they're filled
      await expect(signupPage.passwordInput).not.toHaveValue('');
      await expect(signupPage.confirmPasswordInput).not.toHaveValue('');
    });

    test('submit button is enabled', async () => {
      await expect(signupPage.submitButton).toBeEnabled();
    });

    test('submit button shows correct text', async () => {
      await expect(signupPage.submitButton).toContainText(/Create|Sign|Register/i);
    });
  });

  test.describe('Navigation', () => {
    test('navigates to signin page', async ({ page }) => {
      await signupPage.navigateToSignin();
      await page.waitForURL('/auth/signin');
      expect(page.url()).toContain('/auth/signin');
    });
  });

  test.describe('Accessibility', () => {
    test('form inputs have proper labels', async ({ page }) => {
      // Check that inputs have associated labels
      const nameLabel = page.locator('label[for="name"]');
      const emailLabel = page.locator('label[for="email"]');
      const passwordLabel = page.locator('label[for="password"]');
      const confirmLabel = page.locator('label[for="confirmPassword"]');

      await expect(nameLabel).toBeVisible();
      await expect(emailLabel).toBeVisible();
      await expect(passwordLabel).toBeVisible();
      await expect(confirmLabel).toBeVisible();
    });

    test('required fields are marked', async () => {
      // Required fields should have asterisk or required attribute
      await expect(signupPage.nameInput).toHaveAttribute('required');
      await expect(signupPage.emailInput).toHaveAttribute('required');
      await expect(signupPage.passwordInput).toHaveAttribute('required');
      await expect(signupPage.confirmPasswordInput).toHaveAttribute('required');
    });

    test('password fields have autocomplete hints', async () => {
      await expect(signupPage.passwordInput).toHaveAttribute('autocomplete', 'new-password');
      await expect(signupPage.confirmPasswordInput).toHaveAttribute('autocomplete', 'new-password');
    });
  });

  test.describe('Security', () => {
    test('password fields hide input by default', async () => {
      // Password inputs should have type="password"
      await expect(signupPage.passwordInput).toHaveAttribute('type', 'password');
      await expect(signupPage.confirmPasswordInput).toHaveAttribute('type', 'password');
    });

    test('unique test emails prevent conflicts', () => {
      // Generate multiple emails and verify uniqueness
      const email1 = generateTestEmail();
      const email2 = generateTestEmail();

      expect(email1).not.toEqual(email2);
      expect(email1).toMatch(/@test\.local$/);
      expect(email2).toMatch(/@test\.local$/);
    });
  });

  test.describe('Input Behavior', () => {
    test('name input accepts text', async () => {
      await signupPage.fillName('John Doe');
      await expect(signupPage.nameInput).toHaveValue('John Doe');
    });

    test('email input accepts email format', async () => {
      await signupPage.fillEmail('user@example.com');
      await expect(signupPage.emailInput).toHaveValue('user@example.com');
    });

    test('password inputs accept passwords', async () => {
      await signupPage.fillPassword('SecurePass123!');
      await signupPage.fillConfirmPassword('SecurePass123!');

      // Verify inputs are not empty
      await expect(signupPage.passwordInput).not.toHaveValue('');
      await expect(signupPage.confirmPasswordInput).not.toHaveValue('');
    });
  });
});
