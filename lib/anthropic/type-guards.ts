/**
 * Type Guards for Anthropic SDK Content Blocks
 *
 * Provides type-safe narrowing functions for processing
 * Claude API response content blocks.
 */

import type Anthropic from '@anthropic-ai/sdk';

// =====================================================
// CONTENT BLOCK TYPE GUARDS
// =====================================================

/**
 * Type guard to check if a content block is a TextBlock.
 *
 * @param block - Content block from message response
 * @returns True if block is a TextBlock
 *
 * @example
 * const textBlock = response.content.find(isTextBlock);
 * if (textBlock) {
 *   console.log(textBlock.text); // TypeScript knows this is string
 * }
 */
export function isTextBlock(block: Anthropic.ContentBlock): block is Anthropic.TextBlock {
  return block.type === 'text';
}

/**
 * Type guard to check if a content block is a ThinkingBlock.
 *
 * @param block - Content block from message response
 * @returns True if block is a ThinkingBlock
 *
 * @example
 * const thinkingBlock = response.content.find(isThinkingBlock);
 * if (thinkingBlock) {
 *   console.log(thinkingBlock.thinking); // TypeScript knows this is string
 * }
 */
export function isThinkingBlock(block: Anthropic.ContentBlock): block is Anthropic.ThinkingBlock {
  return block.type === 'thinking';
}

/**
 * Type guard to check if a content block is a ToolUseBlock.
 *
 * @param block - Content block from message response
 * @returns True if block is a ToolUseBlock
 *
 * @example
 * const toolUseBlock = response.content.find(isToolUseBlock);
 * if (toolUseBlock) {
 *   console.log(toolUseBlock.name); // TypeScript knows this is string
 *   console.log(toolUseBlock.input); // TypeScript knows this is unknown
 * }
 */
export function isToolUseBlock(block: Anthropic.ContentBlock): block is Anthropic.ToolUseBlock {
  return block.type === 'tool_use';
}

/**
 * Type guard to check if a content block is a ToolResultBlockParam.
 * Note: This is primarily for input blocks, not response content.
 *
 * @param block - Content block
 * @returns True if block is a tool result
 */
export function isToolResultBlock(
  block: Anthropic.ContentBlockParam
): block is Anthropic.ToolResultBlockParam {
  return 'type' in block && block.type === 'tool_result';
}

// =====================================================
// HELPER EXTRACTION FUNCTIONS
// =====================================================

/**
 * Extract text from a Message response.
 *
 * Returns the first TextBlock's content or empty string if none found.
 *
 * @param response - Message response from Claude
 * @returns Text content or empty string
 *
 * @example
 * const response = await anthropic.messages.create({...});
 * const text = extractText(response);
 */
export function extractText(response: Anthropic.Message): string {
  const textBlock = response.content.find(isTextBlock);
  return textBlock?.text ?? '';
}

/**
 * Extract thinking from a Message response.
 *
 * Returns the first ThinkingBlock's thinking content or null if none found.
 *
 * @param response - Message response from Claude
 * @returns Thinking content or null
 *
 * @example
 * const response = await anthropic.messages.create({...});
 * const thinking = extractThinking(response);
 * if (thinking) {
 *   console.log('Claude thought:', thinking);
 * }
 */
export function extractThinking(response: Anthropic.Message): string | null {
  const thinkingBlock = response.content.find(isThinkingBlock);
  return thinkingBlock?.thinking ?? null;
}
