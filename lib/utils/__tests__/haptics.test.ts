// lib/utils/__tests__/haptics.test.ts
// Tests for haptic feedback utilities

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Unmock the haptics module to test the actual implementation
// (it is mocked globally in vitest.setup.ts for other tests)
vi.unmock('../haptics');

import { haptic, isHapticSupported } from '../haptics';

import type { HapticStyle } from '../haptics';

// =====================================================
// HAPTIC DURATIONS (matching source constants)
// =====================================================

const EXPECTED_HAPTIC_DURATIONS: Record<HapticStyle, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [15, 50, 30],
  warning: [30, 30, 30],
};

// =====================================================
// haptic TESTS
// =====================================================

describe('haptic', () => {
  const mockVibrate = vi.fn().mockReturnValue(true);
  const originalNavigator = global.navigator;

  // -------------------------------------------------
  // Navigator Available Tests
  // -------------------------------------------------

  describe('when navigator.vibrate is available', () => {
    beforeEach(() => {
      Object.defineProperty(global, 'navigator', {
        value: { vibrate: mockVibrate },
        configurable: true,
        writable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        configurable: true,
        writable: true,
      });
      vi.clearAllMocks();
    });

    // -------------------------------------------------
    // Default Parameter Tests
    // -------------------------------------------------

    describe('default parameter', () => {
      it('uses light style when no argument provided', () => {
        haptic();
        expect(mockVibrate).toHaveBeenCalledWith(EXPECTED_HAPTIC_DURATIONS.light);
      });

      it('calls vibrate exactly once', () => {
        haptic();
        expect(mockVibrate).toHaveBeenCalledTimes(1);
      });
    });

    // -------------------------------------------------
    // Light Style Tests
    // -------------------------------------------------

    describe('light style', () => {
      it('calls navigator.vibrate with 10ms duration', () => {
        haptic('light');
        expect(mockVibrate).toHaveBeenCalledWith(10);
      });
    });

    // -------------------------------------------------
    // Medium Style Tests
    // -------------------------------------------------

    describe('medium style', () => {
      it('calls navigator.vibrate with 25ms duration', () => {
        haptic('medium');
        expect(mockVibrate).toHaveBeenCalledWith(25);
      });
    });

    // -------------------------------------------------
    // Heavy Style Tests
    // -------------------------------------------------

    describe('heavy style', () => {
      it('calls navigator.vibrate with 50ms duration', () => {
        haptic('heavy');
        expect(mockVibrate).toHaveBeenCalledWith(50);
      });
    });

    // -------------------------------------------------
    // Success Style Tests
    // -------------------------------------------------

    describe('success style', () => {
      it('calls navigator.vibrate with double-tap pattern', () => {
        haptic('success');
        expect(mockVibrate).toHaveBeenCalledWith([15, 50, 30]);
      });
    });

    // -------------------------------------------------
    // Warning Style Tests
    // -------------------------------------------------

    describe('warning style', () => {
      it('calls navigator.vibrate with triple-tap pattern', () => {
        haptic('warning');
        expect(mockVibrate).toHaveBeenCalledWith([30, 30, 30]);
      });
    });

    // -------------------------------------------------
    // Multiple Calls Tests
    // -------------------------------------------------

    describe('multiple calls', () => {
      it('calls vibrate for each haptic call', () => {
        haptic('light');
        haptic('medium');
        haptic('heavy');
        expect(mockVibrate).toHaveBeenCalledTimes(3);
      });

      it('uses correct duration for each call', () => {
        haptic('light');
        haptic('heavy');
        expect(mockVibrate).toHaveBeenNthCalledWith(1, 10);
        expect(mockVibrate).toHaveBeenNthCalledWith(2, 50);
      });
    });
  });

  // -------------------------------------------------
  // Navigator Undefined Tests (SSR scenario)
  // -------------------------------------------------

  describe('when navigator is undefined', () => {
    beforeEach(() => {
      Object.defineProperty(global, 'navigator', {
        value: undefined,
        configurable: true,
        writable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        configurable: true,
        writable: true,
      });
    });

    it('does not throw when calling haptic with default style', () => {
      expect(() => haptic()).not.toThrow();
    });

    it('does not throw when calling haptic with light style', () => {
      expect(() => haptic('light')).not.toThrow();
    });

    it('does not throw when calling haptic with medium style', () => {
      expect(() => haptic('medium')).not.toThrow();
    });

    it('does not throw when calling haptic with heavy style', () => {
      expect(() => haptic('heavy')).not.toThrow();
    });

    it('does not throw when calling haptic with success style', () => {
      expect(() => haptic('success')).not.toThrow();
    });

    it('does not throw when calling haptic with warning style', () => {
      expect(() => haptic('warning')).not.toThrow();
    });
  });

  // -------------------------------------------------
  // Navigator Without vibrate Tests
  // -------------------------------------------------

  describe('when navigator exists but vibrate is not available', () => {
    beforeEach(() => {
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'test-agent' },
        configurable: true,
        writable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        configurable: true,
        writable: true,
      });
    });

    it('does not throw when vibrate is missing', () => {
      expect(() => haptic('light')).not.toThrow();
    });

    it('does not throw for any style when vibrate is missing', () => {
      expect(() => haptic('medium')).not.toThrow();
      expect(() => haptic('heavy')).not.toThrow();
      expect(() => haptic('success')).not.toThrow();
      expect(() => haptic('warning')).not.toThrow();
    });
  });

  // -------------------------------------------------
  // Vibrate Throws Error Tests
  // -------------------------------------------------

  describe('when navigator.vibrate throws an error', () => {
    const throwingVibrate = vi.fn().mockImplementation(() => {
      throw new Error('Vibration not supported');
    });

    beforeEach(() => {
      Object.defineProperty(global, 'navigator', {
        value: { vibrate: throwingVibrate },
        configurable: true,
        writable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        configurable: true,
        writable: true,
      });
      vi.clearAllMocks();
    });

    it('silently catches errors from vibrate', () => {
      expect(() => haptic('light')).not.toThrow();
    });

    it('silently catches errors for all styles', () => {
      expect(() => haptic('medium')).not.toThrow();
      expect(() => haptic('heavy')).not.toThrow();
      expect(() => haptic('success')).not.toThrow();
      expect(() => haptic('warning')).not.toThrow();
    });

    it('attempts to call vibrate even if it might throw', () => {
      haptic('light');
      expect(throwingVibrate).toHaveBeenCalledWith(10);
    });
  });

  // -------------------------------------------------
  // Vibrate Returns False Tests
  // -------------------------------------------------

  describe('when navigator.vibrate returns false', () => {
    const falseVibrate = vi.fn().mockReturnValue(false);

    beforeEach(() => {
      Object.defineProperty(global, 'navigator', {
        value: { vibrate: falseVibrate },
        configurable: true,
        writable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        configurable: true,
        writable: true,
      });
      vi.clearAllMocks();
    });

    it('does not throw when vibrate returns false', () => {
      expect(() => haptic('light')).not.toThrow();
    });

    it('still calls vibrate with correct duration', () => {
      haptic('heavy');
      expect(falseVibrate).toHaveBeenCalledWith(50);
    });
  });
});

// =====================================================
// isHapticSupported TESTS
// =====================================================

describe('isHapticSupported', () => {
  const originalNavigator = global.navigator;

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
  });

  // -------------------------------------------------
  // Supported Environment Tests
  // -------------------------------------------------

  describe('when haptic is supported', () => {
    beforeEach(() => {
      Object.defineProperty(global, 'navigator', {
        value: { vibrate: vi.fn() },
        configurable: true,
        writable: true,
      });
    });

    it('returns true when navigator.vibrate exists', () => {
      expect(isHapticSupported()).toBe(true);
    });

    it('returns true consistently on multiple calls', () => {
      expect(isHapticSupported()).toBe(true);
      expect(isHapticSupported()).toBe(true);
      expect(isHapticSupported()).toBe(true);
    });
  });

  // -------------------------------------------------
  // Unsupported Environment Tests
  // -------------------------------------------------

  describe('when haptic is not supported', () => {
    it('returns false when navigator is undefined', () => {
      Object.defineProperty(global, 'navigator', {
        value: undefined,
        configurable: true,
        writable: true,
      });
      expect(isHapticSupported()).toBe(false);
    });

    it('returns false when navigator exists but vibrate is missing', () => {
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'test-agent' },
        configurable: true,
        writable: true,
      });
      expect(isHapticSupported()).toBe(false);
    });
  });

  // -------------------------------------------------
  // Edge Cases & in Operator Behavior
  // -------------------------------------------------

  describe('edge cases', () => {
    it('returns true when vibrate exists even with other properties', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          vibrate: vi.fn(),
          userAgent: 'Chrome',
          platform: 'Android',
        },
        configurable: true,
        writable: true,
      });
      expect(isHapticSupported()).toBe(true);
    });

    it('checks for vibrate property presence not functionality', () => {
      // Even if vibrate would throw, isHapticSupported just checks presence
      const throwingVibrate = vi.fn().mockImplementation(() => {
        throw new Error('Not supported');
      });
      Object.defineProperty(global, 'navigator', {
        value: { vibrate: throwingVibrate },
        configurable: true,
        writable: true,
      });
      expect(isHapticSupported()).toBe(true);
    });

    it('returns true when vibrate property exists but is undefined (in operator behavior)', () => {
      // Note: The 'in' operator checks for property existence, not truthy value
      // So { vibrate: undefined } still has the 'vibrate' property
      Object.defineProperty(global, 'navigator', {
        value: { vibrate: undefined },
        configurable: true,
        writable: true,
      });
      expect(isHapticSupported()).toBe(true);
    });

    it('returns true when vibrate property exists but is null (in operator behavior)', () => {
      // Note: The 'in' operator checks for property existence, not truthy value
      // So { vibrate: null } still has the 'vibrate' property
      Object.defineProperty(global, 'navigator', {
        value: { vibrate: null },
        configurable: true,
        writable: true,
      });
      expect(isHapticSupported()).toBe(true);
    });
  });
});
