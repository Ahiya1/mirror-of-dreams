/**
 * Anthropic SDK Type Re-exports and Extensions
 *
 * Centralizes all Anthropic-related types for the application.
 * Re-exports commonly used SDK types and provides extensions
 * for features not yet exposed in the SDK (like thinking_tokens).
 */

import type Anthropic from '@anthropic-ai/sdk';
import type { MessageCreateParamsNonStreaming } from '@anthropic-ai/sdk/resources/messages';

// =====================================================
// RE-EXPORTED SDK TYPES
// =====================================================

/** Content block in a message response */
export type ContentBlock = Anthropic.ContentBlock;

/** Text content block */
export type TextBlock = Anthropic.TextBlock;

/** Thinking content block (extended thinking) */
export type ThinkingBlock = Anthropic.ThinkingBlock;

/** Tool use content block */
export type ToolUseBlock = Anthropic.ToolUseBlock;

/** Tool result content block */
export type ToolResultBlockParam = Anthropic.ToolResultBlockParam;

/** Message response from Claude */
export type Message = Anthropic.Message;

/** Parameters for creating a message */
export type MessageCreateParams = Anthropic.MessageCreateParams;

/** Usage information from API response */
export type Usage = Anthropic.Usage;

// =====================================================
// EXTENDED TYPES
// =====================================================

/**
 * Extended Usage interface that includes thinking_tokens.
 *
 * The SDK's Usage type doesn't expose thinking_tokens yet,
 * but it's returned by the API when using extended thinking.
 */
export interface ExtendedUsage extends Anthropic.Usage {
  /** Number of tokens used for extended thinking (when enabled) */
  thinking_tokens?: number;
}

/**
 * Extended Message with ExtendedUsage.
 *
 * Use this type when you need to access thinking_tokens from the response.
 */
export interface ExtendedMessage extends Omit<Anthropic.Message, 'usage'> {
  usage: ExtendedUsage;
}

/**
 * Configuration for enabling extended thinking.
 */
export interface ThinkingConfig {
  /** Must be 'enabled' to activate extended thinking */
  type: 'enabled';
  /** Token budget for thinking (typically 10000-100000) */
  budget_tokens: number;
}

/**
 * Extended MessageCreateParams that includes thinking configuration.
 *
 * Use this instead of `any` when building request configs that may
 * include extended thinking. Based on MessageCreateParamsNonStreaming
 * since we don't use streaming for these operations.
 */
export type ExtendedMessageCreateParams = MessageCreateParamsNonStreaming & {
  /** Optional thinking configuration for extended thinking */
  thinking?: ThinkingConfig;
};
