// server/lib/__tests__/temporal-distribution.test.ts
// Tests for temporal distribution algorithm and evolution report utilities

import { describe, expect, test } from 'vitest';

import {
  EVOLUTION_CONTEXT_LIMITS,
  getContextLimit,
  meetsEvolutionThreshold,
  selectTemporalContext,
} from '../temporal-distribution';

import type { Reflection } from '../temporal-distribution';

/**
 * Helper to create mock reflections with sequential dates
 */
function createMockReflections(
  count: number,
  startDate: Date = new Date('2024-01-01')
): Reflection[] {
  const reflections: Reflection[] = [];

  for (let i = 0; i < count; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    reflections.push({
      id: `reflection-${i + 1}`,
      created_at: date.toISOString(),
      title: `Reflection ${i + 1}`,
      content: `Content for reflection ${i + 1}`,
    });
  }

  return reflections;
}

/**
 * Helper to create reflections with specific dates
 */
function createReflectionsWithDates(dates: string[]): Reflection[] {
  return dates.map((dateStr, i) => ({
    id: `reflection-${i + 1}`,
    created_at: new Date(dateStr).toISOString(),
    title: `Reflection ${i + 1}`,
  }));
}

describe('selectTemporalContext', () => {
  describe('when reflections count is less than or equal to limit', () => {
    test('should return all reflections when count equals limit', () => {
      const reflections = createMockReflections(6);
      const contextLimit = 6;

      const result = selectTemporalContext(reflections, contextLimit);

      expect(result.length).toBe(6);
      expect(result).toEqual(reflections);
    });

    test('should return all reflections when count is less than limit', () => {
      const reflections = createMockReflections(3);
      const contextLimit = 6;

      const result = selectTemporalContext(reflections, contextLimit);

      expect(result.length).toBe(3);
      expect(result).toEqual(reflections);
    });

    test('should return empty array when no reflections', () => {
      const reflections: Reflection[] = [];
      const contextLimit = 6;

      const result = selectTemporalContext(reflections, contextLimit);

      expect(result.length).toBe(0);
      expect(result).toEqual([]);
    });

    test('should return single reflection when only one exists', () => {
      const reflections = createMockReflections(1);
      const contextLimit = 6;

      const result = selectTemporalContext(reflections, contextLimit);

      expect(result.length).toBe(1);
    });
  });

  describe('when reflections count exceeds limit', () => {
    test('should return exactly contextLimit reflections', () => {
      const reflections = createMockReflections(30);
      const contextLimit = 12;

      const result = selectTemporalContext(reflections, contextLimit);

      expect(result.length).toBe(contextLimit);
    });

    test('should distribute reflections across early, middle, and recent periods', () => {
      const reflections = createMockReflections(30);
      const contextLimit = 9; // 3 per period

      const result = selectTemporalContext(reflections, contextLimit);

      expect(result.length).toBe(9);

      // Check that reflections span the timeline
      const sortedOriginal = [...reflections].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      // First selected reflection should be from early period
      const firstSelectedDate = new Date(result[0].created_at);
      const firstOriginalDate = new Date(sortedOriginal[0].created_at);
      expect(firstSelectedDate.getTime()).toBe(firstOriginalDate.getTime());
    });

    test('should prioritize recent period with remainder', () => {
      const reflections = createMockReflections(30);
      const contextLimit = 10; // 3 per period + 1 remainder to recent

      const result = selectTemporalContext(reflections, contextLimit);

      expect(result.length).toBe(10);
      // With 10 reflections and 3 periods: floor(10/3) = 3 per period, 1 remainder
      // Early: 3, Middle: 3, Recent: 3+1 = 4
    });
  });

  describe('period division and selection', () => {
    test('should divide 30 reflections into 3 equal periods of 10', () => {
      const reflections = createMockReflections(30);
      const contextLimit = 6; // 2 per period

      const result = selectTemporalContext(reflections, contextLimit);

      expect(result.length).toBe(6);

      // Verify IDs are from different periods
      const ids = result.map((r) => parseInt(r.id.split('-')[1]));

      // First 2 should be from early period (1-10)
      expect(ids[0]).toBeLessThanOrEqual(10);
      expect(ids[1]).toBeLessThanOrEqual(10);

      // Middle 2 should be from middle period (11-20)
      expect(ids[2]).toBeGreaterThan(10);
      expect(ids[2]).toBeLessThanOrEqual(20);

      // Last 2 should be from recent period (21-30)
      expect(ids[4]).toBeGreaterThan(20);
    });

    test('should sort input reflections by date before processing', () => {
      // Create reflections in random order
      const reflections: Reflection[] = [
        { id: 'r-3', created_at: '2024-03-01T00:00:00Z' },
        { id: 'r-1', created_at: '2024-01-01T00:00:00Z' },
        { id: 'r-2', created_at: '2024-02-01T00:00:00Z' },
        { id: 'r-6', created_at: '2024-06-01T00:00:00Z' },
        { id: 'r-4', created_at: '2024-04-01T00:00:00Z' },
        { id: 'r-5', created_at: '2024-05-01T00:00:00Z' },
      ];

      const result = selectTemporalContext(reflections, 3);

      // Should be from different periods, sorted by date
      expect(result.length).toBe(3);

      // First should be from early period (Jan or Feb)
      const firstId = result[0].id;
      expect(['r-1', 'r-2']).toContain(firstId);
    });

    test('should select evenly spaced reflections within each period', () => {
      // Create 12 reflections, select 6 (2 from each period of 4)
      const reflections = createMockReflections(12);
      const contextLimit = 6;

      const result = selectTemporalContext(reflections, contextLimit);

      expect(result.length).toBe(6);
    });
  });

  describe('edge cases', () => {
    test('should handle context limit of 1', () => {
      const reflections = createMockReflections(10);
      const contextLimit = 1;

      const result = selectTemporalContext(reflections, contextLimit);

      expect(result.length).toBe(1);
    });

    test('should handle context limit of 2', () => {
      const reflections = createMockReflections(10);
      const contextLimit = 2;

      const result = selectTemporalContext(reflections, contextLimit);

      expect(result.length).toBe(2);
    });

    test('should handle very large reflection count', () => {
      const reflections = createMockReflections(100);
      const contextLimit = 12;

      const result = selectTemporalContext(reflections, contextLimit);

      expect(result.length).toBe(12);

      // Verify temporal spread
      const dates = result.map((r) => new Date(r.created_at).getTime());
      const isChronological = dates.every((d, i) => i === 0 || d >= dates[i - 1]);
      expect(isChronological).toBe(true);
    });

    test('should maintain chronological order in output', () => {
      const reflections = createMockReflections(50);
      const contextLimit = 15;

      const result = selectTemporalContext(reflections, contextLimit);

      const dates = result.map((r) => new Date(r.created_at).getTime());

      for (let i = 1; i < dates.length; i++) {
        expect(dates[i]).toBeGreaterThanOrEqual(dates[i - 1]);
      }
    });

    test('should handle reflections with same date', () => {
      const sameDate = '2024-06-15T10:00:00Z';
      const reflections: Reflection[] = [
        { id: 'r-1', created_at: sameDate },
        { id: 'r-2', created_at: sameDate },
        { id: 'r-3', created_at: sameDate },
        { id: 'r-4', created_at: sameDate },
        { id: 'r-5', created_at: sameDate },
        { id: 'r-6', created_at: sameDate },
      ];

      const result = selectTemporalContext(reflections, 3);

      expect(result.length).toBe(3);
    });
  });

  describe('preservation of reflection data', () => {
    test('should preserve all reflection properties', () => {
      const reflections: Reflection[] = [
        {
          id: 'r-1',
          created_at: '2024-01-01T00:00:00Z',
          title: 'First',
          content: 'Content 1',
          rating: 5,
          customField: 'test',
        },
        {
          id: 'r-2',
          created_at: '2024-06-01T00:00:00Z',
          title: 'Second',
          content: 'Content 2',
          rating: 4,
        },
      ];

      const result = selectTemporalContext(reflections, 2);

      expect(result.length).toBe(2);

      const first = result.find((r) => r.id === 'r-1');
      expect(first?.title).toBe('First');
      expect(first?.content).toBe('Content 1');
      expect(first?.rating).toBe(5);
      expect(first?.customField).toBe('test');
    });
  });
});

describe('EVOLUTION_CONTEXT_LIMITS', () => {
  describe('dream_specific limits', () => {
    test('should have correct limit for free tier', () => {
      expect(EVOLUTION_CONTEXT_LIMITS.dream_specific.free).toBe(4);
    });

    test('should have correct limit for pro tier', () => {
      expect(EVOLUTION_CONTEXT_LIMITS.dream_specific.pro).toBe(6);
    });

    test('should have correct limit for unlimited tier', () => {
      expect(EVOLUTION_CONTEXT_LIMITS.dream_specific.unlimited).toBe(12);
    });
  });

  describe('cross_dream limits', () => {
    test('should have 0 for free tier (not available)', () => {
      expect(EVOLUTION_CONTEXT_LIMITS.cross_dream.free).toBe(0);
    });

    test('should have correct limit for pro tier', () => {
      expect(EVOLUTION_CONTEXT_LIMITS.cross_dream.pro).toBe(12);
    });

    test('should have correct limit for unlimited tier', () => {
      expect(EVOLUTION_CONTEXT_LIMITS.cross_dream.unlimited).toBe(30);
    });
  });

  describe('tier progression', () => {
    test('should have increasing limits for higher tiers (dream_specific)', () => {
      const freeLim = EVOLUTION_CONTEXT_LIMITS.dream_specific.free;
      const proLim = EVOLUTION_CONTEXT_LIMITS.dream_specific.pro;
      const unlimitedLim = EVOLUTION_CONTEXT_LIMITS.dream_specific.unlimited;

      expect(proLim).toBeGreaterThan(freeLim);
      expect(unlimitedLim).toBeGreaterThan(proLim);
    });

    test('should have increasing limits for higher tiers (cross_dream)', () => {
      const freeLim = EVOLUTION_CONTEXT_LIMITS.cross_dream.free;
      const proLim = EVOLUTION_CONTEXT_LIMITS.cross_dream.pro;
      const unlimitedLim = EVOLUTION_CONTEXT_LIMITS.cross_dream.unlimited;

      expect(proLim).toBeGreaterThan(freeLim);
      expect(unlimitedLim).toBeGreaterThan(proLim);
    });
  });
});

describe('getContextLimit', () => {
  describe('dream_specific report type', () => {
    test('should return 4 for free tier', () => {
      expect(getContextLimit('free', 'dream_specific')).toBe(4);
    });

    test('should return 6 for pro tier', () => {
      expect(getContextLimit('pro', 'dream_specific')).toBe(6);
    });

    test('should return 12 for unlimited tier', () => {
      expect(getContextLimit('unlimited', 'dream_specific')).toBe(12);
    });
  });

  describe('cross_dream report type', () => {
    test('should return 0 for free tier (not available)', () => {
      expect(getContextLimit('free', 'cross_dream')).toBe(0);
    });

    test('should return 12 for pro tier', () => {
      expect(getContextLimit('pro', 'cross_dream')).toBe(12);
    });

    test('should return 30 for unlimited tier', () => {
      expect(getContextLimit('unlimited', 'cross_dream')).toBe(30);
    });
  });

  describe('all combinations', () => {
    test('should return correct values for all tier and report type combinations', () => {
      const tiers = ['free', 'pro', 'unlimited'] as const;
      const reportTypes = ['dream_specific', 'cross_dream'] as const;

      tiers.forEach((tier) => {
        reportTypes.forEach((reportType) => {
          const result = getContextLimit(tier, reportType);
          const expected = EVOLUTION_CONTEXT_LIMITS[reportType][tier];
          expect(result).toBe(expected);
        });
      });
    });
  });
});

describe('meetsEvolutionThreshold', () => {
  describe('dream_specific report type', () => {
    test('should return false when reflection count is 0', () => {
      expect(meetsEvolutionThreshold(0, 'dream_specific')).toBe(false);
    });

    test('should return false when reflection count is 3', () => {
      expect(meetsEvolutionThreshold(3, 'dream_specific')).toBe(false);
    });

    test('should return true when reflection count is exactly 4 (threshold)', () => {
      expect(meetsEvolutionThreshold(4, 'dream_specific')).toBe(true);
    });

    test('should return true when reflection count is greater than 4', () => {
      expect(meetsEvolutionThreshold(5, 'dream_specific')).toBe(true);
      expect(meetsEvolutionThreshold(10, 'dream_specific')).toBe(true);
      expect(meetsEvolutionThreshold(100, 'dream_specific')).toBe(true);
    });
  });

  describe('cross_dream report type', () => {
    test('should return false when reflection count is 0', () => {
      expect(meetsEvolutionThreshold(0, 'cross_dream')).toBe(false);
    });

    test('should return false when reflection count is 11', () => {
      expect(meetsEvolutionThreshold(11, 'cross_dream')).toBe(false);
    });

    test('should return true when reflection count is exactly 12 (threshold)', () => {
      expect(meetsEvolutionThreshold(12, 'cross_dream')).toBe(true);
    });

    test('should return true when reflection count is greater than 12', () => {
      expect(meetsEvolutionThreshold(13, 'cross_dream')).toBe(true);
      expect(meetsEvolutionThreshold(50, 'cross_dream')).toBe(true);
      expect(meetsEvolutionThreshold(100, 'cross_dream')).toBe(true);
    });
  });

  describe('threshold boundary tests', () => {
    test('dream_specific threshold is 4', () => {
      expect(meetsEvolutionThreshold(3, 'dream_specific')).toBe(false);
      expect(meetsEvolutionThreshold(4, 'dream_specific')).toBe(true);
    });

    test('cross_dream threshold is 12', () => {
      expect(meetsEvolutionThreshold(11, 'cross_dream')).toBe(false);
      expect(meetsEvolutionThreshold(12, 'cross_dream')).toBe(true);
    });
  });

  describe('edge cases', () => {
    test('should handle negative counts (should return false)', () => {
      // Although negative counts are invalid, function should not throw
      expect(meetsEvolutionThreshold(-1, 'dream_specific')).toBe(false);
      expect(meetsEvolutionThreshold(-1, 'cross_dream')).toBe(false);
    });

    test('should handle very large counts', () => {
      expect(meetsEvolutionThreshold(1000000, 'dream_specific')).toBe(true);
      expect(meetsEvolutionThreshold(1000000, 'cross_dream')).toBe(true);
    });
  });
});

describe('integration tests', () => {
  describe('selectTemporalContext with tier limits', () => {
    test('should work with free tier dream_specific limit', () => {
      const reflections = createMockReflections(20);
      const limit = getContextLimit('free', 'dream_specific'); // 4

      const result = selectTemporalContext(reflections, limit);

      expect(result.length).toBe(4);
    });

    test('should work with pro tier cross_dream limit', () => {
      const reflections = createMockReflections(50);
      const limit = getContextLimit('pro', 'cross_dream'); // 12

      const result = selectTemporalContext(reflections, limit);

      expect(result.length).toBe(12);
    });

    test('should work with unlimited tier cross_dream limit', () => {
      const reflections = createMockReflections(100);
      const limit = getContextLimit('unlimited', 'cross_dream'); // 30

      const result = selectTemporalContext(reflections, limit);

      expect(result.length).toBe(30);
    });
  });

  describe('threshold check before selection', () => {
    test('should only select if threshold is met', () => {
      const reflections = createMockReflections(3);
      const reportType = 'dream_specific';

      // Check threshold first
      if (meetsEvolutionThreshold(reflections.length, reportType)) {
        const limit = getContextLimit('free', reportType);
        const result = selectTemporalContext(reflections, limit);
        expect(result.length).toBeLessThanOrEqual(limit);
      } else {
        // Threshold not met - 3 < 4
        expect(meetsEvolutionThreshold(reflections.length, reportType)).toBe(false);
      }
    });
  });
});
