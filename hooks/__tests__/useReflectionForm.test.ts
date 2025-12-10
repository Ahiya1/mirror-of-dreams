import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useReflectionForm } from '../useReflectionForm';

import type { Dream, SavedFormState } from '@/lib/reflection/types';
import type { ToneId } from '@/lib/utils/constants';

import { STORAGE_KEY, STORAGE_EXPIRY_MS } from '@/lib/reflection/constants';
import { EMPTY_FORM_DATA, createMockFormData } from '@/test/fixtures/form-data';

// Mock ToastContext
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
};

vi.mock('@/contexts/ToastContext', () => ({
  useToast: () => mockToast,
}));

// Mock localStorage
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get store() {
      return store;
    },
    set store(newStore: Record<string, string>) {
      store = newStore;
    },
  };
};

const localStorageMock = createLocalStorageMock();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Helper: Create mock dream
const createMockDream = (overrides: Partial<Dream> = {}): Dream => ({
  id: 'dream-1',
  title: 'Test Dream',
  description: 'A test dream description',
  targetDate: '2025-12-31',
  daysLeft: 365,
  category: 'personal_growth',
  ...overrides,
});

// Helper: Create multiple dreams
const createMockDreams = (count: number): Dream[] =>
  Array.from({ length: count }, (_, i) =>
    createMockDream({ id: `dream-${i + 1}`, title: `Dream ${i + 1}` })
  );

// Helper: Create saved form state for localStorage tests
const createSavedFormState = (overrides: Partial<SavedFormState> = {}): SavedFormState => ({
  data: createMockFormData(),
  dreamId: 'dream-1',
  tone: 'fusion' as ToneId,
  timestamp: Date.now(),
  ...overrides,
});

describe('useReflectionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.store = {};
    // Reset mock implementations to default
    localStorageMock.getItem.mockImplementation(
      (key: string) => localStorageMock.store[key] || null
    );
    localStorageMock.setItem.mockImplementation((key: string, value: string) => {
      localStorageMock.store[key] = value;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================
  // INITIALIZATION TESTS
  // ============================================
  describe('initialization', () => {
    it('initializes with empty form data when no saved state exists', () => {
      const { result } = renderHook(() => useReflectionForm({ dreams: [] }));

      expect(result.current.formData).toEqual(EMPTY_FORM_DATA);
    });

    it('initializes with initialDreamId when provided', () => {
      const { result } = renderHook(() =>
        useReflectionForm({ dreams: [], initialDreamId: 'dream-123' })
      );

      expect(result.current.selectedDreamId).toBe('dream-123');
    });

    it('initializes selectedTone to fusion by default', () => {
      const { result } = renderHook(() => useReflectionForm({ dreams: [] }));

      expect(result.current.selectedTone).toBe('fusion');
    });

    it('initializes selectedDream as null', () => {
      const { result } = renderHook(() => useReflectionForm({ dreams: [] }));

      expect(result.current.selectedDream).toBeNull();
    });

    it('initializes formData as EMPTY_FORM_DATA', () => {
      const { result } = renderHook(() => useReflectionForm({ dreams: [] }));

      expect(result.current.formData).toEqual({
        dream: '',
        plan: '',
        relationship: '',
        offering: '',
      });
    });
  });

  // ============================================
  // DREAM SELECTION TESTS
  // ============================================
  describe('dream selection', () => {
    it('handleDreamSelect updates selectedDreamId', () => {
      const mockDreams = createMockDreams(3);
      const { result } = renderHook(() => useReflectionForm({ dreams: mockDreams }));

      act(() => {
        result.current.handleDreamSelect('dream-2');
      });

      expect(result.current.selectedDreamId).toBe('dream-2');
    });

    it('handleDreamSelect updates selectedDream when dream found in dreams array', () => {
      const mockDreams = createMockDreams(3);
      const { result } = renderHook(() => useReflectionForm({ dreams: mockDreams }));

      act(() => {
        result.current.handleDreamSelect('dream-2');
      });

      expect(result.current.selectedDream).toEqual(mockDreams[1]);
    });

    it('handleDreamSelect sets selectedDream to null when dream not found', () => {
      const mockDreams = createMockDreams(3);
      const { result } = renderHook(() => useReflectionForm({ dreams: mockDreams }));

      act(() => {
        result.current.handleDreamSelect('non-existent-dream');
      });

      expect(result.current.selectedDream).toBeNull();
      expect(result.current.selectedDreamId).toBe('non-existent-dream');
    });

    it('updates selectedDream when dreams array loads (useEffect)', () => {
      const { result, rerender } = renderHook(
        ({ dreams }) => useReflectionForm({ dreams, initialDreamId: 'dream-1' }),
        { initialProps: { dreams: undefined as Dream[] | undefined } }
      );

      expect(result.current.selectedDream).toBeNull();

      // Simulate dreams loading
      const mockDreams = createMockDreams(3);
      rerender({ dreams: mockDreams });

      expect(result.current.selectedDream).toEqual(mockDreams[0]);
    });
  });

  // ============================================
  // FORM FIELD CHANGES TESTS
  // ============================================
  describe('form field changes', () => {
    it('handleFieldChange updates dream field', () => {
      const { result } = renderHook(() => useReflectionForm({ dreams: [] }));

      act(() => {
        result.current.handleFieldChange('dream', 'My new dream');
      });

      expect(result.current.formData.dream).toBe('My new dream');
    });

    it('handleFieldChange updates plan field', () => {
      const { result } = renderHook(() => useReflectionForm({ dreams: [] }));

      act(() => {
        result.current.handleFieldChange('plan', 'My action plan');
      });

      expect(result.current.formData.plan).toBe('My action plan');
    });

    it('handleFieldChange updates relationship field', () => {
      const { result } = renderHook(() => useReflectionForm({ dreams: [] }));

      act(() => {
        result.current.handleFieldChange('relationship', 'Deep connection');
      });

      expect(result.current.formData.relationship).toBe('Deep connection');
    });

    it('handleFieldChange updates offering field', () => {
      const { result } = renderHook(() => useReflectionForm({ dreams: [] }));

      act(() => {
        result.current.handleFieldChange('offering', 'My dedication');
      });

      expect(result.current.formData.offering).toBe('My dedication');
    });

    it('handleFieldChange preserves other fields when updating one', () => {
      const { result } = renderHook(() => useReflectionForm({ dreams: [] }));

      // Set initial values for all fields
      act(() => {
        result.current.handleFieldChange('dream', 'Dream content');
        result.current.handleFieldChange('plan', 'Plan content');
        result.current.handleFieldChange('relationship', 'Relationship content');
        result.current.handleFieldChange('offering', 'Offering content');
      });

      // Update only one field
      act(() => {
        result.current.handleFieldChange('dream', 'Updated dream');
      });

      expect(result.current.formData).toEqual({
        dream: 'Updated dream',
        plan: 'Plan content',
        relationship: 'Relationship content',
        offering: 'Offering content',
      });
    });
  });

  // ============================================
  // VALIDATION TESTS
  // ============================================
  describe('validation', () => {
    it('validateForm returns false and shows toast when no dream selected', () => {
      const { result } = renderHook(() => useReflectionForm({ dreams: [] }));

      let isValid: boolean = true;
      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid).toBe(false);
      expect(mockToast.warning).toHaveBeenCalledWith('Please select a dream');
    });

    it('validateForm returns false and shows toast when dream field empty', () => {
      const mockDreams = createMockDreams(1);
      const { result } = renderHook(() => useReflectionForm({ dreams: mockDreams }));

      act(() => {
        result.current.handleDreamSelect('dream-1');
      });

      let isValid: boolean = true;
      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid).toBe(false);
      expect(mockToast.warning).toHaveBeenCalledWith('Please elaborate on your dream');
    });

    it('validateForm returns false and shows toast when plan field empty', () => {
      const mockDreams = createMockDreams(1);
      const { result } = renderHook(() => useReflectionForm({ dreams: mockDreams }));

      act(() => {
        result.current.handleDreamSelect('dream-1');
        result.current.handleFieldChange('dream', 'My dream content');
      });

      let isValid: boolean = true;
      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid).toBe(false);
      expect(mockToast.warning).toHaveBeenCalledWith('Please describe your plan');
    });

    it('validateForm returns false and shows toast when relationship field empty', () => {
      const mockDreams = createMockDreams(1);
      const { result } = renderHook(() => useReflectionForm({ dreams: mockDreams }));

      act(() => {
        result.current.handleDreamSelect('dream-1');
        result.current.handleFieldChange('dream', 'My dream content');
        result.current.handleFieldChange('plan', 'My plan content');
      });

      let isValid: boolean = true;
      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid).toBe(false);
      expect(mockToast.warning).toHaveBeenCalledWith(
        'Please share your relationship with this dream'
      );
    });

    it('validateForm returns false and shows toast when offering field empty', () => {
      const mockDreams = createMockDreams(1);
      const { result } = renderHook(() => useReflectionForm({ dreams: mockDreams }));

      act(() => {
        result.current.handleDreamSelect('dream-1');
        result.current.handleFieldChange('dream', 'My dream content');
        result.current.handleFieldChange('plan', 'My plan content');
        result.current.handleFieldChange('relationship', 'My relationship content');
      });

      let isValid: boolean = true;
      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid).toBe(false);
      expect(mockToast.warning).toHaveBeenCalledWith("Please describe what you're willing to give");
    });

    it('validateForm returns true when all fields have content', () => {
      const mockDreams = createMockDreams(1);
      const { result } = renderHook(() => useReflectionForm({ dreams: mockDreams }));

      act(() => {
        result.current.handleDreamSelect('dream-1');
        result.current.handleFieldChange('dream', 'My dream');
        result.current.handleFieldChange('plan', 'My plan');
        result.current.handleFieldChange('relationship', 'My relationship');
        result.current.handleFieldChange('offering', 'My offering');
      });

      let isValid: boolean = false;
      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid).toBe(true);
      expect(mockToast.warning).not.toHaveBeenCalled();
    });

    it('validateForm trims whitespace when validating', () => {
      const mockDreams = createMockDreams(1);
      const { result } = renderHook(() => useReflectionForm({ dreams: mockDreams }));

      act(() => {
        result.current.handleDreamSelect('dream-1');
        result.current.handleFieldChange('dream', '   '); // Only whitespace
      });

      let isValid: boolean = true;
      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid).toBe(false);
      expect(mockToast.warning).toHaveBeenCalledWith('Please elaborate on your dream');
    });
  });

  // ============================================
  // LOCALSTORAGE SAVE TESTS
  // ============================================
  describe('localStorage persistence - save', () => {
    it('saves form data to localStorage when content changes', async () => {
      const { result } = renderHook(() => useReflectionForm({ dreams: [] }));

      act(() => {
        result.current.handleFieldChange('dream', 'My dream content');
      });

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalled();
      });

      expect(localStorageMock.store[STORAGE_KEY]).toBeDefined();
      const savedData = JSON.parse(localStorageMock.store[STORAGE_KEY]);
      expect(savedData.data.dream).toBe('My dream content');
    });

    it('saves dreamId to localStorage', async () => {
      const mockDreams = createMockDreams(1);
      const { result } = renderHook(() => useReflectionForm({ dreams: mockDreams }));

      act(() => {
        result.current.handleDreamSelect('dream-1');
      });

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalled();
      });

      expect(localStorageMock.store[STORAGE_KEY]).toBeDefined();
      const savedData = JSON.parse(localStorageMock.store[STORAGE_KEY]);
      expect(savedData.dreamId).toBe('dream-1');
    });

    it('saves tone to localStorage', async () => {
      const { result } = renderHook(() => useReflectionForm({ dreams: [] }));

      act(() => {
        result.current.handleFieldChange('dream', 'Content');
        result.current.setSelectedTone('poetic' as ToneId);
      });

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalled();
      });

      expect(localStorageMock.store[STORAGE_KEY]).toBeDefined();
      const savedData = JSON.parse(localStorageMock.store[STORAGE_KEY]);
      expect(savedData.tone).toBe('poetic');
    });

    it('saves timestamp to localStorage', async () => {
      const beforeTime = Date.now();
      const { result } = renderHook(() => useReflectionForm({ dreams: [] }));

      act(() => {
        result.current.handleFieldChange('dream', 'Content');
      });

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalled();
      });

      expect(localStorageMock.store[STORAGE_KEY]).toBeDefined();
      const savedData = JSON.parse(localStorageMock.store[STORAGE_KEY]);
      const afterTime = Date.now();

      expect(savedData.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(savedData.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('does not save when form is empty and no dreamId', () => {
      renderHook(() => useReflectionForm({ dreams: [] }));

      // Only the initial load call should happen, not a save
      expect(localStorageMock.getItem).toHaveBeenCalled();
      // No content + no dreamId = no save
      expect(localStorageMock.store[STORAGE_KEY]).toBeUndefined();
    });
  });

  // ============================================
  // LOCALSTORAGE LOAD TESTS
  // ============================================
  describe('localStorage persistence - load', () => {
    it('loads saved form data on mount', () => {
      const savedState = createSavedFormState({
        data: createMockFormData({ dream: 'Loaded dream' }),
      });
      localStorageMock.store[STORAGE_KEY] = JSON.stringify(savedState);

      const { result } = renderHook(() => useReflectionForm({ dreams: [] }));

      expect(result.current.formData.dream).toBe('Loaded dream');
    });

    it('loads saved dreamId on mount', () => {
      const savedState = createSavedFormState({ dreamId: 'saved-dream-id' });
      localStorageMock.store[STORAGE_KEY] = JSON.stringify(savedState);

      const { result } = renderHook(() => useReflectionForm({ dreams: [] }));

      expect(result.current.selectedDreamId).toBe('saved-dream-id');
    });

    it('loads saved tone on mount', () => {
      const savedState = createSavedFormState({ tone: 'poetic' as ToneId });
      localStorageMock.store[STORAGE_KEY] = JSON.stringify(savedState);

      const { result } = renderHook(() => useReflectionForm({ dreams: [] }));

      expect(result.current.selectedTone).toBe('poetic');
    });

    it('handles malformed JSON gracefully', () => {
      localStorageMock.store[STORAGE_KEY] = 'not valid json {{{';

      const { result } = renderHook(() => useReflectionForm({ dreams: [] }));

      // Should use defaults instead of crashing
      expect(result.current.formData).toEqual(EMPTY_FORM_DATA);
      expect(result.current.selectedDreamId).toBe('');
      expect(result.current.selectedTone).toBe('fusion');
    });
  });

  // ============================================
  // LOCALSTORAGE EXPIRY TESTS
  // ============================================
  describe('localStorage expiry', () => {
    it('removes expired data (older than 24 hours)', () => {
      const expiredState = createSavedFormState({
        timestamp: Date.now() - STORAGE_EXPIRY_MS - 1000, // 1 second past expiry
        data: createMockFormData({ dream: 'Expired dream' }),
      });
      localStorageMock.store[STORAGE_KEY] = JSON.stringify(expiredState);

      const { result } = renderHook(() => useReflectionForm({ dreams: [] }));

      // Should not load expired data
      expect(result.current.formData).toEqual(EMPTY_FORM_DATA);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
    });

    it('loads fresh data (within 24 hours)', () => {
      const freshState = createSavedFormState({
        timestamp: Date.now() - STORAGE_EXPIRY_MS + 60000, // 1 minute before expiry
        data: createMockFormData({ dream: 'Fresh dream' }),
      });
      localStorageMock.store[STORAGE_KEY] = JSON.stringify(freshState);

      const { result } = renderHook(() => useReflectionForm({ dreams: [] }));

      // Should load fresh data
      expect(result.current.formData.dream).toBe('Fresh dream');
      expect(localStorageMock.removeItem).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // CLEAR FORM TESTS
  // ============================================
  describe('clearForm', () => {
    it('clearForm resets formData to EMPTY_FORM_DATA', () => {
      const { result } = renderHook(() => useReflectionForm({ dreams: [] }));

      // First add some content
      act(() => {
        result.current.handleFieldChange('dream', 'My dream');
        result.current.handleFieldChange('plan', 'My plan');
      });

      // Then clear
      act(() => {
        result.current.clearForm();
      });

      expect(result.current.formData).toEqual(EMPTY_FORM_DATA);
    });

    it('clearForm resets selectedDreamId to empty string', () => {
      const mockDreams = createMockDreams(1);
      const { result } = renderHook(() =>
        useReflectionForm({ dreams: mockDreams, initialDreamId: 'dream-1' })
      );

      act(() => {
        result.current.clearForm();
      });

      expect(result.current.selectedDreamId).toBe('');
    });

    it('clearForm resets selectedDream to null', () => {
      const mockDreams = createMockDreams(1);
      const { result } = renderHook(() =>
        useReflectionForm({ dreams: mockDreams, initialDreamId: 'dream-1' })
      );

      // Wait for dream to be set via useEffect
      expect(result.current.selectedDreamId).toBe('dream-1');

      act(() => {
        result.current.clearForm();
      });

      expect(result.current.selectedDream).toBeNull();
    });

    it('clearForm resets selectedTone to fusion', () => {
      const { result } = renderHook(() => useReflectionForm({ dreams: [] }));

      // First change tone
      act(() => {
        result.current.setSelectedTone('poetic' as ToneId);
      });

      expect(result.current.selectedTone).toBe('poetic');

      // Then clear
      act(() => {
        result.current.clearForm();
      });

      expect(result.current.selectedTone).toBe('fusion');
    });

    it('clearForm removes STORAGE_KEY from localStorage', () => {
      const { result } = renderHook(() => useReflectionForm({ dreams: [] }));

      act(() => {
        result.current.clearForm();
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
    });
  });

  // ============================================
  // TONE SELECTION TESTS
  // ============================================
  describe('tone selection', () => {
    it('setSelectedTone updates selectedTone state', () => {
      const { result } = renderHook(() => useReflectionForm({ dreams: [] }));

      act(() => {
        result.current.setSelectedTone('poetic' as ToneId);
      });

      expect(result.current.selectedTone).toBe('poetic');
    });

    it('setSelectedTone can be changed multiple times', () => {
      const { result } = renderHook(() => useReflectionForm({ dreams: [] }));

      act(() => {
        result.current.setSelectedTone('poetic' as ToneId);
      });
      expect(result.current.selectedTone).toBe('poetic');

      act(() => {
        result.current.setSelectedTone('practical' as ToneId);
      });
      expect(result.current.selectedTone).toBe('practical');

      act(() => {
        result.current.setSelectedTone('fusion' as ToneId);
      });
      expect(result.current.selectedTone).toBe('fusion');
    });
  });

  // ============================================
  // ERROR HANDLING TESTS
  // ============================================
  describe('error handling', () => {
    it('handles localStorage errors gracefully on save', async () => {
      const { result } = renderHook(() => useReflectionForm({ dreams: [] }));

      // Make setItem throw an error for the next call
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage full');
      });

      // Should not throw
      act(() => {
        result.current.handleFieldChange('dream', 'Content that triggers save');
      });

      // Form should still update
      expect(result.current.formData.dream).toBe('Content that triggers save');
    });

    it('handles localStorage errors gracefully on load', () => {
      // Make getItem throw an error
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Storage corrupted');
      });

      // Should not throw and should use default values
      const { result } = renderHook(() => useReflectionForm({ dreams: [] }));

      expect(result.current.formData).toEqual(EMPTY_FORM_DATA);
      expect(result.current.selectedDreamId).toBe('');
      expect(result.current.selectedTone).toBe('fusion');
    });
  });

  // ============================================
  // RETURN VALUE COMPLETENESS TESTS
  // ============================================
  describe('return value completeness', () => {
    it('returns all expected state properties', () => {
      const { result } = renderHook(() => useReflectionForm({ dreams: [] }));

      expect(result.current).toHaveProperty('formData');
      expect(result.current).toHaveProperty('selectedDreamId');
      expect(result.current).toHaveProperty('selectedDream');
      expect(result.current).toHaveProperty('selectedTone');
    });

    it('returns all expected action functions', () => {
      const { result } = renderHook(() => useReflectionForm({ dreams: [] }));

      expect(typeof result.current.handleFieldChange).toBe('function');
      expect(typeof result.current.handleDreamSelect).toBe('function');
      expect(typeof result.current.setSelectedTone).toBe('function');
      expect(typeof result.current.validateForm).toBe('function');
      expect(typeof result.current.clearForm).toBe('function');
    });
  });

  // ============================================
  // EDGE CASES TESTS
  // ============================================
  describe('edge cases', () => {
    it('handles empty dreams array', () => {
      const { result } = renderHook(() => useReflectionForm({ dreams: [] }));

      act(() => {
        result.current.handleDreamSelect('dream-1');
      });

      expect(result.current.selectedDreamId).toBe('dream-1');
      expect(result.current.selectedDream).toBeNull();
    });

    it('handles undefined dreams array', () => {
      const { result } = renderHook(() => useReflectionForm({ dreams: undefined }));

      act(() => {
        result.current.handleDreamSelect('dream-1');
      });

      expect(result.current.selectedDreamId).toBe('dream-1');
      expect(result.current.selectedDream).toBeNull();
    });

    it('handles rapid field changes', () => {
      const { result } = renderHook(() => useReflectionForm({ dreams: [] }));

      act(() => {
        result.current.handleFieldChange('dream', 'A');
        result.current.handleFieldChange('dream', 'AB');
        result.current.handleFieldChange('dream', 'ABC');
        result.current.handleFieldChange('dream', 'ABCD');
      });

      expect(result.current.formData.dream).toBe('ABCD');
    });

    it('handles special characters in form fields', () => {
      const { result } = renderHook(() => useReflectionForm({ dreams: [] }));

      const specialContent = "Test <script>alert('xss')</script> & \"quotes\" 'apostrophe'";

      act(() => {
        result.current.handleFieldChange('dream', specialContent);
      });

      expect(result.current.formData.dream).toBe(specialContent);
    });

    it('handles very long content in form fields', () => {
      const { result } = renderHook(() => useReflectionForm({ dreams: [] }));

      const longContent = 'A'.repeat(10000);

      act(() => {
        result.current.handleFieldChange('dream', longContent);
      });

      expect(result.current.formData.dream).toBe(longContent);
    });

    it('validates correct order of fields', () => {
      const mockDreams = createMockDreams(1);
      const { result } = renderHook(() => useReflectionForm({ dreams: mockDreams }));

      // Set all fields except dream (first one)
      act(() => {
        result.current.handleDreamSelect('dream-1');
        result.current.handleFieldChange('plan', 'My plan');
        result.current.handleFieldChange('relationship', 'My relationship');
        result.current.handleFieldChange('offering', 'My offering');
      });

      let isValid: boolean = true;
      act(() => {
        isValid = result.current.validateForm();
      });

      // Should fail on dream field (first validation)
      expect(isValid).toBe(false);
      expect(mockToast.warning).toHaveBeenCalledWith('Please elaborate on your dream');
    });

    it('preserves saved state across unmount and remount', () => {
      // Create initial state in localStorage
      const savedState = createSavedFormState({
        data: createMockFormData({ dream: 'Persisted dream' }),
        dreamId: 'persisted-dream-id',
        tone: 'poetic' as ToneId,
      });
      localStorageMock.store[STORAGE_KEY] = JSON.stringify(savedState);

      // First mount
      const { result, unmount } = renderHook(() => useReflectionForm({ dreams: [] }));

      expect(result.current.formData.dream).toBe('Persisted dream');
      expect(result.current.selectedDreamId).toBe('persisted-dream-id');
      expect(result.current.selectedTone).toBe('poetic');

      // Unmount
      unmount();

      // Remount
      const { result: result2 } = renderHook(() => useReflectionForm({ dreams: [] }));

      expect(result2.current.formData.dream).toBe('Persisted dream');
      expect(result2.current.selectedDreamId).toBe('persisted-dream-id');
      expect(result2.current.selectedTone).toBe('poetic');
    });
  });

  // ============================================
  // INTEGRATION TESTS
  // ============================================
  describe('integration scenarios', () => {
    it('full workflow: select dream, fill form, validate, clear', () => {
      const mockDreams = createMockDreams(3);
      const { result } = renderHook(() => useReflectionForm({ dreams: mockDreams }));

      // 1. Select a dream
      act(() => {
        result.current.handleDreamSelect('dream-2');
      });
      expect(result.current.selectedDreamId).toBe('dream-2');
      expect(result.current.selectedDream).toEqual(mockDreams[1]);

      // 2. Fill form fields
      act(() => {
        result.current.handleFieldChange('dream', 'My elaborate dream');
        result.current.handleFieldChange('plan', 'Step-by-step plan');
        result.current.handleFieldChange('relationship', 'Deep connection');
        result.current.handleFieldChange('offering', 'Full commitment');
      });

      // 3. Set tone
      act(() => {
        result.current.setSelectedTone('poetic' as ToneId);
      });
      expect(result.current.selectedTone).toBe('poetic');

      // 4. Validate - should pass
      let isValid: boolean = false;
      act(() => {
        isValid = result.current.validateForm();
      });
      expect(isValid).toBe(true);

      // 5. Clear form
      act(() => {
        result.current.clearForm();
      });
      expect(result.current.formData).toEqual(EMPTY_FORM_DATA);
      expect(result.current.selectedDreamId).toBe('');
      expect(result.current.selectedDream).toBeNull();
      expect(result.current.selectedTone).toBe('fusion');
    });

    it('load saved state, modify, then validate', () => {
      // Setup saved state
      const savedState = createSavedFormState({
        data: {
          dream: 'Saved dream',
          plan: 'Saved plan',
          relationship: 'Saved relationship',
          offering: '', // Missing offering
        },
        dreamId: 'saved-dream',
        tone: 'poetic' as ToneId,
      });
      localStorageMock.store[STORAGE_KEY] = JSON.stringify(savedState);

      const mockDreams = [createMockDream({ id: 'saved-dream' })];
      const { result } = renderHook(() => useReflectionForm({ dreams: mockDreams }));

      // State should be loaded
      expect(result.current.formData.dream).toBe('Saved dream');
      expect(result.current.selectedDreamId).toBe('saved-dream');
      expect(result.current.selectedTone).toBe('poetic');

      // Validate - should fail on offering
      let isValid: boolean = true;
      act(() => {
        isValid = result.current.validateForm();
      });
      expect(isValid).toBe(false);
      expect(mockToast.warning).toHaveBeenCalledWith("Please describe what you're willing to give");

      // Complete the form
      act(() => {
        result.current.handleFieldChange('offering', 'My complete offering');
      });

      // Validate again - should pass
      vi.clearAllMocks();
      act(() => {
        isValid = result.current.validateForm();
      });
      expect(isValid).toBe(true);
      expect(mockToast.warning).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // ADDITIONAL EDGE CASE TESTS FOR COVERAGE
  // ============================================
  describe('additional coverage tests', () => {
    it('handles initialDreamId with matching dream in array', () => {
      const mockDreams = createMockDreams(3);
      const { result } = renderHook(() =>
        useReflectionForm({ dreams: mockDreams, initialDreamId: 'dream-2' })
      );

      // Wait for effect to run
      expect(result.current.selectedDreamId).toBe('dream-2');
      expect(result.current.selectedDream).toEqual(mockDreams[1]);
    });

    it('handles switching from one dream to another', () => {
      const mockDreams = createMockDreams(3);
      const { result } = renderHook(() => useReflectionForm({ dreams: mockDreams }));

      // Select first dream
      act(() => {
        result.current.handleDreamSelect('dream-1');
      });
      expect(result.current.selectedDream?.id).toBe('dream-1');

      // Switch to second dream
      act(() => {
        result.current.handleDreamSelect('dream-2');
      });
      expect(result.current.selectedDream?.id).toBe('dream-2');

      // Switch to third dream
      act(() => {
        result.current.handleDreamSelect('dream-3');
      });
      expect(result.current.selectedDream?.id).toBe('dream-3');
    });

    it('validates each field individually with whitespace', () => {
      const mockDreams = createMockDreams(1);
      const { result } = renderHook(() => useReflectionForm({ dreams: mockDreams }));

      // Test plan with whitespace only
      act(() => {
        result.current.handleDreamSelect('dream-1');
        result.current.handleFieldChange('dream', 'Valid dream');
        result.current.handleFieldChange('plan', '   ');
      });

      let isValid: boolean = true;
      act(() => {
        isValid = result.current.validateForm();
      });
      expect(isValid).toBe(false);
      expect(mockToast.warning).toHaveBeenCalledWith('Please describe your plan');
    });

    it('validates relationship with whitespace only', () => {
      const mockDreams = createMockDreams(1);
      const { result } = renderHook(() => useReflectionForm({ dreams: mockDreams }));

      act(() => {
        result.current.handleDreamSelect('dream-1');
        result.current.handleFieldChange('dream', 'Valid dream');
        result.current.handleFieldChange('plan', 'Valid plan');
        result.current.handleFieldChange('relationship', '\t\n  ');
      });

      let isValid: boolean = true;
      act(() => {
        isValid = result.current.validateForm();
      });
      expect(isValid).toBe(false);
      expect(mockToast.warning).toHaveBeenCalledWith(
        'Please share your relationship with this dream'
      );
    });

    it('validates offering with whitespace only', () => {
      const mockDreams = createMockDreams(1);
      const { result } = renderHook(() => useReflectionForm({ dreams: mockDreams }));

      act(() => {
        result.current.handleDreamSelect('dream-1');
        result.current.handleFieldChange('dream', 'Valid dream');
        result.current.handleFieldChange('plan', 'Valid plan');
        result.current.handleFieldChange('relationship', 'Valid relationship');
        result.current.handleFieldChange('offering', '    ');
      });

      let isValid: boolean = true;
      act(() => {
        isValid = result.current.validateForm();
      });
      expect(isValid).toBe(false);
      expect(mockToast.warning).toHaveBeenCalledWith("Please describe what you're willing to give");
    });

    it('clears form after validation failure', () => {
      const mockDreams = createMockDreams(1);
      const { result } = renderHook(() => useReflectionForm({ dreams: mockDreams }));

      // Partial form data
      act(() => {
        result.current.handleDreamSelect('dream-1');
        result.current.handleFieldChange('dream', 'My dream');
      });

      // Validate - should fail
      let isValid: boolean = true;
      act(() => {
        isValid = result.current.validateForm();
      });
      expect(isValid).toBe(false);

      // Clear the form
      act(() => {
        result.current.clearForm();
      });

      // Everything should be reset
      expect(result.current.formData).toEqual(EMPTY_FORM_DATA);
      expect(result.current.selectedDreamId).toBe('');
    });

    it('handles updating form after loading from storage', async () => {
      // Setup saved state
      const savedState = createSavedFormState({
        data: createMockFormData({ dream: 'Original dream' }),
      });
      localStorageMock.store[STORAGE_KEY] = JSON.stringify(savedState);

      const { result } = renderHook(() => useReflectionForm({ dreams: [] }));

      // Verify loaded
      expect(result.current.formData.dream).toBe('Original dream');

      // Update the dream
      act(() => {
        result.current.handleFieldChange('dream', 'Updated dream');
      });

      expect(result.current.formData.dream).toBe('Updated dream');

      // Verify it saves the update
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalled();
      });

      const latestSave = JSON.parse(localStorageMock.store[STORAGE_KEY]);
      expect(latestSave.data.dream).toBe('Updated dream');
    });
  });
});
