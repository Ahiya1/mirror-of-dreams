// e2e/pages/clarify-session.page.ts - Clarify Chat Session Page Object
// Builder: Builder-1 (Plan-24 Iteration 58)
// Purpose: Encapsulates interactions with an individual clarify chat session

import { Page, Locator, expect } from '@playwright/test';

/**
 * Clarify Session Page Object
 *
 * Encapsulates all interactions with a clarify chat session page.
 *
 * Page structure:
 * - Session header: back button, title, timestamp
 * - Messages area: user messages (purple bg) and assistant messages (white bg)
 * - Typing indicator / streaming indicator
 * - Input area: textarea and send button
 */
export class ClarifySessionPage {
  readonly page: Page;

  // Header
  readonly backButton: Locator;
  readonly sessionTitle: Locator;
  readonly sessionTimestamp: Locator;

  // Messages
  readonly messageContainer: Locator;
  readonly userMessages: Locator;
  readonly assistantMessages: Locator;
  readonly typingIndicator: Locator;
  readonly streamingIndicator: Locator;

  // Input
  readonly messageInput: Locator;
  readonly sendButton: Locator;

  // Loading/States
  readonly loader: Locator;
  readonly errorMessage: Locator;
  readonly notFoundMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header - find back button and title
    this.backButton = page.locator('button[aria-label="Back to sessions"]');
    this.sessionTitle = page.locator('h1').first();
    this.sessionTimestamp = page.locator('text=/ago$/i').first();

    // Messages - differentiate by background styling
    this.messageContainer = page.locator('[class*="space-y-6"]').first();
    // User messages have purple/purple styling
    this.userMessages = page.locator('[class*="purple-600"], [class*="purple-500"]').filter({
      has: page.locator('p'),
    });
    // Assistant messages have white/10 styling
    this.assistantMessages = page.locator('[class*="bg-white/5"]').filter({
      has: page.locator('p, [class*="prose"]'),
    });
    this.typingIndicator = page.locator('text=/Thinking|Mirror is reflecting/i');
    this.streamingIndicator = page.locator('text=/Streaming/i');

    // Input - find textarea and send button
    this.messageInput = page.locator('textarea[placeholder*="What"]');
    this.sendButton = page
      .locator('button')
      .filter({ has: page.locator('[class*="Send"], svg') })
      .last();

    // States
    this.loader = page.locator('[class*="loader"], [class*="CosmicLoader"]');
    this.errorMessage = page.locator('[class*="error"]');
    this.notFoundMessage = page.locator('text=/session not found/i');
  }

  async goto(sessionId: string): Promise<void> {
    await this.page.goto(`/clarify/${sessionId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async waitForLoad(): Promise<void> {
    await this.messageInput.waitFor({ state: 'visible', timeout: 15000 });
  }

  async sendMessage(text: string): Promise<void> {
    await this.messageInput.fill(text);
    await this.sendButton.click();
  }

  async typeMessage(text: string): Promise<void> {
    await this.messageInput.fill(text);
  }

  async goBack(): Promise<void> {
    await this.backButton.click();
  }

  async waitForTypingIndicator(): Promise<void> {
    await this.typingIndicator.waitFor({ state: 'visible', timeout: 10000 });
  }

  async waitForTypingComplete(): Promise<void> {
    await this.typingIndicator.waitFor({ state: 'hidden', timeout: 60000 });
  }

  async getUserMessageCount(): Promise<number> {
    return this.userMessages.count();
  }

  async getAssistantMessageCount(): Promise<number> {
    return this.assistantMessages.count();
  }

  async getLastUserMessage(): Promise<string> {
    const messages = this.userMessages;
    const count = await messages.count();
    if (count === 0) return '';
    return (
      (await messages
        .nth(count - 1)
        .locator('p')
        .first()
        .textContent()) || ''
    );
  }

  async getLastAssistantMessage(): Promise<string> {
    const messages = this.assistantMessages;
    const count = await messages.count();
    if (count === 0) return '';
    const lastMessage = messages.nth(count - 1);
    return (await lastMessage.locator('p, [class*="prose"]').first().textContent()) || '';
  }

  // Assertions
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/clarify\/.+/);
    await this.waitForLoad();
  }

  async expectMessageInputVisible(): Promise<void> {
    await expect(this.messageInput).toBeVisible();
    await expect(this.sendButton).toBeVisible();
  }

  async expectSendButtonDisabled(): Promise<void> {
    await expect(this.sendButton).toBeDisabled();
  }

  async expectSendButtonEnabled(): Promise<void> {
    await expect(this.sendButton).toBeEnabled();
  }

  async expectBackButtonVisible(): Promise<void> {
    await expect(this.backButton).toBeVisible();
  }

  async expectSessionTitleVisible(): Promise<void> {
    await expect(this.sessionTitle).toBeVisible();
  }

  async expectTypingIndicator(): Promise<void> {
    await expect(this.typingIndicator).toBeVisible({ timeout: 5000 });
  }

  async expectNoTypingIndicator(): Promise<void> {
    await expect(this.typingIndicator).not.toBeVisible({ timeout: 5000 });
  }

  async expectUserMessageCount(count: number): Promise<void> {
    const actual = await this.getUserMessageCount();
    expect(actual).toBe(count);
  }

  async expectAssistantMessageCount(count: number): Promise<void> {
    const actual = await this.getAssistantMessageCount();
    expect(actual).toBe(count);
  }

  async expectEmptyConversation(): Promise<void> {
    await expect(this.page.locator('text=/Start your conversation/i')).toBeVisible();
  }

  async expectNotFound(): Promise<void> {
    await expect(this.notFoundMessage).toBeVisible();
  }

  async expectInputPlaceholder(): Promise<void> {
    await expect(this.messageInput).toHaveAttribute('placeholder', /what's on your mind/i);
  }
}
