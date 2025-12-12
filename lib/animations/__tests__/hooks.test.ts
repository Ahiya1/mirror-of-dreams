// lib/animations/__tests__/hooks.test.ts
// Tests for animation hooks

import { renderHook } from '@testing-library/react';
import { useReducedMotion } from 'framer-motion';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useAnimationConfig } from '../hooks';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  useReducedMotion: vi.fn(),
}));

// =====================================================
// useAnimationConfig TESTS
// =====================================================

describe('useAnimationConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // -------------------------------------------------
  // Default Behavior (No Reduced Motion)
  // -------------------------------------------------

  describe('when user prefers normal motion', () => {
    beforeEach(() => {
      vi.mocked(useReducedMotion).mockReturnValue(false);
    });

    it('should return shouldAnimate as true', () => {
      const { result } = renderHook(() => useAnimationConfig());
      expect(result.current.shouldAnimate).toBe(true);
    });

    it('should return variants as undefined', () => {
      const { result } = renderHook(() => useAnimationConfig());
      expect(result.current.variants).toBeUndefined();
    });

    it('should call useReducedMotion hook', () => {
      renderHook(() => useAnimationConfig());
      expect(useReducedMotion).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------
  // Reduced Motion Preference
  // -------------------------------------------------

  describe('when user prefers reduced motion', () => {
    beforeEach(() => {
      vi.mocked(useReducedMotion).mockReturnValue(true);
    });

    it('should return shouldAnimate as false', () => {
      const { result } = renderHook(() => useAnimationConfig());
      expect(result.current.shouldAnimate).toBe(false);
    });

    it('should return variants as empty object', () => {
      const { result } = renderHook(() => useAnimationConfig());
      expect(result.current.variants).toEqual({});
    });

    it('should return empty object not undefined for variants', () => {
      const { result } = renderHook(() => useAnimationConfig());
      expect(result.current.variants).toBeDefined();
      expect(typeof result.current.variants).toBe('object');
    });
  });

  // -------------------------------------------------
  // Hook Return Type
  // -------------------------------------------------

  describe('return type', () => {
    beforeEach(() => {
      vi.mocked(useReducedMotion).mockReturnValue(false);
    });

    it('should return an object with shouldAnimate property', () => {
      const { result } = renderHook(() => useAnimationConfig());
      expect('shouldAnimate' in result.current).toBe(true);
    });

    it('should return an object with variants property', () => {
      const { result } = renderHook(() => useAnimationConfig());
      expect('variants' in result.current).toBe(true);
    });

    it('should have boolean type for shouldAnimate', () => {
      const { result } = renderHook(() => useAnimationConfig());
      expect(typeof result.current.shouldAnimate).toBe('boolean');
    });
  });

  // -------------------------------------------------
  // Re-render Behavior
  // -------------------------------------------------

  describe('re-render behavior', () => {
    it('should update when reduced motion preference changes', () => {
      vi.mocked(useReducedMotion).mockReturnValue(false);
      const { result, rerender } = renderHook(() => useAnimationConfig());

      expect(result.current.shouldAnimate).toBe(true);

      vi.mocked(useReducedMotion).mockReturnValue(true);
      rerender();

      expect(result.current.shouldAnimate).toBe(false);
    });

    it('should update variants when preference changes', () => {
      vi.mocked(useReducedMotion).mockReturnValue(false);
      const { result, rerender } = renderHook(() => useAnimationConfig());

      expect(result.current.variants).toBeUndefined();

      vi.mocked(useReducedMotion).mockReturnValue(true);
      rerender();

      expect(result.current.variants).toEqual({});
    });
  });

  // -------------------------------------------------
  // Edge Cases
  // -------------------------------------------------

  describe('edge cases', () => {
    it('should handle null return from useReducedMotion', () => {
      vi.mocked(useReducedMotion).mockReturnValue(null as unknown as boolean);
      const { result } = renderHook(() => useAnimationConfig());

      // null is falsy, so shouldAnimate should be true (via !null)
      expect(result.current.shouldAnimate).toBe(true);
    });

    it('should handle undefined return from useReducedMotion', () => {
      vi.mocked(useReducedMotion).mockReturnValue(undefined as unknown as boolean);
      const { result } = renderHook(() => useAnimationConfig());

      // undefined is falsy, so shouldAnimate should be true (via !undefined)
      expect(result.current.shouldAnimate).toBe(true);
    });
  });
});
