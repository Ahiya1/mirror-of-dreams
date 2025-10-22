/**
 * Cost Calculator for Claude API Usage
 *
 * Calculates costs based on Claude Sonnet 4.5 pricing:
 * - Input: $0.003 per 1K tokens
 * - Output: $0.015 per 1K tokens
 * - Thinking (extended): $0.003 per 1K tokens
 */

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  thinkingTokens?: number;
}

export interface CostBreakdown {
  inputCost: number;
  outputCost: number;
  thinkingCost: number;
  totalCost: number;
}

// Claude Sonnet 4.5 pricing (per 1K tokens)
const PRICING = {
  input: 0.003,
  output: 0.015,
  thinking: 0.003,
} as const;

/**
 * Calculate cost for Claude API usage
 *
 * @param usage - Token usage details
 * @returns Cost breakdown in USD
 */
export function calculateCost(usage: TokenUsage): CostBreakdown {
  const inputCost = (usage.inputTokens / 1000) * PRICING.input;
  const outputCost = (usage.outputTokens / 1000) * PRICING.output;
  const thinkingCost = ((usage.thinkingTokens || 0) / 1000) * PRICING.thinking;

  return {
    inputCost: Number(inputCost.toFixed(6)),
    outputCost: Number(outputCost.toFixed(6)),
    thinkingCost: Number(thinkingCost.toFixed(6)),
    totalCost: Number((inputCost + outputCost + thinkingCost).toFixed(6)),
  };
}

/**
 * Get model identifier for current Claude version
 */
export function getModelIdentifier(): string {
  return 'claude-sonnet-4-5-20250929';
}

/**
 * Get extended thinking configuration for tier
 *
 * @param tier - User tier
 * @returns Thinking budget tokens (0 if not available)
 */
export function getThinkingBudget(tier: 'free' | 'essential' | 'optimal' | 'premium'): number {
  // Extended thinking available for Optimal and Premium tiers
  if (tier === 'optimal' || tier === 'premium') {
    return 5000; // 5K token budget for extended thinking
  }
  return 0;
}

/**
 * Format cost for display
 *
 * @param cost - Cost in USD
 * @returns Formatted string (e.g., "$0.012")
 */
export function formatCost(cost: number): string {
  return `$${cost.toFixed(6)}`;
}
