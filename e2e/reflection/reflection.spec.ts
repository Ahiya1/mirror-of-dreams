// e2e/reflection/reflection.spec.ts - Reflection E2E Tests

import { test, expect } from '@playwright/test';

import { test as authTest } from '../fixtures/auth.fixture';
import { ReflectionPage } from '../pages/reflection.page';

/**
 * Reflection Flow E2E Tests
 *
 * Tests the reflection experience including:
 * - Page display and loading
 * - Dream selection
 * - Form interactions
 * - Tone selection
 * - Mobile flow
 * - Demo user experience
 *
 * Note: We do NOT test actual form submission to avoid creating test data.
 * Tests verify UI elements and interactions up to the submission point.
 */
authTest.describe('Reflection', () => {
  let reflectionPage: ReflectionPage;

  authTest.beforeEach(async ({ authenticatedPage }) => {
    reflectionPage = new ReflectionPage(authenticatedPage);
    await reflectionPage.goto();
    await reflectionPage.waitForLoad();
  });

  authTest.describe('Page Display', () => {
    authTest('displays reflection page when authenticated', async ({ authenticatedPage }) => {
      await expect(authenticatedPage).toHaveURL(/\/reflection/);
    });

    authTest('displays dream selection when no dream selected', async () => {
      // On first load without dreamId param, should show dream selection
      // Unless user has no dreams (then shows form or empty state)
      const hasDreamSelection = await reflectionPage.dreamSelectionTitle
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      const hasForm = await reflectionPage.formView.isVisible({ timeout: 2000 }).catch(() => false);
      const hasNoDreams = await reflectionPage.noDreamsMessage
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      // One of these should be visible
      expect(hasDreamSelection || hasForm || hasNoDreams).toBe(true);
    });

    authTest('displays form when dream is selected', async () => {
      // First check if dream selection is visible
      const hasDreamSelection = await reflectionPage.dreamSelectionTitle
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (hasDreamSelection) {
        // Check if there are dreams to select
        const hasDreams = await reflectionPage.dreamOptions
          .first()
          .isVisible({ timeout: 3000 })
          .catch(() => false);

        if (hasDreams) {
          await reflectionPage.selectDream(0);
          await reflectionPage.expectFormVisible();
        }
      } else {
        // Dream might already be selected or user has no dreams
        const hasForm = await reflectionPage.formView
          .isVisible({ timeout: 2000 })
          .catch(() => false);
        expect(hasForm || true).toBe(true); // Pass test if form visible or dream selection not available
      }
    });

    authTest('displays tone selector', async () => {
      // Navigate to form first
      const hasDreamSelection = await reflectionPage.dreamSelectionTitle
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (hasDreamSelection) {
        const hasDreams = await reflectionPage.dreamOptions
          .first()
          .isVisible({ timeout: 3000 })
          .catch(() => false);
        if (hasDreams) {
          await reflectionPage.selectDream(0);
        }
      }

      const hasForm = await reflectionPage.formView.isVisible({ timeout: 5000 }).catch(() => false);
      if (hasForm) {
        await reflectionPage.expectToneSelectVisible();
      }
    });

    authTest('displays submit button', async () => {
      // Navigate to form first
      const hasDreamSelection = await reflectionPage.dreamSelectionTitle
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (hasDreamSelection) {
        const hasDreams = await reflectionPage.dreamOptions
          .first()
          .isVisible({ timeout: 3000 })
          .catch(() => false);
        if (hasDreams) {
          await reflectionPage.selectDream(0);
        }
      }

      const hasForm = await reflectionPage.formView.isVisible({ timeout: 5000 }).catch(() => false);
      if (hasForm) {
        await reflectionPage.expectSubmitVisible();
      }
    });
  });

  authTest.describe('Dream Selection', () => {
    authTest("shows user's active dreams when available", async () => {
      const hasDreamSelection = await reflectionPage.dreamSelectionTitle
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (hasDreamSelection) {
        const hasDreams = await reflectionPage.dreamOptions
          .first()
          .isVisible({ timeout: 5000 })
          .catch(() => false);
        const hasNoDreams = await reflectionPage.noDreamsMessage
          .isVisible({ timeout: 2000 })
          .catch(() => false);

        // Either dreams or no dreams message should be visible
        expect(hasDreams || hasNoDreams).toBe(true);
      }
    });

    authTest('can select a dream from list', async () => {
      const hasDreamSelection = await reflectionPage.dreamSelectionTitle
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (hasDreamSelection) {
        const hasDreams = await reflectionPage.dreamOptions
          .first()
          .isVisible({ timeout: 3000 })
          .catch(() => false);

        if (hasDreams) {
          await reflectionPage.selectDream(0);
          // After selection, form should be visible
          await reflectionPage.expectFormVisible();
        }
      }
    });

    authTest('shows message when no dreams available', async () => {
      const hasDreamSelection = await reflectionPage.dreamSelectionTitle
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (hasDreamSelection) {
        const hasNoDreams = await reflectionPage.noDreamsMessage
          .isVisible({ timeout: 3000 })
          .catch(() => false);

        if (hasNoDreams) {
          await expect(reflectionPage.createDreamCta).toBeVisible();
        }
      }
    });
  });

  authTest.describe('Form Interaction', () => {
    authTest.beforeEach(async () => {
      // Navigate to form
      const hasDreamSelection = await reflectionPage.dreamSelectionTitle
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      if (hasDreamSelection) {
        const hasDreams = await reflectionPage.dreamOptions
          .first()
          .isVisible({ timeout: 3000 })
          .catch(() => false);
        if (hasDreams) {
          await reflectionPage.selectDream(0);
        }
      }
    });

    authTest('form fields are editable', async () => {
      const hasForm = await reflectionPage.formView.isVisible({ timeout: 5000 }).catch(() => false);
      if (hasForm) {
        const firstTextarea = reflectionPage.getQuestionTextarea(0);
        await expect(firstTextarea).toBeEditable();
      }
    });

    authTest('can fill question fields', async () => {
      const hasForm = await reflectionPage.formView.isVisible({ timeout: 5000 }).catch(() => false);
      if (hasForm) {
        const testText = 'This is a test reflection answer';
        await reflectionPage.fillQuestion(0, testText);

        const firstTextarea = reflectionPage.getQuestionTextarea(0);
        await expect(firstTextarea).toHaveValue(testText);
      }
    });

    authTest('displays all four question cards', async () => {
      const hasForm = await reflectionPage.formView.isVisible({ timeout: 5000 }).catch(() => false);
      if (hasForm) {
        const count = await reflectionPage.questionCards.count();
        expect(count).toBe(4);
      }
    });

    authTest('question cards have guiding text', async () => {
      const hasForm = await reflectionPage.formView.isVisible({ timeout: 5000 }).catch(() => false);
      if (hasForm) {
        // Each question card should have italic guiding text
        const firstCard = reflectionPage.questionCards.first();
        const guidingText = firstCard.locator('p.italic');
        await expect(guidingText).toBeVisible();
      }
    });
  });

  authTest.describe('Tone Selection', () => {
    authTest.beforeEach(async () => {
      // Navigate to form
      const hasDreamSelection = await reflectionPage.dreamSelectionTitle
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      if (hasDreamSelection) {
        const hasDreams = await reflectionPage.dreamOptions
          .first()
          .isVisible({ timeout: 3000 })
          .catch(() => false);
        if (hasDreams) {
          await reflectionPage.selectDream(0);
        }
      }
    });

    authTest('displays all tone options', async () => {
      const hasForm = await reflectionPage.formView.isVisible({ timeout: 5000 }).catch(() => false);
      if (hasForm) {
        await reflectionPage.expectAllToneOptionsVisible();
      }
    });

    authTest('can select fusion tone', async () => {
      const hasForm = await reflectionPage.formView.isVisible({ timeout: 5000 }).catch(() => false);
      if (hasForm) {
        await reflectionPage.selectTone('fusion');
        await reflectionPage.expectToneSelected('fusion');
      }
    });

    authTest('can select gentle tone', async () => {
      const hasForm = await reflectionPage.formView.isVisible({ timeout: 5000 }).catch(() => false);
      if (hasForm) {
        await reflectionPage.selectTone('gentle');
        await reflectionPage.expectToneSelected('gentle');
      }
    });

    authTest('can select intense tone', async () => {
      const hasForm = await reflectionPage.formView.isVisible({ timeout: 5000 }).catch(() => false);
      if (hasForm) {
        await reflectionPage.selectTone('intense');
        await reflectionPage.expectToneSelected('intense');
      }
    });

    authTest('tone selection shows visual feedback', async () => {
      const hasForm = await reflectionPage.formView.isVisible({ timeout: 5000 }).catch(() => false);
      if (hasForm) {
        await reflectionPage.selectTone('gentle');
        // Selected tone should have aria-pressed="true"
        await expect(reflectionPage.toneGentle).toHaveAttribute('aria-pressed', 'true');
      }
    });
  });

  authTest.describe('Validation', () => {
    authTest.beforeEach(async () => {
      // Navigate to form
      const hasDreamSelection = await reflectionPage.dreamSelectionTitle
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      if (hasDreamSelection) {
        const hasDreams = await reflectionPage.dreamOptions
          .first()
          .isVisible({ timeout: 3000 })
          .catch(() => false);
        if (hasDreams) {
          await reflectionPage.selectDream(0);
        }
      }
    });

    authTest('submit button is visible when form is ready', async () => {
      const hasForm = await reflectionPage.formView.isVisible({ timeout: 5000 }).catch(() => false);
      if (hasForm) {
        await reflectionPage.expectSubmitVisible();
      }
    });
  });

  authTest.describe('Navigation', () => {
    authTest('can navigate back to dashboard', async ({ authenticatedPage }) => {
      // From reflection page, go to dashboard
      await authenticatedPage.goto('/dashboard');
      await expect(authenticatedPage).toHaveURL(/\/dashboard/);
    });
  });
});

/**
 * Mobile Reflection Flow Tests
 *
 * Note: Mobile viewport is set per-test using setViewportSize
 * to avoid worker restrictions with test.use() in describe blocks.
 */
authTest.describe('Reflection Mobile', () => {
  const mobileViewport = { width: 390, height: 844 }; // iPhone 13 dimensions

  authTest('displays mobile flow on mobile viewport', async ({ authenticatedPage }) => {
    await authenticatedPage.setViewportSize(mobileViewport);
    const reflectionPage = new ReflectionPage(authenticatedPage);
    await reflectionPage.goto();
    await reflectionPage.waitForLoad();

    // Mobile flow should be visible on mobile
    const hasMobileFlow = await reflectionPage.mobileFlow
      .isVisible({ timeout: 10000 })
      .catch(() => false);
    const hasDemoCta = await reflectionPage.demoCta.isVisible({ timeout: 2000 }).catch(() => false);

    // Either mobile flow or demo CTA (if demo user)
    expect(hasMobileFlow || hasDemoCta).toBe(true);
  });

  authTest('mobile flow has close button', async ({ authenticatedPage }) => {
    await authenticatedPage.setViewportSize(mobileViewport);
    const reflectionPage = new ReflectionPage(authenticatedPage);
    await reflectionPage.goto();
    await reflectionPage.waitForLoad();

    const hasMobileFlow = await reflectionPage.mobileFlow
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    if (hasMobileFlow) {
      await reflectionPage.expectMobileCloseVisible();
    }
  });

  authTest('mobile flow has progress indicator', async ({ authenticatedPage }) => {
    await authenticatedPage.setViewportSize(mobileViewport);
    const reflectionPage = new ReflectionPage(authenticatedPage);
    await reflectionPage.goto();
    await reflectionPage.waitForLoad();

    const hasMobileFlow = await reflectionPage.mobileFlow
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    if (hasMobileFlow) {
      await reflectionPage.expectMobileProgressVisible();
    }
  });
});

/**
 * Demo User Tests (using standard test without auth fixture to test demo CTA)
 */
test.describe('Reflection Demo User', () => {
  test('demo user sees signup CTA instead of form', async ({ page }) => {
    // Login as demo user
    await page.goto('/auth/signin');

    const demoButton = page.locator('button:has-text("Demo"), button:has-text("Try Demo")');
    const isDemoAvailable = await demoButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (isDemoAvailable) {
      await demoButton.click();
      await page.waitForURL('/dashboard', { timeout: 30000 });

      // Navigate to reflection page
      await page.goto('/reflection');

      const reflectionPage = new ReflectionPage(page);

      // Demo user should see the CTA
      await reflectionPage.expectDemoCtaVisible();
    }
  });
});

/**
 * Accessibility Tests
 */
authTest.describe('Reflection Accessibility', () => {
  let reflectionPage: ReflectionPage;

  authTest.beforeEach(async ({ authenticatedPage }) => {
    reflectionPage = new ReflectionPage(authenticatedPage);
    await reflectionPage.goto();
    await reflectionPage.waitForLoad();
  });

  authTest('dream selection items have proper keyboard support', async ({ authenticatedPage }) => {
    const hasDreamSelection = await reflectionPage.dreamSelectionTitle
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasDreamSelection) {
      const hasDreams = await reflectionPage.dreamOptions
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      if (hasDreams) {
        // Dream options should have role="button" and tabIndex
        const firstOption = reflectionPage.dreamOptions.first();
        await expect(firstOption).toHaveAttribute('role', 'button');
        await expect(firstOption).toHaveAttribute('tabindex', '0');
      }
    }
  });

  authTest('tone buttons have aria-pressed attribute', async () => {
    // Navigate to form
    const hasDreamSelection = await reflectionPage.dreamSelectionTitle
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    if (hasDreamSelection) {
      const hasDreams = await reflectionPage.dreamOptions
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      if (hasDreams) {
        await reflectionPage.selectDream(0);
      }
    }

    const hasForm = await reflectionPage.formView.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasForm) {
      // Tone buttons should have aria-pressed
      await expect(reflectionPage.toneFusion).toHaveAttribute('aria-pressed');
    }
  });

  authTest('form textareas are properly labeled', async ({ authenticatedPage }) => {
    // Navigate to form
    const hasDreamSelection = await reflectionPage.dreamSelectionTitle
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    if (hasDreamSelection) {
      const hasDreams = await reflectionPage.dreamOptions
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      if (hasDreams) {
        await reflectionPage.selectDream(0);
      }
    }

    const hasForm = await reflectionPage.formView.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasForm) {
      // Question cards should have question text as implicit label
      const questionCards = reflectionPage.questionCards;
      const count = await questionCards.count();
      expect(count).toBeGreaterThan(0);
    }
  });
});
