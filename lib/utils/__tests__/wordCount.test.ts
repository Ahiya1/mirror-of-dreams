// lib/utils/__tests__/wordCount.test.ts
// Tests for word counting utilities: countWords, formatWordCount, getWordCountState

import { describe, expect, it } from 'vitest';

import { countWords, formatWordCount, getWordCountState } from '../wordCount';

// =====================================================
// countWords TESTS
// =====================================================

describe('countWords', () => {
  // -------------------------------------------------
  // Basic Counting
  // -------------------------------------------------

  describe('basic counting', () => {
    it('returns 0 for empty string', () => {
      expect(countWords('')).toBe(0);
    });

    it('counts single word', () => {
      expect(countWords('hello')).toBe(1);
    });

    it('counts two words', () => {
      expect(countWords('hello world')).toBe(2);
    });

    it('counts multiple words', () => {
      expect(countWords('one two three four five')).toBe(5);
    });

    it('counts a sentence', () => {
      expect(countWords('The quick brown fox jumps over the lazy dog')).toBe(9);
    });
  });

  // -------------------------------------------------
  // Whitespace Handling
  // -------------------------------------------------

  describe('whitespace handling', () => {
    it('returns 0 for whitespace-only string', () => {
      expect(countWords('   ')).toBe(0);
    });

    it('returns 0 for tab-only string', () => {
      expect(countWords('\t\t\t')).toBe(0);
    });

    it('returns 0 for newline-only string', () => {
      expect(countWords('\n\n\n')).toBe(0);
    });

    it('returns 0 for mixed whitespace-only string', () => {
      expect(countWords('   \n\t  \n  ')).toBe(0);
    });

    it('handles leading whitespace', () => {
      expect(countWords('   hello world')).toBe(2);
    });

    it('handles trailing whitespace', () => {
      expect(countWords('hello world   ')).toBe(2);
    });

    it('handles multiple spaces between words', () => {
      expect(countWords('hello    world')).toBe(2);
    });

    it('handles tabs between words', () => {
      expect(countWords('hello\tworld')).toBe(2);
    });

    it('handles line breaks between words', () => {
      expect(countWords('hello\nworld')).toBe(2);
    });

    it('handles mixed whitespace between words', () => {
      expect(countWords('hello \n\t world')).toBe(2);
    });

    it('handles complex mixed whitespace', () => {
      expect(countWords('  hello \n world  \t test  ')).toBe(3);
    });
  });

  // -------------------------------------------------
  // Edge Cases
  // -------------------------------------------------

  describe('edge cases', () => {
    it('counts words with punctuation attached', () => {
      expect(countWords('Hello, world!')).toBe(2);
    });

    it('counts hyphenated words as single word', () => {
      expect(countWords('self-aware')).toBe(1);
    });

    it('counts words with apostrophes', () => {
      expect(countWords("don't won't can't")).toBe(3);
    });

    it('handles numbers as words', () => {
      expect(countWords('123 456 789')).toBe(3);
    });

    it('handles mixed text and numbers', () => {
      expect(countWords('I have 3 apples')).toBe(4);
    });

    it('handles unicode text', () => {
      expect(countWords('hello world')).toBe(2);
    });

    it('counts single character as word', () => {
      expect(countWords('a')).toBe(1);
    });

    it('counts single character words', () => {
      expect(countWords('a b c d')).toBe(4);
    });
  });
});

// =====================================================
// formatWordCount TESTS
// =====================================================

describe('formatWordCount', () => {
  // -------------------------------------------------
  // Zero Words
  // -------------------------------------------------

  describe('zero words', () => {
    it('returns encouraging message for 0 words', () => {
      expect(formatWordCount(0)).toBe('Your thoughts await...');
    });
  });

  // -------------------------------------------------
  // Singular
  // -------------------------------------------------

  describe('singular', () => {
    it('returns singular form for 1 word', () => {
      expect(formatWordCount(1)).toBe('1 thoughtful word');
    });
  });

  // -------------------------------------------------
  // Plural
  // -------------------------------------------------

  describe('plural', () => {
    it('returns plural form for 2 words', () => {
      expect(formatWordCount(2)).toBe('2 thoughtful words');
    });

    it('returns plural form for 10 words', () => {
      expect(formatWordCount(10)).toBe('10 thoughtful words');
    });

    it('returns plural form for 100 words', () => {
      expect(formatWordCount(100)).toBe('100 thoughtful words');
    });

    it('returns plural form for large numbers', () => {
      expect(formatWordCount(1000)).toBe('1000 thoughtful words');
    });
  });
});

// =====================================================
// getWordCountState TESTS
// =====================================================

describe('getWordCountState', () => {
  // Using maxChars = 500 for predictable calculations
  // estimatedMaxWords = 500 / 5 = 100 words
  const maxChars = 500;

  // -------------------------------------------------
  // Low State (0-50%)
  // -------------------------------------------------

  describe('low state (0-50%)', () => {
    it('returns "low" for 0 words', () => {
      expect(getWordCountState(0, maxChars)).toBe('low');
    });

    it('returns "low" for 1 word', () => {
      expect(getWordCountState(1, maxChars)).toBe('low');
    });

    it('returns "low" for 25 words (25%)', () => {
      expect(getWordCountState(25, maxChars)).toBe('low');
    });

    it('returns "low" for 49 words (49%)', () => {
      expect(getWordCountState(49, maxChars)).toBe('low');
    });
  });

  // -------------------------------------------------
  // Mid State (50-90%)
  // -------------------------------------------------

  describe('mid state (50-90%)', () => {
    it('returns "mid" for 50 words (50%)', () => {
      expect(getWordCountState(50, maxChars)).toBe('mid');
    });

    it('returns "mid" for 51 words (51%)', () => {
      expect(getWordCountState(51, maxChars)).toBe('mid');
    });

    it('returns "mid" for 70 words (70%)', () => {
      expect(getWordCountState(70, maxChars)).toBe('mid');
    });

    it('returns "mid" for 89 words (89%)', () => {
      expect(getWordCountState(89, maxChars)).toBe('mid');
    });
  });

  // -------------------------------------------------
  // High State (90-100%+)
  // -------------------------------------------------

  describe('high state (90%+)', () => {
    it('returns "high" for 90 words (90%)', () => {
      expect(getWordCountState(90, maxChars)).toBe('high');
    });

    it('returns "high" for 95 words (95%)', () => {
      expect(getWordCountState(95, maxChars)).toBe('high');
    });

    it('returns "high" for 100 words (100%)', () => {
      expect(getWordCountState(100, maxChars)).toBe('high');
    });

    it('returns "high" for words exceeding estimated max', () => {
      expect(getWordCountState(150, maxChars)).toBe('high');
    });
  });

  // -------------------------------------------------
  // Different maxChars Values
  // -------------------------------------------------

  describe('different maxChars values', () => {
    it('calculates correctly with maxChars = 1000', () => {
      // estimatedMaxWords = 1000 / 5 = 200
      // 50% = 100 words, 90% = 180 words
      expect(getWordCountState(50, 1000)).toBe('low'); // 25%
      expect(getWordCountState(100, 1000)).toBe('mid'); // 50%
      expect(getWordCountState(180, 1000)).toBe('high'); // 90%
    });

    it('calculates correctly with maxChars = 250', () => {
      // estimatedMaxWords = 250 / 5 = 50
      // 50% = 25 words, 90% = 45 words
      expect(getWordCountState(20, 250)).toBe('low'); // 40%
      expect(getWordCountState(25, 250)).toBe('mid'); // 50%
      expect(getWordCountState(45, 250)).toBe('high'); // 90%
    });

    it('handles very small maxChars', () => {
      // estimatedMaxWords = 50 / 5 = 10
      expect(getWordCountState(4, 50)).toBe('low'); // 40%
      expect(getWordCountState(5, 50)).toBe('mid'); // 50%
      expect(getWordCountState(9, 50)).toBe('high'); // 90%
    });
  });

  // -------------------------------------------------
  // Edge Cases
  // -------------------------------------------------

  describe('edge cases', () => {
    it('handles boundary between low and mid', () => {
      // With maxChars = 500, boundary is at 49.999... words
      // At 49 words: 49/100 = 0.49 < 0.5 = low
      // At 50 words: 50/100 = 0.5 = mid (not < 0.5)
      expect(getWordCountState(49, 500)).toBe('low');
      expect(getWordCountState(50, 500)).toBe('mid');
    });

    it('handles boundary between mid and high', () => {
      // With maxChars = 500, boundary is at 89.999... words
      // At 89 words: 89/100 = 0.89 < 0.9 = mid
      // At 90 words: 90/100 = 0.9 = high (not < 0.9)
      expect(getWordCountState(89, 500)).toBe('mid');
      expect(getWordCountState(90, 500)).toBe('high');
    });
  });
});
