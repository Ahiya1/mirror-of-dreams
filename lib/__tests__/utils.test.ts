// lib/__tests__/utils.test.ts
// Tests for core utility functions: cn, formatDate, timeAgo, truncate, formatReflectionDate

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cn, formatDate, formatReflectionDate, timeAgo, truncate } from '../utils';

// =====================================================
// cn TESTS (Class Name Merging)
// =====================================================

describe('cn', () => {
  // -------------------------------------------------
  // Basic Merging
  // -------------------------------------------------

  describe('basic merging', () => {
    it('merges multiple class strings', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('handles single class', () => {
      expect(cn('foo')).toBe('foo');
    });

    it('handles empty input', () => {
      expect(cn()).toBe('');
    });

    it('handles empty strings', () => {
      expect(cn('foo', '', 'bar')).toBe('foo bar');
    });

    it('handles undefined values', () => {
      expect(cn('foo', undefined, 'bar')).toBe('foo bar');
    });

    it('handles null values', () => {
      expect(cn('foo', null, 'bar')).toBe('foo bar');
    });

    it('handles false values', () => {
      expect(cn('foo', false, 'bar')).toBe('foo bar');
    });

    it('handles 0 values', () => {
      expect(cn('foo', 0, 'bar')).toBe('foo bar');
    });
  });

  // -------------------------------------------------
  // Tailwind Conflict Resolution
  // -------------------------------------------------

  describe('tailwind conflict resolution', () => {
    it('resolves padding conflicts (last wins)', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2');
    });

    it('resolves margin conflicts', () => {
      expect(cn('m-4', 'm-8')).toBe('m-8');
    });

    it('resolves text color conflicts', () => {
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('resolves background color conflicts', () => {
      expect(cn('bg-white', 'bg-black')).toBe('bg-black');
    });

    it('preserves non-conflicting classes', () => {
      expect(cn('p-4', 'text-red-500', 'p-2')).toBe('text-red-500 p-2');
    });

    it('resolves flex direction conflicts', () => {
      expect(cn('flex-row', 'flex-col')).toBe('flex-col');
    });

    it('resolves display conflicts', () => {
      expect(cn('block', 'hidden')).toBe('hidden');
    });

    it('keeps different directional paddings', () => {
      expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
    });

    it('resolves same directional paddings', () => {
      expect(cn('px-4', 'px-2')).toBe('px-2');
    });

    it('handles complex class combinations', () => {
      expect(cn('px-4 py-2 bg-white', 'px-8 text-black')).toBe('py-2 bg-white px-8 text-black');
    });
  });

  // -------------------------------------------------
  // Conditional Classes
  // -------------------------------------------------

  describe('conditional classes', () => {
    it('handles object syntax with true values', () => {
      expect(cn({ foo: true, bar: false })).toBe('foo');
    });

    it('handles object syntax with all true', () => {
      expect(cn({ foo: true, bar: true })).toBe('foo bar');
    });

    it('handles object syntax with all false', () => {
      expect(cn({ foo: false, bar: false })).toBe('');
    });

    it('handles array syntax', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar');
    });

    it('handles nested array syntax', () => {
      expect(cn(['foo', ['bar', 'baz']])).toBe('foo bar baz');
    });

    it('handles mixed syntax', () => {
      expect(cn('base', { active: true, disabled: false }, ['extra'])).toBe('base active extra');
    });

    it('handles complex mixed syntax', () => {
      expect(
        cn('flex', { 'items-center': true, hidden: false }, ['p-4', 'm-2'], 'text-white')
      ).toBe('flex items-center p-4 m-2 text-white');
    });
  });
});

// =====================================================
// formatDate TESTS
// =====================================================

describe('formatDate', () => {
  // -------------------------------------------------
  // Date Object Input
  // -------------------------------------------------

  describe('Date object input', () => {
    it('formats Date object correctly', () => {
      const date = new Date('2024-06-15T10:00:00Z');
      const result = formatDate(date);
      // Result depends on timezone, test the format structure
      expect(result).toMatch(/June \d{1,2}, 2024/);
    });

    it('formats date with single digit day', () => {
      const date = new Date('2024-06-01T10:00:00Z');
      const result = formatDate(date);
      expect(result).toMatch(/June \d{1,2}, 2024/);
    });

    it('formats different months correctly', () => {
      expect(formatDate(new Date('2024-01-15T10:00:00Z'))).toMatch(/January/);
      expect(formatDate(new Date('2024-12-15T10:00:00Z'))).toMatch(/December/);
    });
  });

  // -------------------------------------------------
  // String Date Input
  // -------------------------------------------------

  describe('string date input', () => {
    it('formats string date correctly', () => {
      const result = formatDate('2024-06-15');
      expect(result).toMatch(/June \d{1,2}, 2024/);
    });

    it('handles ISO string dates', () => {
      const result = formatDate('2024-06-15T10:00:00Z');
      expect(result).toMatch(/June \d{1,2}, 2024/);
    });

    it('handles ISO string with timezone offset', () => {
      const result = formatDate('2024-06-15T10:00:00+05:30');
      expect(result).toMatch(/June \d{1,2}, 2024/);
    });
  });

  // -------------------------------------------------
  // Edge Cases
  // -------------------------------------------------

  describe('edge cases', () => {
    it('formats dates in different years', () => {
      expect(formatDate('2020-01-01')).toMatch(/January \d{1,2}, 2020/);
      expect(formatDate('2030-12-31')).toMatch(/December \d{1,2}, 2030/);
    });

    it('handles leap year date', () => {
      const result = formatDate('2024-02-29');
      expect(result).toMatch(/February \d{1,2}, 2024/);
    });
  });
});

// =====================================================
// timeAgo TESTS
// =====================================================

describe('timeAgo', () => {
  const NOW = new Date('2024-06-15T10:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // -------------------------------------------------
  // Just Now (< 60 seconds)
  // -------------------------------------------------

  describe('just now (< 60 seconds)', () => {
    it('returns "just now" for 0 seconds ago', () => {
      expect(timeAgo(NOW)).toBe('just now');
    });

    it('returns "just now" for 30 seconds ago', () => {
      const thirtySecondsAgo = new Date(NOW.getTime() - 30 * 1000);
      expect(timeAgo(thirtySecondsAgo)).toBe('just now');
    });

    it('returns "just now" for 59 seconds ago', () => {
      const fiftyNineSecondsAgo = new Date(NOW.getTime() - 59 * 1000);
      expect(timeAgo(fiftyNineSecondsAgo)).toBe('just now');
    });
  });

  // -------------------------------------------------
  // Minutes Ago (60 seconds - 1 hour)
  // -------------------------------------------------

  describe('minutes ago (1-59 minutes)', () => {
    it('returns "1 minutes ago" for 60 seconds ago', () => {
      const oneMinuteAgo = new Date(NOW.getTime() - 60 * 1000);
      expect(timeAgo(oneMinuteAgo)).toBe('1 minutes ago');
    });

    it('returns "10 minutes ago" for 10 minutes', () => {
      const tenMinutesAgo = new Date(NOW.getTime() - 10 * 60 * 1000);
      expect(timeAgo(tenMinutesAgo)).toBe('10 minutes ago');
    });

    it('returns "59 minutes ago" for 59 minutes', () => {
      const fiftyNineMinutesAgo = new Date(NOW.getTime() - 59 * 60 * 1000);
      expect(timeAgo(fiftyNineMinutesAgo)).toBe('59 minutes ago');
    });
  });

  // -------------------------------------------------
  // Hours Ago (1 hour - 24 hours)
  // -------------------------------------------------

  describe('hours ago (1-23 hours)', () => {
    it('returns "1 hours ago" for 1 hour', () => {
      const oneHourAgo = new Date(NOW.getTime() - 60 * 60 * 1000);
      expect(timeAgo(oneHourAgo)).toBe('1 hours ago');
    });

    it('returns "5 hours ago" for 5 hours', () => {
      const fiveHoursAgo = new Date(NOW.getTime() - 5 * 60 * 60 * 1000);
      expect(timeAgo(fiveHoursAgo)).toBe('5 hours ago');
    });

    it('returns "23 hours ago" for 23 hours', () => {
      const twentyThreeHoursAgo = new Date(NOW.getTime() - 23 * 60 * 60 * 1000);
      expect(timeAgo(twentyThreeHoursAgo)).toBe('23 hours ago');
    });
  });

  // -------------------------------------------------
  // Days Ago (1 day - 30 days)
  // -------------------------------------------------

  describe('days ago (1-29 days)', () => {
    it('returns "1 days ago" for 1 day', () => {
      const oneDayAgo = new Date(NOW.getTime() - 24 * 60 * 60 * 1000);
      expect(timeAgo(oneDayAgo)).toBe('1 days ago');
    });

    it('returns "7 days ago" for 1 week', () => {
      const oneWeekAgo = new Date(NOW.getTime() - 7 * 24 * 60 * 60 * 1000);
      expect(timeAgo(oneWeekAgo)).toBe('7 days ago');
    });

    it('returns "29 days ago" for 29 days', () => {
      const twentyNineDaysAgo = new Date(NOW.getTime() - 29 * 24 * 60 * 60 * 1000);
      expect(timeAgo(twentyNineDaysAgo)).toBe('29 days ago');
    });
  });

  // -------------------------------------------------
  // Fallback to formatDate (> 30 days)
  // -------------------------------------------------

  describe('fallback to formatDate (> 30 days)', () => {
    it('returns formatted date for 30 days', () => {
      const thirtyDaysAgo = new Date(NOW.getTime() - 30 * 24 * 60 * 60 * 1000);
      const result = timeAgo(thirtyDaysAgo);
      expect(result).toMatch(/May \d{1,2}, 2024/);
    });

    it('returns formatted date for 60 days', () => {
      const sixtyDaysAgo = new Date(NOW.getTime() - 60 * 24 * 60 * 60 * 1000);
      const result = timeAgo(sixtyDaysAgo);
      expect(result).toMatch(/April \d{1,2}, 2024/);
    });

    it('returns formatted date for 365 days', () => {
      const oneYearAgo = new Date(NOW.getTime() - 365 * 24 * 60 * 60 * 1000);
      const result = timeAgo(oneYearAgo);
      expect(result).toMatch(/June \d{1,2}, 2023/);
    });
  });

  // -------------------------------------------------
  // String Date Input
  // -------------------------------------------------

  describe('string date input', () => {
    it('handles ISO string input', () => {
      const fiveMinutesAgo = new Date(NOW.getTime() - 5 * 60 * 1000);
      expect(timeAgo(fiveMinutesAgo.toISOString())).toBe('5 minutes ago');
    });
  });
});

// =====================================================
// truncate TESTS
// =====================================================

describe('truncate', () => {
  // -------------------------------------------------
  // Under Length (No Truncation)
  // -------------------------------------------------

  describe('under length (no truncation)', () => {
    it('returns original text when shorter than length', () => {
      expect(truncate('hello', 10)).toBe('hello');
    });

    it('returns original text when exactly at length', () => {
      expect(truncate('hello', 5)).toBe('hello');
    });

    it('returns empty string for empty input', () => {
      expect(truncate('', 10)).toBe('');
    });
  });

  // -------------------------------------------------
  // Over Length (Truncation)
  // -------------------------------------------------

  describe('over length (truncation)', () => {
    it('truncates text longer than length', () => {
      expect(truncate('hello world', 5)).toBe('hello...');
    });

    it('truncates to exact length plus ellipsis', () => {
      expect(truncate('hello world test', 10)).toBe('hello worl...');
    });

    it('handles single character truncation', () => {
      expect(truncate('hello', 1)).toBe('h...');
    });
  });

  // -------------------------------------------------
  // Edge Cases
  // -------------------------------------------------

  describe('edge cases', () => {
    it('handles length of 0', () => {
      expect(truncate('hello', 0)).toBe('...');
    });

    it('handles very long text', () => {
      const longText = 'a'.repeat(1000);
      const result = truncate(longText, 50);
      expect(result).toBe('a'.repeat(50) + '...');
    });

    it('handles text with special characters', () => {
      expect(truncate('hello!@#$%', 5)).toBe('hello...');
    });

    it('handles text with unicode characters', () => {
      expect(truncate('hello world', 8)).toBe('hello wo...');
    });

    it('handles text with newlines', () => {
      expect(truncate('hello\nworld', 5)).toBe('hello...');
    });
  });
});

// =====================================================
// formatReflectionDate TESTS
// =====================================================

describe('formatReflectionDate', () => {
  // -------------------------------------------------
  // Ordinal Suffixes
  // -------------------------------------------------

  describe('ordinal suffixes', () => {
    it('uses "st" for 1st', () => {
      const date = new Date('2024-06-01T10:00:00');
      const result = formatReflectionDate(date);
      expect(result).toContain('1st');
      expect(result).toContain('June');
    });

    it('uses "nd" for 2nd', () => {
      const date = new Date('2024-06-02T10:00:00');
      const result = formatReflectionDate(date);
      expect(result).toContain('2nd');
    });

    it('uses "rd" for 3rd', () => {
      const date = new Date('2024-06-03T10:00:00');
      const result = formatReflectionDate(date);
      expect(result).toContain('3rd');
    });

    it('uses "th" for 4th through 10th', () => {
      expect(formatReflectionDate(new Date('2024-06-04T10:00:00'))).toContain('4th');
      expect(formatReflectionDate(new Date('2024-06-05T10:00:00'))).toContain('5th');
      expect(formatReflectionDate(new Date('2024-06-10T10:00:00'))).toContain('10th');
    });

    it('uses "th" for 11th, 12th, 13th (special cases)', () => {
      expect(formatReflectionDate(new Date('2024-06-11T10:00:00'))).toContain('11th');
      expect(formatReflectionDate(new Date('2024-06-12T10:00:00'))).toContain('12th');
      expect(formatReflectionDate(new Date('2024-06-13T10:00:00'))).toContain('13th');
    });

    it('uses "st" for 21st', () => {
      const date = new Date('2024-06-21T10:00:00');
      const result = formatReflectionDate(date);
      expect(result).toContain('21st');
    });

    it('uses "nd" for 22nd', () => {
      const date = new Date('2024-06-22T10:00:00');
      const result = formatReflectionDate(date);
      expect(result).toContain('22nd');
    });

    it('uses "rd" for 23rd', () => {
      const date = new Date('2024-06-23T10:00:00');
      const result = formatReflectionDate(date);
      expect(result).toContain('23rd');
    });

    it('uses "th" for 24th through 30th', () => {
      expect(formatReflectionDate(new Date('2024-06-24T10:00:00'))).toContain('24th');
      expect(formatReflectionDate(new Date('2024-06-30T10:00:00'))).toContain('30th');
    });

    it('uses "st" for 31st', () => {
      const date = new Date('2024-07-31T10:00:00');
      const result = formatReflectionDate(date);
      expect(result).toContain('31st');
    });
  });

  // -------------------------------------------------
  // Time of Day
  // -------------------------------------------------

  describe('time of day', () => {
    it('returns "Night" for hour 0', () => {
      const date = new Date('2024-06-15T00:00:00');
      expect(formatReflectionDate(date)).toContain('Night');
    });

    it('returns "Night" for hours 1-5', () => {
      expect(formatReflectionDate(new Date('2024-06-15T01:00:00'))).toContain('Night');
      expect(formatReflectionDate(new Date('2024-06-15T05:00:00'))).toContain('Night');
    });

    it('returns "Morning" for hour 6', () => {
      const date = new Date('2024-06-15T06:00:00');
      expect(formatReflectionDate(date)).toContain('Morning');
    });

    it('returns "Morning" for hours 7-11', () => {
      expect(formatReflectionDate(new Date('2024-06-15T09:00:00'))).toContain('Morning');
      expect(formatReflectionDate(new Date('2024-06-15T11:00:00'))).toContain('Morning');
    });

    it('returns "Afternoon" for hour 12', () => {
      const date = new Date('2024-06-15T12:00:00');
      expect(formatReflectionDate(date)).toContain('Afternoon');
    });

    it('returns "Afternoon" for hours 13-16', () => {
      expect(formatReflectionDate(new Date('2024-06-15T14:00:00'))).toContain('Afternoon');
      expect(formatReflectionDate(new Date('2024-06-15T16:00:00'))).toContain('Afternoon');
    });

    it('returns "Evening" for hour 17', () => {
      const date = new Date('2024-06-15T17:00:00');
      expect(formatReflectionDate(date)).toContain('Evening');
    });

    it('returns "Evening" for hours 18-20', () => {
      expect(formatReflectionDate(new Date('2024-06-15T19:00:00'))).toContain('Evening');
      expect(formatReflectionDate(new Date('2024-06-15T20:00:00'))).toContain('Evening');
    });

    it('returns "Night" for hour 21', () => {
      const date = new Date('2024-06-15T21:00:00');
      expect(formatReflectionDate(date)).toContain('Night');
    });

    it('returns "Night" for hours 22-23', () => {
      expect(formatReflectionDate(new Date('2024-06-15T22:00:00'))).toContain('Night');
      expect(formatReflectionDate(new Date('2024-06-15T23:00:00'))).toContain('Night');
    });
  });

  // -------------------------------------------------
  // Full Format
  // -------------------------------------------------

  describe('full format', () => {
    it('returns correctly formatted string with all parts', () => {
      const date = new Date('2024-11-28T19:30:00');
      const result = formatReflectionDate(date);
      expect(result).toBe('November 28th, 2024 \u2022 Evening');
    });

    it('handles string date input', () => {
      const result = formatReflectionDate('2024-06-15T10:00:00');
      expect(result).toContain('June');
      expect(result).toContain('15th');
      expect(result).toContain('2024');
      expect(result).toContain('Morning');
    });

    it('includes bullet separator', () => {
      const result = formatReflectionDate(new Date('2024-06-15T10:00:00'));
      expect(result).toContain('\u2022');
    });
  });
});
