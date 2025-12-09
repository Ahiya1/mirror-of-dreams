// server/lib/__tests__/cost-calculator.test.ts
// Tests for Claude API cost calculation functions

import { describe, expect, test } from 'vitest';

import {
  calculateCost,
  formatCost,
  getModelIdentifier,
  getThinkingBudget,
} from '../cost-calculator';

import type { CostBreakdown, TokenUsage } from '../cost-calculator';

describe('calculateCost', () => {
  describe('when given valid token usage', () => {
    test('should calculate cost correctly for basic usage', () => {
      // Arrange
      const usage: TokenUsage = {
        inputTokens: 1000,
        outputTokens: 1000,
      };

      // Act
      const result = calculateCost(usage);

      // Assert
      // Input: 1000 tokens * $0.003/1K = $0.003
      // Output: 1000 tokens * $0.015/1K = $0.015
      // Total: $0.018
      expect(result.inputCost).toBe(0.003);
      expect(result.outputCost).toBe(0.015);
      expect(result.thinkingCost).toBe(0);
      expect(result.totalCost).toBe(0.018);
    });

    test('should calculate cost with thinking tokens', () => {
      // Arrange
      const usage: TokenUsage = {
        inputTokens: 1000,
        outputTokens: 500,
        thinkingTokens: 2000,
      };

      // Act
      const result = calculateCost(usage);

      // Assert
      // Input: 1000 * 0.003/1000 = 0.003
      // Output: 500 * 0.015/1000 = 0.0075
      // Thinking: 2000 * 0.003/1000 = 0.006
      // Total: 0.0165
      expect(result.inputCost).toBe(0.003);
      expect(result.outputCost).toBe(0.0075);
      expect(result.thinkingCost).toBe(0.006);
      expect(result.totalCost).toBe(0.0165);
    });

    test('should return all zeros for zero tokens', () => {
      // Arrange
      const usage: TokenUsage = {
        inputTokens: 0,
        outputTokens: 0,
        thinkingTokens: 0,
      };

      // Act
      const result = calculateCost(usage);

      // Assert
      expect(result.inputCost).toBe(0);
      expect(result.outputCost).toBe(0);
      expect(result.thinkingCost).toBe(0);
      expect(result.totalCost).toBe(0);
    });

    test('should handle zero tokens without thinking tokens', () => {
      // Arrange
      const usage: TokenUsage = {
        inputTokens: 0,
        outputTokens: 0,
      };

      // Act
      const result = calculateCost(usage);

      // Assert
      expect(result).toEqual({
        inputCost: 0,
        outputCost: 0,
        thinkingCost: 0,
        totalCost: 0,
      });
    });
  });

  describe('when handling large token counts', () => {
    test('should calculate cost for large input token count', () => {
      // Arrange
      const usage: TokenUsage = {
        inputTokens: 100000, // 100K tokens
        outputTokens: 0,
      };

      // Act
      const result = calculateCost(usage);

      // Assert
      // 100000 * 0.003/1000 = 0.3
      expect(result.inputCost).toBe(0.3);
      expect(result.totalCost).toBe(0.3);
    });

    test('should calculate cost for large output token count', () => {
      // Arrange
      const usage: TokenUsage = {
        inputTokens: 0,
        outputTokens: 50000, // 50K tokens
      };

      // Act
      const result = calculateCost(usage);

      // Assert
      // 50000 * 0.015/1000 = 0.75
      expect(result.outputCost).toBe(0.75);
      expect(result.totalCost).toBe(0.75);
    });

    test('should handle realistic conversation costs', () => {
      // Arrange - Typical reflection request
      const usage: TokenUsage = {
        inputTokens: 2500, // User input + context
        outputTokens: 1500, // Claude response
        thinkingTokens: 3000, // Extended thinking
      };

      // Act
      const result = calculateCost(usage);

      // Assert
      // Input: 2500 * 0.003/1000 = 0.0075
      // Output: 1500 * 0.015/1000 = 0.0225
      // Thinking: 3000 * 0.003/1000 = 0.009
      // Total: 0.039
      expect(result.inputCost).toBe(0.0075);
      expect(result.outputCost).toBe(0.0225);
      expect(result.thinkingCost).toBe(0.009);
      expect(result.totalCost).toBe(0.039);
    });
  });

  describe('precision handling', () => {
    test('should round to 6 decimal places', () => {
      // Arrange - Use values that would create floating point issues
      const usage: TokenUsage = {
        inputTokens: 333,
        outputTokens: 777,
        thinkingTokens: 111,
      };

      // Act
      const result = calculateCost(usage);

      // Assert - Check that results are numbers with reasonable precision
      expect(typeof result.inputCost).toBe('number');
      expect(typeof result.outputCost).toBe('number');
      expect(typeof result.thinkingCost).toBe('number');
      expect(typeof result.totalCost).toBe('number');

      // Verify the math
      // Input: 333 * 0.003/1000 = 0.000999
      // Output: 777 * 0.015/1000 = 0.011655
      // Thinking: 111 * 0.003/1000 = 0.000333
      expect(result.inputCost).toBe(0.000999);
      expect(result.outputCost).toBe(0.011655);
      expect(result.thinkingCost).toBe(0.000333);
    });

    test('should return number type for all cost fields', () => {
      // Arrange
      const usage: TokenUsage = {
        inputTokens: 1,
        outputTokens: 1,
        thinkingTokens: 1,
      };

      // Act
      const result = calculateCost(usage);

      // Assert
      expect(typeof result.inputCost).toBe('number');
      expect(typeof result.outputCost).toBe('number');
      expect(typeof result.thinkingCost).toBe('number');
      expect(typeof result.totalCost).toBe('number');
    });
  });

  describe('edge cases', () => {
    test('should handle undefined thinking tokens as 0', () => {
      // Arrange
      const usage: TokenUsage = {
        inputTokens: 1000,
        outputTokens: 1000,
        // thinkingTokens intentionally omitted
      };

      // Act
      const result = calculateCost(usage);

      // Assert
      expect(result.thinkingCost).toBe(0);
    });

    test('should handle very small token counts', () => {
      // Arrange
      const usage: TokenUsage = {
        inputTokens: 1,
        outputTokens: 1,
        thinkingTokens: 1,
      };

      // Act
      const result = calculateCost(usage);

      // Assert
      // Input: 1 * 0.003/1000 = 0.000003
      // Output: 1 * 0.015/1000 = 0.000015
      // Thinking: 1 * 0.003/1000 = 0.000003
      expect(result.inputCost).toBe(0.000003);
      expect(result.outputCost).toBe(0.000015);
      expect(result.thinkingCost).toBe(0.000003);
      expect(result.totalCost).toBe(0.000021);
    });

    test('should calculate total as sum of all costs', () => {
      // Arrange
      const usage: TokenUsage = {
        inputTokens: 5000,
        outputTokens: 3000,
        thinkingTokens: 1000,
      };

      // Act
      const result = calculateCost(usage);

      // Assert
      const expectedTotal = result.inputCost + result.outputCost + result.thinkingCost;
      expect(result.totalCost).toBeCloseTo(expectedTotal, 6);
    });
  });

  describe('return type structure', () => {
    test('should return CostBreakdown with all required fields', () => {
      // Arrange
      const usage: TokenUsage = {
        inputTokens: 100,
        outputTokens: 100,
      };

      // Act
      const result: CostBreakdown = calculateCost(usage);

      // Assert
      expect(result).toHaveProperty('inputCost');
      expect(result).toHaveProperty('outputCost');
      expect(result).toHaveProperty('thinkingCost');
      expect(result).toHaveProperty('totalCost');
    });
  });
});

describe('getThinkingBudget', () => {
  describe('when tier is free', () => {
    test('should return 0 (no extended thinking for free tier)', () => {
      const result = getThinkingBudget('free');

      expect(result).toBe(0);
    });
  });

  describe('when tier is pro', () => {
    test('should return 0 (no extended thinking for pro tier)', () => {
      const result = getThinkingBudget('pro');

      expect(result).toBe(0);
    });
  });

  describe('when tier is unlimited', () => {
    test('should return 5000 (5K token budget for unlimited tier)', () => {
      const result = getThinkingBudget('unlimited');

      expect(result).toBe(5000);
    });
  });

  describe('all tiers comparison', () => {
    test('should have correct budgets across all tiers', () => {
      expect(getThinkingBudget('free')).toBe(0);
      expect(getThinkingBudget('pro')).toBe(0);
      expect(getThinkingBudget('unlimited')).toBe(5000);
    });

    test('should only return extended thinking budget for unlimited tier', () => {
      const tiers = ['free', 'pro', 'unlimited'] as const;

      const budgets = tiers.map((tier) => ({
        tier,
        budget: getThinkingBudget(tier),
        hasThinking: getThinkingBudget(tier) > 0,
      }));

      // Only unlimited should have thinking
      expect(budgets.filter((b) => b.hasThinking).length).toBe(1);
      expect(budgets.find((b) => b.hasThinking)?.tier).toBe('unlimited');
    });
  });
});

describe('getModelIdentifier', () => {
  test('should return Claude Sonnet 4.5 model identifier', () => {
    const result = getModelIdentifier();

    expect(result).toBe('claude-sonnet-4-5-20250929');
  });

  test('should return a non-empty string', () => {
    const result = getModelIdentifier();

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('should contain claude in the identifier', () => {
    const result = getModelIdentifier();

    expect(result.toLowerCase()).toContain('claude');
  });
});

describe('formatCost', () => {
  describe('when formatting different cost amounts', () => {
    test('should format zero cost', () => {
      const result = formatCost(0);

      expect(result).toBe('$0.000000');
    });

    test('should format small cost with 6 decimal places', () => {
      const result = formatCost(0.000003);

      expect(result).toBe('$0.000003');
    });

    test('should format typical cost', () => {
      const result = formatCost(0.018);

      expect(result).toBe('$0.018000');
    });

    test('should format larger cost', () => {
      const result = formatCost(1.5);

      expect(result).toBe('$1.500000');
    });
  });

  describe('formatting consistency', () => {
    test('should always start with dollar sign', () => {
      expect(formatCost(0)).toMatch(/^\$/);
      expect(formatCost(0.01)).toMatch(/^\$/);
      expect(formatCost(100)).toMatch(/^\$/);
    });

    test('should always have 6 decimal places', () => {
      const values = [0, 0.1, 0.001, 1, 10, 100];

      values.forEach((value) => {
        const result = formatCost(value);
        // Remove $ and check decimal places
        const numPart = result.slice(1);
        const decimalPart = numPart.split('.')[1];
        expect(decimalPart?.length).toBe(6);
      });
    });
  });

  describe('edge cases', () => {
    test('should handle very small numbers', () => {
      const result = formatCost(0.000001);

      expect(result).toBe('$0.000001');
    });

    test('should handle integer values', () => {
      const result = formatCost(5);

      expect(result).toBe('$5.000000');
    });

    test('should integrate with calculateCost output', () => {
      // Arrange
      const usage: TokenUsage = {
        inputTokens: 1000,
        outputTokens: 1000,
      };

      // Act
      const cost = calculateCost(usage);
      const formatted = formatCost(cost.totalCost);

      // Assert
      expect(formatted).toBe('$0.018000');
    });
  });
});
