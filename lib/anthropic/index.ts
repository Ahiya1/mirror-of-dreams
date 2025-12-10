/**
 * Anthropic Type Utilities
 *
 * Barrel export for all Anthropic-related types and utilities.
 *
 * @example
 * import {
 *   ExtendedMessageCreateParams,
 *   ExtendedUsage,
 *   isTextBlock,
 *   isThinkingBlock,
 *   extractText,
 * } from '@/lib/anthropic';
 */

// Types
export type {
  ContentBlock,
  TextBlock,
  ThinkingBlock,
  ToolUseBlock,
  ToolResultBlockParam,
  Message,
  MessageCreateParams,
  Usage,
  ExtendedUsage,
  ExtendedMessage,
  ThinkingConfig,
  ExtendedMessageCreateParams,
} from './types';

// Type Guards and Helpers
export {
  isTextBlock,
  isThinkingBlock,
  isToolUseBlock,
  isToolResultBlock,
  extractText,
  extractThinking,
} from './type-guards';
