import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Create mutable reference for searchParams
let mockSearchParams = new URLSearchParams();

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}));

// Helper function to update params
const setMockSearchParams = (params: Record<string, string>) => {
  mockSearchParams = new URLSearchParams(params);
};

// Import hook after mocks are set up
import { useReflectionViewMode } from '../useReflectionViewMode';

import type { NewReflection } from '@/lib/reflection/types';

describe('useReflectionViewMode', () => {
  // Mock history API
  const mockReplaceState = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams(); // Reset to empty

    Object.defineProperty(window, 'history', {
      value: {
        replaceState: mockReplaceState,
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.resetModules();
  });

  // ============================================
  // INITIALIZATION TESTS
  // ============================================
  describe('initialization', () => {
    it('initializes viewMode to questionnaire when no id in URL', () => {
      setMockSearchParams({});

      const { result } = renderHook(() => useReflectionViewMode());

      expect(result.current.viewMode).toBe('questionnaire');
    });

    it('initializes viewMode to output when id exists in URL', () => {
      setMockSearchParams({ id: 'reflection-123' });

      const { result } = renderHook(() => useReflectionViewMode());

      expect(result.current.viewMode).toBe('output');
    });

    it('reads reflectionId from searchParams', () => {
      setMockSearchParams({ id: 'reflection-456' });

      const { result } = renderHook(() => useReflectionViewMode());

      expect(result.current.reflectionId).toBe('reflection-456');
    });

    it('reads dreamIdFromUrl from searchParams', () => {
      setMockSearchParams({ dreamId: 'dream-789' });

      const { result } = renderHook(() => useReflectionViewMode());

      expect(result.current.dreamIdFromUrl).toBe('dream-789');
    });

    it('initializes newReflection as null', () => {
      setMockSearchParams({});

      const { result } = renderHook(() => useReflectionViewMode());

      expect(result.current.newReflection).toBeNull();
    });

    it('returns null for reflectionId when not in URL', () => {
      setMockSearchParams({});

      const { result } = renderHook(() => useReflectionViewMode());

      expect(result.current.reflectionId).toBeNull();
    });

    it('returns null for dreamIdFromUrl when not in URL', () => {
      setMockSearchParams({});

      const { result } = renderHook(() => useReflectionViewMode());

      expect(result.current.dreamIdFromUrl).toBeNull();
    });

    it('reads both id and dreamId from URL', () => {
      setMockSearchParams({ id: 'reflection-123', dreamId: 'dream-456' });

      const { result } = renderHook(() => useReflectionViewMode());

      expect(result.current.reflectionId).toBe('reflection-123');
      expect(result.current.dreamIdFromUrl).toBe('dream-456');
      expect(result.current.viewMode).toBe('output');
    });
  });

  // ============================================
  // VIEW MODE SYNC WITH URL TESTS
  // ============================================
  describe('view mode sync with URL', () => {
    it('syncs viewMode to output when reflectionId appears in URL', () => {
      // Start with no params
      setMockSearchParams({});

      const { result, rerender } = renderHook(() => useReflectionViewMode());
      expect(result.current.viewMode).toBe('questionnaire');

      // Simulate URL change
      setMockSearchParams({ id: 'reflection-123' });
      rerender();

      expect(result.current.viewMode).toBe('output');
    });

    it('syncs viewMode to questionnaire when reflectionId removed from URL', () => {
      // Start with id in URL
      setMockSearchParams({ id: 'reflection-123' });

      const { result, rerender } = renderHook(() => useReflectionViewMode());
      expect(result.current.viewMode).toBe('output');

      // Simulate URL change (id removed)
      setMockSearchParams({});
      rerender();

      expect(result.current.viewMode).toBe('questionnaire');
    });

    it('does not sync viewMode when newReflection exists (prevents override)', () => {
      setMockSearchParams({});

      const { result, rerender } = renderHook(() => useReflectionViewMode());

      // Set newReflection first (simulating just created reflection)
      act(() => {
        result.current.setNewReflection({ id: 'new-1', content: 'New content' });
      });

      // Manually set viewMode to output (simulating showing the new reflection)
      act(() => {
        result.current.setViewMode('output');
      });

      expect(result.current.viewMode).toBe('output');

      // Simulate URL change that would normally sync viewMode back to questionnaire
      setMockSearchParams({});
      rerender();

      // Should stay on output because newReflection prevents sync
      expect(result.current.viewMode).toBe('output');
    });

    it('handles multiple URL param changes correctly', () => {
      setMockSearchParams({});

      const { result, rerender } = renderHook(() => useReflectionViewMode());
      expect(result.current.viewMode).toBe('questionnaire');

      // First change: add id
      setMockSearchParams({ id: 'reflection-1' });
      rerender();
      expect(result.current.viewMode).toBe('output');

      // Second change: different id
      setMockSearchParams({ id: 'reflection-2' });
      rerender();
      expect(result.current.viewMode).toBe('output');
      expect(result.current.reflectionId).toBe('reflection-2');

      // Third change: remove id
      setMockSearchParams({});
      rerender();
      expect(result.current.viewMode).toBe('questionnaire');
    });
  });

  // ============================================
  // NEW REFLECTION HANDLING TESTS
  // ============================================
  describe('new reflection handling', () => {
    it('setNewReflection updates newReflection state', () => {
      setMockSearchParams({});

      const { result } = renderHook(() => useReflectionViewMode());

      const newRef: NewReflection = { id: 'new-1', content: 'Test content' };
      act(() => {
        result.current.setNewReflection(newRef);
      });

      expect(result.current.newReflection).toEqual(newRef);
    });

    it('setNewReflection with null clears newReflection', () => {
      setMockSearchParams({});

      const { result } = renderHook(() => useReflectionViewMode());

      // First set a reflection
      act(() => {
        result.current.setNewReflection({ id: 'new-1', content: 'Test' });
      });

      expect(result.current.newReflection).not.toBeNull();

      // Then clear it
      act(() => {
        result.current.setNewReflection(null);
      });

      expect(result.current.newReflection).toBeNull();
    });

    it('setting newReflection prevents viewMode sync from URL', () => {
      // Start with id in URL
      setMockSearchParams({ id: 'reflection-123' });

      const { result, rerender } = renderHook(() => useReflectionViewMode());
      expect(result.current.viewMode).toBe('output');

      // Set newReflection
      act(() => {
        result.current.setNewReflection({ id: 'new-1', content: 'New content' });
      });

      // URL changes to remove id
      setMockSearchParams({});
      rerender();

      // viewMode should NOT sync to questionnaire because newReflection exists
      expect(result.current.viewMode).toBe('output');
    });
  });

  // ============================================
  // RESET FUNCTIONALITY TESTS
  // ============================================
  describe('reset functionality', () => {
    it('resetToQuestionnaire sets viewMode to questionnaire when URL has no id', () => {
      // Start with newReflection set and output mode (simulating a newly created reflection)
      setMockSearchParams({});

      const { result } = renderHook(() => useReflectionViewMode());

      // Simulate creating a new reflection and viewing it
      act(() => {
        result.current.setNewReflection({ id: 'new-1', content: 'Test' });
        result.current.setViewMode('output');
      });

      expect(result.current.viewMode).toBe('output');

      // Reset - since URL has no id, viewMode should go to questionnaire
      act(() => {
        result.current.resetToQuestionnaire();
      });

      expect(result.current.viewMode).toBe('questionnaire');
    });

    it('resetToQuestionnaire calls history.replaceState to clear URL params', () => {
      // In a real app, this would change the actual URL, allowing the useEffect
      // to sync viewMode to questionnaire. Here we test the replaceState is called.
      setMockSearchParams({ id: 'reflection-123' });

      const { result } = renderHook(() => useReflectionViewMode());
      expect(result.current.viewMode).toBe('output');

      act(() => {
        result.current.resetToQuestionnaire();
      });

      expect(mockReplaceState).toHaveBeenCalledWith(null, '', '/reflection');
    });

    it('resetToQuestionnaire sets newReflection to null', () => {
      setMockSearchParams({});

      const { result } = renderHook(() => useReflectionViewMode());

      // First set a newReflection
      act(() => {
        result.current.setNewReflection({ id: 'new-1', content: 'Test' });
      });

      expect(result.current.newReflection).not.toBeNull();

      // Reset
      act(() => {
        result.current.resetToQuestionnaire();
      });

      expect(result.current.newReflection).toBeNull();
    });

    it('resetToQuestionnaire works when already on questionnaire', () => {
      setMockSearchParams({});

      const { result } = renderHook(() => useReflectionViewMode());
      expect(result.current.viewMode).toBe('questionnaire');

      act(() => {
        result.current.resetToQuestionnaire();
      });

      expect(result.current.viewMode).toBe('questionnaire');
      expect(mockReplaceState).toHaveBeenCalledWith(null, '', '/reflection');
    });

    it('resetToQuestionnaire clears newReflection even when on questionnaire', () => {
      setMockSearchParams({});

      const { result } = renderHook(() => useReflectionViewMode());

      // Set newReflection while on questionnaire
      act(() => {
        result.current.setNewReflection({ id: 'new-1', content: 'Test' });
      });

      act(() => {
        result.current.resetToQuestionnaire();
      });

      expect(result.current.newReflection).toBeNull();
    });
  });

  // ============================================
  // RETURN VALUE COMPLETENESS TESTS
  // ============================================
  describe('return value completeness', () => {
    it('returns all expected state properties', () => {
      setMockSearchParams({});

      const { result } = renderHook(() => useReflectionViewMode());

      expect(result.current).toHaveProperty('viewMode');
      expect(result.current).toHaveProperty('reflectionId');
      expect(result.current).toHaveProperty('dreamIdFromUrl');
      expect(result.current).toHaveProperty('newReflection');
    });

    it('returns all expected action functions', () => {
      setMockSearchParams({});

      const { result } = renderHook(() => useReflectionViewMode());

      expect(typeof result.current.setViewMode).toBe('function');
      expect(typeof result.current.setNewReflection).toBe('function');
      expect(typeof result.current.resetToQuestionnaire).toBe('function');
    });
  });

  // ============================================
  // EDGE CASES TESTS
  // ============================================
  describe('edge cases', () => {
    it('handles empty URL params', () => {
      setMockSearchParams({});

      const { result } = renderHook(() => useReflectionViewMode());

      expect(result.current.viewMode).toBe('questionnaire');
      expect(result.current.reflectionId).toBeNull();
      expect(result.current.dreamIdFromUrl).toBeNull();
      expect(result.current.newReflection).toBeNull();
    });

    it('setViewMode allows manual override when newReflection exists', () => {
      // Manual setViewMode only persists when newReflection is set (prevents URL sync)
      setMockSearchParams({});

      const { result } = renderHook(() => useReflectionViewMode());
      expect(result.current.viewMode).toBe('questionnaire');

      // Set newReflection first to prevent URL sync
      act(() => {
        result.current.setNewReflection({ id: 'new-1', content: 'Test' });
        result.current.setViewMode('output');
      });

      expect(result.current.viewMode).toBe('output');
    });

    it('setViewMode is overridden by URL sync when newReflection is null', () => {
      // When newReflection is null, the useEffect syncs viewMode with URL
      setMockSearchParams({});

      const { result } = renderHook(() => useReflectionViewMode());
      expect(result.current.viewMode).toBe('questionnaire');

      // Without newReflection, setting viewMode manually is overridden by URL sync
      act(() => {
        result.current.setViewMode('output');
      });

      // The useEffect runs and syncs back to questionnaire (no id in URL)
      expect(result.current.viewMode).toBe('questionnaire');
    });

    it('setViewMode back to questionnaire is overridden when URL has id', () => {
      setMockSearchParams({ id: 'reflection-123' });

      const { result } = renderHook(() => useReflectionViewMode());
      expect(result.current.viewMode).toBe('output');

      // Without newReflection, setting viewMode manually is overridden by URL sync
      act(() => {
        result.current.setViewMode('questionnaire');
      });

      // The useEffect runs and syncs back to output (id exists in URL)
      expect(result.current.viewMode).toBe('output');
    });

    it('handles URL with only dreamId (no reflection id)', () => {
      setMockSearchParams({ dreamId: 'dream-123' });

      const { result } = renderHook(() => useReflectionViewMode());

      expect(result.current.viewMode).toBe('questionnaire');
      expect(result.current.reflectionId).toBeNull();
      expect(result.current.dreamIdFromUrl).toBe('dream-123');
    });

    it('url sync resumes after newReflection cleared', () => {
      setMockSearchParams({});

      const { result, rerender } = renderHook(() => useReflectionViewMode());

      // Set newReflection to prevent sync
      act(() => {
        result.current.setNewReflection({ id: 'new-1', content: 'Test' });
        result.current.setViewMode('output');
      });

      // URL changes but should not sync (newReflection exists)
      setMockSearchParams({ id: 'reflection-123' });
      rerender();
      expect(result.current.viewMode).toBe('output');

      // Clear newReflection
      act(() => {
        result.current.setNewReflection(null);
      });

      // Now URL sync should resume - viewMode matches URL (output because id exists)
      setMockSearchParams({ id: 'reflection-456' });
      rerender();
      expect(result.current.viewMode).toBe('output');

      // URL removes id, should sync back to questionnaire
      setMockSearchParams({});
      rerender();
      expect(result.current.viewMode).toBe('questionnaire');
    });

    it('handles rapid viewMode changes with newReflection protection', () => {
      // Rapid setViewMode changes are only meaningful when newReflection exists
      setMockSearchParams({});

      const { result } = renderHook(() => useReflectionViewMode());

      // Set newReflection to allow viewMode changes to persist
      act(() => {
        result.current.setNewReflection({ id: 'new-1', content: 'Test' });
        result.current.setViewMode('output');
        result.current.setViewMode('questionnaire');
        result.current.setViewMode('output');
      });

      expect(result.current.viewMode).toBe('output');
    });

    it('rapid viewMode changes without newReflection end at URL-derived mode', () => {
      setMockSearchParams({});

      const { result } = renderHook(() => useReflectionViewMode());

      act(() => {
        result.current.setViewMode('output');
        result.current.setViewMode('questionnaire');
        result.current.setViewMode('output');
      });

      // Without newReflection, useEffect syncs back to URL-derived mode (questionnaire)
      expect(result.current.viewMode).toBe('questionnaire');
    });

    it('handles rapid newReflection changes', () => {
      setMockSearchParams({});

      const { result } = renderHook(() => useReflectionViewMode());

      act(() => {
        result.current.setNewReflection({ id: '1', content: 'First' });
        result.current.setNewReflection({ id: '2', content: 'Second' });
        result.current.setNewReflection({ id: '3', content: 'Third' });
      });

      expect(result.current.newReflection).toEqual({ id: '3', content: 'Third' });
    });
  });

  // ============================================
  // INITIAL MODE CALCULATION TESTS
  // ============================================
  describe('initial mode calculation', () => {
    it('sets initial mode to output when id param exists on mount', () => {
      setMockSearchParams({ id: 'test-id' });

      const { result } = renderHook(() => useReflectionViewMode());

      // Should be output from the start, not questionnaire then output
      expect(result.current.viewMode).toBe('output');
    });

    it('sets initial mode to questionnaire when no id param on mount', () => {
      setMockSearchParams({});

      const { result } = renderHook(() => useReflectionViewMode());

      expect(result.current.viewMode).toBe('questionnaire');
    });
  });
});
