// lib/animations/__tests__/config.test.ts
// Tests for animation configuration exports

import { describe, it, expect } from 'vitest';

import { easings, durations, defaultTransition } from '../config';

// =====================================================
// EASINGS TESTS
// =====================================================

describe('easings', () => {
  describe('easeOut', () => {
    it('should be a tuple of 4 numbers', () => {
      expect(easings.easeOut).toHaveLength(4);
      expect(easings.easeOut.every((n) => typeof n === 'number')).toBe(true);
    });

    it('should have correct cubic bezier values', () => {
      expect(easings.easeOut).toEqual([0.4, 0, 0.2, 1]);
    });
  });

  describe('easeIn', () => {
    it('should be a tuple of 4 numbers', () => {
      expect(easings.easeIn).toHaveLength(4);
      expect(easings.easeIn.every((n) => typeof n === 'number')).toBe(true);
    });

    it('should have correct cubic bezier values', () => {
      expect(easings.easeIn).toEqual([0.4, 0, 1, 1]);
    });
  });

  describe('easeInOut', () => {
    it('should be a tuple of 4 numbers', () => {
      expect(easings.easeInOut).toHaveLength(4);
      expect(easings.easeInOut.every((n) => typeof n === 'number')).toBe(true);
    });

    it('should have correct cubic bezier values', () => {
      expect(easings.easeInOut).toEqual([0.4, 0, 0.6, 1]);
    });
  });

  describe('spring', () => {
    it('should be a spring configuration object', () => {
      expect(easings.spring.type).toBe('spring');
    });

    it('should have damping property', () => {
      expect(easings.spring.damping).toBe(15);
    });

    it('should have stiffness property', () => {
      expect(easings.spring.stiffness).toBe(100);
    });
  });
});

// =====================================================
// DURATIONS TESTS
// =====================================================

describe('durations', () => {
  describe('fast', () => {
    it('should be a number', () => {
      expect(typeof durations.fast).toBe('number');
    });

    it('should be 0.15 seconds', () => {
      expect(durations.fast).toBe(0.15);
    });
  });

  describe('normal', () => {
    it('should be a number', () => {
      expect(typeof durations.normal).toBe('number');
    });

    it('should be 0.3 seconds', () => {
      expect(durations.normal).toBe(0.3);
    });
  });

  describe('slow', () => {
    it('should be a number', () => {
      expect(typeof durations.slow).toBe('number');
    });

    it('should be 0.6 seconds', () => {
      expect(durations.slow).toBe(0.6);
    });
  });

  describe('duration ordering', () => {
    it('should have fast < normal < slow', () => {
      expect(durations.fast).toBeLessThan(durations.normal);
      expect(durations.normal).toBeLessThan(durations.slow);
    });
  });
});

// =====================================================
// DEFAULT TRANSITION TESTS
// =====================================================

describe('defaultTransition', () => {
  it('should have a duration property', () => {
    expect(defaultTransition.duration).toBeDefined();
  });

  it('should use normal duration', () => {
    expect(defaultTransition.duration).toBe(durations.normal);
  });

  it('should have an ease property', () => {
    expect(defaultTransition.ease).toBeDefined();
  });

  it('should use easeOut easing', () => {
    expect(defaultTransition.ease).toEqual(easings.easeOut);
  });

  it('should be usable as a framer-motion transition object', () => {
    // Test that it has the expected shape
    expect(typeof defaultTransition.duration).toBe('number');
    expect(Array.isArray(defaultTransition.ease)).toBe(true);
    expect(defaultTransition.ease).toHaveLength(4);
  });
});
