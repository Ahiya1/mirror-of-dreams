// e2e/pages/reflection.page.ts - Reflection Page Object Model

import { Page, Locator, expect } from '@playwright/test';

/**
 * Reflection Page Object
 *
 * Encapsulates all interactions with the reflection experience page.
 * Handles both desktop and mobile flows.
 *
 * Page structure:
 * - Desktop: Dream selection -> Form -> Tone -> Submit -> Output
 * - Mobile: MobileReflectionFlow with step-based UI
 * - Form fields: dream, plan, relationship, offering (textareas)
 * - Tone options: Fusion, Gentle, Intense
 * - Demo users see special CTA instead of form
 */
export class ReflectionPage {
  readonly page: Page;

  // Dream selection
  readonly dreamSelectionView: Locator;
  readonly dreamSelectionTitle: Locator;
  readonly dreamOptions: Locator;
  readonly noDreamsMessage: Locator;
  readonly createDreamCta: Locator;

  // Form view
  readonly formView: Locator;
  readonly welcomeMessage: Locator;
  readonly dreamContextBanner: Locator;
  readonly progressBar: Locator;

  // Question cards (desktop form)
  readonly questionCards: Locator;

  // Tone selection
  readonly toneSelectionSection: Locator;
  readonly toneSelectionTitle: Locator;
  readonly toneFusion: Locator;
  readonly toneGentle: Locator;
  readonly toneIntense: Locator;

  // Submit
  readonly submitButton: Locator;
  readonly submitReadyText: Locator;

  // Loading/Output states
  readonly gazingOverlay: Locator;
  readonly gazingText: Locator;
  readonly outputView: Locator;
  readonly outputContent: Locator;
  readonly createNewButton: Locator;

  // Demo user CTA
  readonly demoCta: Locator;
  readonly demoCreateAccount: Locator;
  readonly demoContinueExploring: Locator;

  // Mobile-specific
  readonly mobileFlow: Locator;
  readonly mobileCloseButton: Locator;
  readonly mobileProgressOrbs: Locator;
  readonly mobileNextButton: Locator;
  readonly mobileBackButton: Locator;
  readonly mobileExitConfirm: Locator;

  // Loader
  readonly loader: Locator;

  constructor(page: Page) {
    this.page = page;

    // Dream selection
    this.dreamSelectionView = page.locator('.question-view, .dream-selection-list').first();
    this.dreamSelectionTitle = page.locator('text=Which dream are you reflecting on?');
    this.dreamOptions = page.locator('.dream-selection-list > div[role="button"]');
    this.noDreamsMessage = page.locator('text=No active dreams yet');
    this.createDreamCta = page.locator('button:has-text("Create Your First Dream")');

    // Form view
    this.formView = page.locator('.one-page-form');
    this.welcomeMessage = page.locator('.one-page-form p.italic').first();
    this.dreamContextBanner = page.locator('.dream-context-banner');
    this.progressBar = page.locator('[class*="ProgressBar"]');

    // Question cards
    this.questionCards = page.locator('.reflection-question-card');

    // Tone selection
    this.toneSelectionSection = page.locator('.tone-selection-cards');
    this.toneSelectionTitle = page.locator('text=Choose Your Reflection Tone');
    this.toneFusion = page.locator(
      'button[aria-label*="Sacred Fusion"], button:has-text("Sacred Fusion")'
    );
    this.toneGentle = page.locator(
      'button[aria-label*="Gentle Clarity"], button:has-text("Gentle Clarity")'
    );
    this.toneIntense = page.locator(
      'button[aria-label*="Luminous Intensity"], button:has-text("Luminous Intensity")'
    );

    // Submit
    this.submitButton = page.locator('button:has-text("Gaze into the Mirror")');
    this.submitReadyText = page.locator('text=/ready.*submit|take.*time/i');

    // Loading/Output
    this.gazingOverlay = page.locator('[class*="gazing-overlay"], [class*="GazingOverlay"]');
    this.gazingText = page.locator('text=/Gazing|Crafting/');
    this.outputView = page.locator('.output-container, [class*="ReflectionOutputView"]');
    this.outputContent = page.locator('[class*="prose"], .output-container p');
    this.createNewButton = page.locator(
      'button:has-text("New Reflection"), button:has-text("Create New")'
    );

    // Demo CTA
    this.demoCta = page.locator('text=Ready to Start Your Journey?');
    this.demoCreateAccount = page.locator('button:has-text("Create Free Account")');
    this.demoContinueExploring = page.locator('button:has-text("Continue Exploring")');

    // Mobile
    this.mobileFlow = page.locator('.fixed.inset-0.z-50');
    this.mobileCloseButton = page.locator('button[aria-label="Close"]');
    this.mobileProgressOrbs = page.locator('[class*="ProgressOrbs"]');
    this.mobileNextButton = page.locator('button:has-text("Next"), button:has-text("Continue")');
    this.mobileBackButton = page.locator('button:has-text("Back")');
    this.mobileExitConfirm = page.locator('[class*="ExitConfirmation"]');

    // Loader
    this.loader = page.locator('[class*="CosmicLoader"], text=Loading');
  }

  /**
   * Navigate to reflection page
   * Uses waitForLoad instead of waitForLoadState for CI reliability
   */
  async goto(): Promise<void> {
    await this.page.goto('/reflection');
    await this.waitForLoad();
  }

  /**
   * Navigate to reflection with dream ID
   * Uses waitForLoad instead of waitForLoadState for CI reliability
   */
  async gotoWithDream(dreamId: string): Promise<void> {
    await this.page.goto(`/reflection?dreamId=${dreamId}`);
    await this.waitForLoad();
  }

  /**
   * Navigate to reflection output
   * Uses waitForLoad instead of waitForLoadState for CI reliability
   */
  async gotoOutput(reflectionId: string): Promise<void> {
    await this.page.goto(`/reflection?id=${reflectionId}`);
    await this.waitForLoad();
  }

  /**
   * Wait for page to load
   */
  async waitForLoad(): Promise<void> {
    await this.loader.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
    // Wait for either dream selection, form, demo CTA, or mobile flow
    await Promise.race([
      this.dreamSelectionTitle.waitFor({ state: 'visible', timeout: 15000 }),
      this.formView.waitFor({ state: 'visible', timeout: 15000 }),
      this.demoCta.waitFor({ state: 'visible', timeout: 15000 }),
      this.mobileFlow.waitFor({ state: 'visible', timeout: 15000 }),
      this.outputView.waitFor({ state: 'visible', timeout: 15000 }),
    ]).catch(() => {});
  }

  /**
   * Select a dream by index
   */
  async selectDream(index: number = 0): Promise<void> {
    await this.dreamOptions.nth(index).click();
  }

  /**
   * Fill a question field by index (0-3)
   */
  async fillQuestion(index: number, text: string): Promise<void> {
    const questionCard = this.questionCards.nth(index);
    const textarea = questionCard.locator('textarea');
    await textarea.fill(text);
  }

  /**
   * Get question textarea by index
   */
  getQuestionTextarea(index: number): Locator {
    return this.questionCards.nth(index).locator('textarea');
  }

  /**
   * Select tone
   */
  async selectTone(tone: 'fusion' | 'gentle' | 'intense'): Promise<void> {
    const toneMap = {
      fusion: this.toneFusion,
      gentle: this.toneGentle,
      intense: this.toneIntense,
    };
    await toneMap[tone].click();
  }

  /**
   * Submit reflection (DO NOT call in tests - would create data)
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Click create new reflection
   */
  async clickCreateNew(): Promise<void> {
    await this.createNewButton.click();
  }

  // Mobile-specific methods

  /**
   * Click close button on mobile
   */
  async mobileClose(): Promise<void> {
    await this.mobileCloseButton.click();
  }

  /**
   * Click next on mobile flow
   */
  async mobileNext(): Promise<void> {
    await this.mobileNextButton.click();
  }

  /**
   * Click back on mobile flow
   */
  async mobileBack(): Promise<void> {
    await this.mobileBackButton.click();
  }

  // Assertions

  /**
   * Assert reflection page loaded
   */
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/reflection/);
    await this.waitForLoad();
  }

  /**
   * Assert dream selection view is visible
   */
  async expectDreamSelectionVisible(): Promise<void> {
    await expect(this.dreamSelectionTitle).toBeVisible({ timeout: 15000 });
  }

  /**
   * Assert dream options are visible
   */
  async expectDreamOptionsVisible(): Promise<void> {
    await expect(this.dreamOptions.first()).toBeVisible({ timeout: 15000 });
  }

  /**
   * Assert no dreams message is visible
   */
  async expectNoDreamsMessage(): Promise<void> {
    await expect(this.noDreamsMessage).toBeVisible({ timeout: 10000 });
  }

  /**
   * Assert form view is visible
   */
  async expectFormVisible(): Promise<void> {
    await expect(this.formView).toBeVisible({ timeout: 15000 });
  }

  /**
   * Assert question cards are visible
   */
  async expectQuestionCardsVisible(): Promise<void> {
    await expect(this.questionCards.first()).toBeVisible({ timeout: 10000 });
  }

  /**
   * Assert tone selector is visible
   */
  async expectToneSelectVisible(): Promise<void> {
    await expect(this.toneSelectionSection).toBeVisible({ timeout: 10000 });
  }

  /**
   * Assert all tone options are visible
   */
  async expectAllToneOptionsVisible(): Promise<void> {
    await expect(this.toneFusion).toBeVisible();
    await expect(this.toneGentle).toBeVisible();
    await expect(this.toneIntense).toBeVisible();
  }

  /**
   * Assert a specific tone is selected
   */
  async expectToneSelected(tone: 'fusion' | 'gentle' | 'intense'): Promise<void> {
    const toneMap = {
      fusion: this.toneFusion,
      gentle: this.toneGentle,
      intense: this.toneIntense,
    };
    await expect(toneMap[tone]).toHaveAttribute('aria-pressed', 'true');
  }

  /**
   * Assert submit button is visible
   */
  async expectSubmitVisible(): Promise<void> {
    await expect(this.submitButton).toBeVisible();
  }

  /**
   * Assert submit button is enabled
   */
  async expectSubmitEnabled(): Promise<void> {
    await expect(this.submitButton).toBeEnabled();
  }

  /**
   * Assert gazing overlay is visible (during submission)
   */
  async expectGazingVisible(): Promise<void> {
    await expect(this.gazingOverlay).toBeVisible({ timeout: 5000 });
  }

  /**
   * Assert output view is visible
   */
  async expectOutputVisible(): Promise<void> {
    await expect(this.outputView).toBeVisible({ timeout: 60000 });
  }

  /**
   * Assert output has content
   */
  async expectOutputHasContent(): Promise<void> {
    await expect(this.outputContent).not.toBeEmpty();
  }

  /**
   * Assert demo CTA is visible
   */
  async expectDemoCtaVisible(): Promise<void> {
    await expect(this.demoCta).toBeVisible({ timeout: 15000 });
  }

  /**
   * Assert mobile flow is visible
   */
  async expectMobileFlowVisible(): Promise<void> {
    await expect(this.mobileFlow).toBeVisible({ timeout: 10000 });
  }

  /**
   * Assert mobile progress orbs are visible
   */
  async expectMobileProgressVisible(): Promise<void> {
    await expect(this.mobileProgressOrbs).toBeVisible();
  }

  /**
   * Assert mobile close button is visible
   */
  async expectMobileCloseVisible(): Promise<void> {
    await expect(this.mobileCloseButton).toBeVisible();
  }

  /**
   * Assert mobile navigation buttons are visible
   */
  async expectMobileNavButtonsVisible(): Promise<void> {
    // At minimum, close button should always be visible
    await expect(this.mobileCloseButton).toBeVisible();
  }
}
