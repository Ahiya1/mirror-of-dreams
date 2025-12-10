import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useMobileReflectionFlow, WIZARD_STEPS, type WizardStep } from '../useMobileReflectionFlow';

import {
  EMPTY_FORM_DATA,
  createMockFormData,
  partialFormData,
  minimalFormData,
  whitespaceOnlyFormData,
  formProgressScenarios,
} from '@/test/fixtures/form-data';

// Mock haptics - we don't want actual vibrations in tests
vi.mock('@/lib/utils/haptics', () => ({
  haptic: vi.fn(),
}));

// Mock localStorage
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => localStorageMock.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageMock.store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageMock.store[key];
  }),
  clear: vi.fn(() => {
    localStorageMock.store = {};
  }),
};

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useMobileReflectionFlow', () => {
  const mockOnClose = vi.fn();
  const defaultOptions = {
    selectedDreamId: '',
    formData: EMPTY_FORM_DATA,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.resetModules();
  });

  // ============================================
  // INITIALIZATION TESTS
  // ============================================
  describe('initialization', () => {
    it('initializes at first step (dreamSelect)', () => {
      const { result } = renderHook(() => useMobileReflectionFlow(defaultOptions));

      expect(result.current.currentStepIndex).toBe(0);
      expect(result.current.currentStep).toBe('dreamSelect');
      expect(result.current.direction).toBe(0);
      expect(result.current.isTextareaFocused).toBe(false);
      expect(result.current.showExitConfirm).toBe(false);
    });

    it('provides correct totalSteps value', () => {
      const { result } = renderHook(() => useMobileReflectionFlow(defaultOptions));

      expect(result.current.totalSteps).toBe(WIZARD_STEPS.length);
      expect(result.current.totalSteps).toBe(6); // dreamSelect, q1, q2, q3, q4, tone
    });

    it('exports WIZARD_STEPS constant with correct values', () => {
      expect(WIZARD_STEPS).toEqual(['dreamSelect', 'q1', 'q2', 'q3', 'q4', 'tone']);
    });

    it('calculates isDirty correctly for empty form', () => {
      const { result } = renderHook(() => useMobileReflectionFlow(defaultOptions));

      expect(result.current.isDirty).toBe(false);
    });

    it('calculates isDirty correctly for partially filled form', () => {
      const { result } = renderHook(() =>
        useMobileReflectionFlow({
          ...defaultOptions,
          formData: partialFormData,
        })
      );

      expect(result.current.isDirty).toBe(true);
    });

    it('calculates isDirty correctly for fully filled form', () => {
      const { result } = renderHook(() =>
        useMobileReflectionFlow({
          ...defaultOptions,
          formData: createMockFormData(),
        })
      );

      expect(result.current.isDirty).toBe(true);
    });

    it('treats whitespace-only form as not dirty', () => {
      const { result } = renderHook(() =>
        useMobileReflectionFlow({
          ...defaultOptions,
          formData: whitespaceOnlyFormData,
        })
      );

      expect(result.current.isDirty).toBe(false);
    });
  });

  // ============================================
  // canGoNext TESTS
  // ============================================
  describe('canGoNext', () => {
    describe('dreamSelect step', () => {
      it('returns false without dream selection', () => {
        const { result } = renderHook(() => useMobileReflectionFlow(defaultOptions));

        expect(result.current.currentStep).toBe('dreamSelect');
        expect(result.current.canGoNext()).toBe(false);
      });

      it('returns true with dream selection', () => {
        const { result } = renderHook(() =>
          useMobileReflectionFlow({
            ...defaultOptions,
            selectedDreamId: 'dream-1',
          })
        );

        expect(result.current.currentStep).toBe('dreamSelect');
        expect(result.current.canGoNext()).toBe(true);
      });
    });

    describe('question steps (q1-q4)', () => {
      it('returns false on q1 step without content', () => {
        const { result } = renderHook(() =>
          useMobileReflectionFlow({
            ...defaultOptions,
            selectedDreamId: 'dream-1',
          })
        );

        // Advance to q1
        act(() => {
          result.current.goToNextStep();
        });

        expect(result.current.currentStep).toBe('q1');
        expect(result.current.canGoNext()).toBe(false);
      });

      it('returns true on q1 step with content', () => {
        const { result } = renderHook(() =>
          useMobileReflectionFlow({
            ...defaultOptions,
            selectedDreamId: 'dream-1',
            formData: formProgressScenarios.q1Complete,
          })
        );

        // Advance to q1
        act(() => {
          result.current.goToNextStep();
        });

        expect(result.current.currentStep).toBe('q1');
        expect(result.current.canGoNext()).toBe(true);
      });

      it('returns false on q2 step without content', () => {
        const { result } = renderHook(() =>
          useMobileReflectionFlow({
            ...defaultOptions,
            selectedDreamId: 'dream-1',
            formData: formProgressScenarios.q1Complete, // q1 done, q2 empty
          })
        );

        // Advance to q2
        act(() => {
          result.current.goToNextStep(); // to q1
          result.current.goToNextStep(); // to q2
        });

        expect(result.current.currentStep).toBe('q2');
        expect(result.current.canGoNext()).toBe(false);
      });

      it('returns true on q2 step with content', () => {
        const { result } = renderHook(() =>
          useMobileReflectionFlow({
            ...defaultOptions,
            selectedDreamId: 'dream-1',
            formData: formProgressScenarios.q2Complete,
          })
        );

        // Advance to q2
        act(() => {
          result.current.goToNextStep(); // to q1
          result.current.goToNextStep(); // to q2
        });

        expect(result.current.currentStep).toBe('q2');
        expect(result.current.canGoNext()).toBe(true);
      });

      it('validates all question steps correctly', () => {
        const { result } = renderHook(() =>
          useMobileReflectionFlow({
            ...defaultOptions,
            selectedDreamId: 'dream-1',
            formData: minimalFormData, // All questions have minimal content
          })
        );

        // Test each question step
        const questionSteps: WizardStep[] = ['q1', 'q2', 'q3', 'q4'];

        for (let i = 0; i < questionSteps.length; i++) {
          act(() => {
            result.current.goToNextStep();
          });

          expect(result.current.currentStep).toBe(questionSteps[i]);
          expect(result.current.canGoNext()).toBe(true);
        }
      });

      it('treats whitespace-only content as empty', () => {
        const { result } = renderHook(() =>
          useMobileReflectionFlow({
            ...defaultOptions,
            selectedDreamId: 'dream-1',
            formData: whitespaceOnlyFormData,
          })
        );

        // Advance to q1
        act(() => {
          result.current.goToNextStep();
        });

        expect(result.current.currentStep).toBe('q1');
        expect(result.current.canGoNext()).toBe(false);
      });
    });

    describe('tone step', () => {
      it('returns true on tone step (has default selection)', () => {
        const { result } = renderHook(() =>
          useMobileReflectionFlow({
            ...defaultOptions,
            selectedDreamId: 'dream-1',
            formData: createMockFormData(),
          })
        );

        // Advance to tone step
        act(() => {
          for (let i = 0; i < 5; i++) {
            result.current.goToNextStep();
          }
        });

        expect(result.current.currentStep).toBe('tone');
        expect(result.current.canGoNext()).toBe(true);
      });
    });
  });

  // ============================================
  // NAVIGATION TESTS
  // ============================================
  describe('navigation', () => {
    describe('goToNextStep', () => {
      it('advances to next step', () => {
        const { result } = renderHook(() =>
          useMobileReflectionFlow({
            ...defaultOptions,
            selectedDreamId: 'dream-1',
          })
        );

        act(() => {
          result.current.goToNextStep();
        });

        expect(result.current.currentStepIndex).toBe(1);
        expect(result.current.currentStep).toBe('q1');
      });

      it('sets direction to 1 (forward)', () => {
        const { result } = renderHook(() =>
          useMobileReflectionFlow({
            ...defaultOptions,
            selectedDreamId: 'dream-1',
          })
        );

        act(() => {
          result.current.goToNextStep();
        });

        expect(result.current.direction).toBe(1);
      });

      it('does not go past last step', () => {
        const { result } = renderHook(() =>
          useMobileReflectionFlow({
            ...defaultOptions,
            selectedDreamId: 'dream-1',
            formData: createMockFormData(),
          })
        );

        // Advance to last step (5 times from 0 to 5)
        act(() => {
          for (let i = 0; i < WIZARD_STEPS.length - 1; i++) {
            result.current.goToNextStep();
          }
        });

        expect(result.current.currentStepIndex).toBe(WIZARD_STEPS.length - 1);
        expect(result.current.currentStep).toBe('tone');

        // Try to go further - should stay at last step
        act(() => {
          result.current.goToNextStep();
        });

        expect(result.current.currentStepIndex).toBe(WIZARD_STEPS.length - 1);
        expect(result.current.currentStep).toBe('tone');
      });

      it('triggers haptic feedback', async () => {
        const { haptic } = await import('@/lib/utils/haptics');
        const { result } = renderHook(() =>
          useMobileReflectionFlow({
            ...defaultOptions,
            selectedDreamId: 'dream-1',
          })
        );

        act(() => {
          result.current.goToNextStep();
        });

        expect(haptic).toHaveBeenCalledWith('light');
      });
    });

    describe('goToPreviousStep', () => {
      it('goes back to previous step', () => {
        const { result } = renderHook(() =>
          useMobileReflectionFlow({
            ...defaultOptions,
            selectedDreamId: 'dream-1',
          })
        );

        // First advance
        act(() => {
          result.current.goToNextStep();
        });

        expect(result.current.currentStepIndex).toBe(1);

        // Then go back
        act(() => {
          result.current.goToPreviousStep();
        });

        expect(result.current.currentStepIndex).toBe(0);
        expect(result.current.currentStep).toBe('dreamSelect');
      });

      it('sets direction to -1 (backward)', () => {
        const { result } = renderHook(() =>
          useMobileReflectionFlow({
            ...defaultOptions,
            selectedDreamId: 'dream-1',
          })
        );

        // Advance then go back
        act(() => {
          result.current.goToNextStep();
        });
        act(() => {
          result.current.goToPreviousStep();
        });

        expect(result.current.direction).toBe(-1);
      });

      it('does not go past first step', () => {
        const { result } = renderHook(() => useMobileReflectionFlow(defaultOptions));

        act(() => {
          result.current.goToPreviousStep();
        });

        expect(result.current.currentStepIndex).toBe(0);
        expect(result.current.currentStep).toBe('dreamSelect');
      });

      it('triggers haptic feedback', async () => {
        const { haptic } = await import('@/lib/utils/haptics');
        const { result } = renderHook(() =>
          useMobileReflectionFlow({
            ...defaultOptions,
            selectedDreamId: 'dream-1',
          })
        );

        // Advance first
        act(() => {
          result.current.goToNextStep();
        });

        vi.clearAllMocks();

        // Then go back
        act(() => {
          result.current.goToPreviousStep();
        });

        expect(haptic).toHaveBeenCalledWith('light');
      });
    });

    describe('navigation sequence', () => {
      it('can navigate through all steps', () => {
        const { result } = renderHook(() =>
          useMobileReflectionFlow({
            ...defaultOptions,
            selectedDreamId: 'dream-1',
            formData: createMockFormData(),
          })
        );

        const expectedSteps = ['dreamSelect', 'q1', 'q2', 'q3', 'q4', 'tone'];

        expectedSteps.forEach((expectedStep, index) => {
          expect(result.current.currentStepIndex).toBe(index);
          expect(result.current.currentStep).toBe(expectedStep);

          if (index < expectedSteps.length - 1) {
            act(() => {
              result.current.goToNextStep();
            });
          }
        });
      });

      it('can navigate backwards through all steps', () => {
        const { result } = renderHook(() =>
          useMobileReflectionFlow({
            ...defaultOptions,
            selectedDreamId: 'dream-1',
            formData: createMockFormData(),
          })
        );

        // Go to last step
        act(() => {
          for (let i = 0; i < 5; i++) {
            result.current.goToNextStep();
          }
        });

        expect(result.current.currentStep).toBe('tone');

        // Go back to first step
        const expectedSteps = ['tone', 'q4', 'q3', 'q2', 'q1', 'dreamSelect'];

        expectedSteps.forEach((expectedStep, index) => {
          expect(result.current.currentStep).toBe(expectedStep);

          if (index < expectedSteps.length - 1) {
            act(() => {
              result.current.goToPreviousStep();
            });
          }
        });
      });
    });
  });

  // ============================================
  // SWIPE HANDLING TESTS
  // ============================================
  describe('swipe handling (handleDragEnd)', () => {
    const createPanInfo = (offsetX: number, velocityX: number) =>
      ({
        offset: { x: offsetX, y: 0 },
        velocity: { x: velocityX, y: 0 },
      }) as any;

    describe('advance on left swipe', () => {
      it('advances when offset exceeds threshold', () => {
        const { result } = renderHook(() =>
          useMobileReflectionFlow({
            ...defaultOptions,
            selectedDreamId: 'dream-1',
          })
        );

        act(() => {
          result.current.handleDragEnd({} as MouseEvent, createPanInfo(-60, 0));
        });

        expect(result.current.currentStepIndex).toBe(1);
      });

      it('advances when velocity exceeds threshold', () => {
        const { result } = renderHook(() =>
          useMobileReflectionFlow({
            ...defaultOptions,
            selectedDreamId: 'dream-1',
          })
        );

        act(() => {
          result.current.handleDragEnd({} as MouseEvent, createPanInfo(-10, -400));
        });

        expect(result.current.currentStepIndex).toBe(1);
      });

      it('does not advance when both thresholds are not met', () => {
        const { result } = renderHook(() =>
          useMobileReflectionFlow({
            ...defaultOptions,
            selectedDreamId: 'dream-1',
          })
        );

        act(() => {
          result.current.handleDragEnd({} as MouseEvent, createPanInfo(-30, -200));
        });

        expect(result.current.currentStepIndex).toBe(0);
      });

      it('does not advance when canGoNext is false', () => {
        const { result } = renderHook(() =>
          useMobileReflectionFlow({
            ...defaultOptions,
            selectedDreamId: '', // No dream selected
          })
        );

        act(() => {
          result.current.handleDragEnd({} as MouseEvent, createPanInfo(-60, 0));
        });

        expect(result.current.currentStepIndex).toBe(0);
      });
    });

    describe('go back on right swipe', () => {
      it('goes back when offset exceeds threshold', () => {
        const { result } = renderHook(() =>
          useMobileReflectionFlow({
            ...defaultOptions,
            selectedDreamId: 'dream-1',
          })
        );

        // First advance
        act(() => {
          result.current.goToNextStep();
        });

        // Then swipe back
        act(() => {
          result.current.handleDragEnd({} as MouseEvent, createPanInfo(60, 0));
        });

        expect(result.current.currentStepIndex).toBe(0);
      });

      it('goes back when velocity exceeds threshold', () => {
        const { result } = renderHook(() =>
          useMobileReflectionFlow({
            ...defaultOptions,
            selectedDreamId: 'dream-1',
          })
        );

        // First advance
        act(() => {
          result.current.goToNextStep();
        });

        // Then swipe back with high velocity
        act(() => {
          result.current.handleDragEnd({} as MouseEvent, createPanInfo(10, 400));
        });

        expect(result.current.currentStepIndex).toBe(0);
      });

      it('does not go back on first step', () => {
        const { result } = renderHook(() =>
          useMobileReflectionFlow({
            ...defaultOptions,
            selectedDreamId: 'dream-1',
          })
        );

        act(() => {
          result.current.handleDragEnd({} as MouseEvent, createPanInfo(60, 0));
        });

        expect(result.current.currentStepIndex).toBe(0);
      });
    });

    describe('textarea focus blocking', () => {
      it('ignores swipe when textarea is focused', () => {
        const { result } = renderHook(() =>
          useMobileReflectionFlow({
            ...defaultOptions,
            selectedDreamId: 'dream-1',
          })
        );

        // Focus textarea
        act(() => {
          result.current.setIsTextareaFocused(true);
        });

        // Try to swipe forward
        act(() => {
          result.current.handleDragEnd({} as MouseEvent, createPanInfo(-60, 0));
        });

        expect(result.current.currentStepIndex).toBe(0);
      });

      it('allows swipe after textarea blur', () => {
        const { result } = renderHook(() =>
          useMobileReflectionFlow({
            ...defaultOptions,
            selectedDreamId: 'dream-1',
          })
        );

        // Focus then blur textarea
        act(() => {
          result.current.setIsTextareaFocused(true);
        });
        act(() => {
          result.current.setIsTextareaFocused(false);
        });

        // Try to swipe forward
        act(() => {
          result.current.handleDragEnd({} as MouseEvent, createPanInfo(-60, 0));
        });

        expect(result.current.currentStepIndex).toBe(1);
      });
    });

    describe('threshold edge cases', () => {
      it('does not advance at exactly threshold (offset=50)', () => {
        const { result } = renderHook(() =>
          useMobileReflectionFlow({
            ...defaultOptions,
            selectedDreamId: 'dream-1',
          })
        );

        act(() => {
          result.current.handleDragEnd({} as MouseEvent, createPanInfo(-50, 0));
        });

        expect(result.current.currentStepIndex).toBe(0);
      });

      it('advances just past threshold (offset=-51)', () => {
        const { result } = renderHook(() =>
          useMobileReflectionFlow({
            ...defaultOptions,
            selectedDreamId: 'dream-1',
          })
        );

        act(() => {
          result.current.handleDragEnd({} as MouseEvent, createPanInfo(-51, 0));
        });

        expect(result.current.currentStepIndex).toBe(1);
      });

      it('does not advance at exactly velocity threshold (velocity=-300)', () => {
        const { result } = renderHook(() =>
          useMobileReflectionFlow({
            ...defaultOptions,
            selectedDreamId: 'dream-1',
          })
        );

        act(() => {
          result.current.handleDragEnd({} as MouseEvent, createPanInfo(0, -300));
        });

        expect(result.current.currentStepIndex).toBe(0);
      });

      it('advances just past velocity threshold (velocity=-301)', () => {
        const { result } = renderHook(() =>
          useMobileReflectionFlow({
            ...defaultOptions,
            selectedDreamId: 'dream-1',
          })
        );

        act(() => {
          result.current.handleDragEnd({} as MouseEvent, createPanInfo(0, -301));
        });

        expect(result.current.currentStepIndex).toBe(1);
      });
    });
  });

  // ============================================
  // TEXTAREA FOCUS STATE TESTS
  // ============================================
  describe('textarea focus state', () => {
    it('updates isTextareaFocused on setIsTextareaFocused(true)', () => {
      const { result } = renderHook(() => useMobileReflectionFlow(defaultOptions));

      act(() => {
        result.current.setIsTextareaFocused(true);
      });

      expect(result.current.isTextareaFocused).toBe(true);
    });

    it('updates isTextareaFocused on setIsTextareaFocused(false)', () => {
      const { result } = renderHook(() => useMobileReflectionFlow(defaultOptions));

      act(() => {
        result.current.setIsTextareaFocused(true);
      });
      act(() => {
        result.current.setIsTextareaFocused(false);
      });

      expect(result.current.isTextareaFocused).toBe(false);
    });
  });

  // ============================================
  // EXIT HANDLING TESTS
  // ============================================
  describe('exit handling', () => {
    describe('handleCloseAttempt', () => {
      it('shows confirmation when form is dirty', () => {
        const { result } = renderHook(() =>
          useMobileReflectionFlow({
            ...defaultOptions,
            formData: partialFormData,
          })
        );

        act(() => {
          result.current.handleCloseAttempt();
        });

        expect(result.current.showExitConfirm).toBe(true);
        expect(mockOnClose).not.toHaveBeenCalled();
      });

      it('closes directly when form is clean', () => {
        const { result } = renderHook(() => useMobileReflectionFlow(defaultOptions));

        act(() => {
          result.current.handleCloseAttempt();
        });

        expect(result.current.showExitConfirm).toBe(false);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });

      it('closes directly for whitespace-only form', () => {
        const { result } = renderHook(() =>
          useMobileReflectionFlow({
            ...defaultOptions,
            formData: whitespaceOnlyFormData,
          })
        );

        act(() => {
          result.current.handleCloseAttempt();
        });

        expect(result.current.showExitConfirm).toBe(false);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    describe('confirmExit', () => {
      it('clears localStorage and closes', () => {
        const { result } = renderHook(() =>
          useMobileReflectionFlow({
            ...defaultOptions,
            formData: partialFormData,
          })
        );

        // Show confirmation first
        act(() => {
          result.current.handleCloseAttempt();
        });

        // Confirm exit
        act(() => {
          result.current.confirmExit();
        });

        expect(localStorageMock.removeItem).toHaveBeenCalledWith('MIRROR_REFLECTION_DRAFT');
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });

      it('works even without showing confirmation first', () => {
        const { result } = renderHook(() => useMobileReflectionFlow(defaultOptions));

        act(() => {
          result.current.confirmExit();
        });

        expect(localStorageMock.removeItem).toHaveBeenCalledWith('MIRROR_REFLECTION_DRAFT');
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    describe('cancelExit', () => {
      it('hides confirmation modal', () => {
        const { result } = renderHook(() =>
          useMobileReflectionFlow({
            ...defaultOptions,
            formData: partialFormData,
          })
        );

        // Show confirmation
        act(() => {
          result.current.handleCloseAttempt();
        });

        expect(result.current.showExitConfirm).toBe(true);

        // Cancel
        act(() => {
          result.current.cancelExit();
        });

        expect(result.current.showExitConfirm).toBe(false);
        expect(mockOnClose).not.toHaveBeenCalled();
      });

      it('can show confirmation again after cancel', () => {
        const { result } = renderHook(() =>
          useMobileReflectionFlow({
            ...defaultOptions,
            formData: partialFormData,
          })
        );

        // Show -> Cancel -> Show again
        act(() => {
          result.current.handleCloseAttempt();
        });
        act(() => {
          result.current.cancelExit();
        });
        act(() => {
          result.current.handleCloseAttempt();
        });

        expect(result.current.showExitConfirm).toBe(true);
      });
    });
  });

  // ============================================
  // REACTIVITY TESTS
  // ============================================
  describe('reactivity to prop changes', () => {
    it('updates isDirty when formData changes', () => {
      const { result, rerender } = renderHook(
        ({ formData }) =>
          useMobileReflectionFlow({
            ...defaultOptions,
            formData,
          }),
        { initialProps: { formData: EMPTY_FORM_DATA } }
      );

      expect(result.current.isDirty).toBe(false);

      rerender({ formData: partialFormData });

      expect(result.current.isDirty).toBe(true);
    });

    it('updates canGoNext when selectedDreamId changes', () => {
      const { result, rerender } = renderHook(
        ({ selectedDreamId }) =>
          useMobileReflectionFlow({
            ...defaultOptions,
            selectedDreamId,
          }),
        { initialProps: { selectedDreamId: '' } }
      );

      expect(result.current.canGoNext()).toBe(false);

      rerender({ selectedDreamId: 'dream-1' });

      expect(result.current.canGoNext()).toBe(true);
    });

    it('updates canGoNext when formData changes on question step', () => {
      const { result, rerender } = renderHook(
        ({ formData }) =>
          useMobileReflectionFlow({
            ...defaultOptions,
            selectedDreamId: 'dream-1',
            formData,
          }),
        { initialProps: { formData: EMPTY_FORM_DATA } }
      );

      // Advance to q1
      act(() => {
        result.current.goToNextStep();
      });

      expect(result.current.canGoNext()).toBe(false);

      rerender({ formData: formProgressScenarios.q1Complete });

      expect(result.current.canGoNext()).toBe(true);
    });
  });

  // ============================================
  // RETURN VALUE COMPLETENESS
  // ============================================
  describe('return value completeness', () => {
    it('returns all expected state properties', () => {
      const { result } = renderHook(() => useMobileReflectionFlow(defaultOptions));

      expect(result.current).toHaveProperty('currentStepIndex');
      expect(result.current).toHaveProperty('currentStep');
      expect(result.current).toHaveProperty('direction');
      expect(result.current).toHaveProperty('isTextareaFocused');
      expect(result.current).toHaveProperty('showExitConfirm');
      expect(result.current).toHaveProperty('isDirty');
      expect(result.current).toHaveProperty('totalSteps');
    });

    it('returns all expected action functions', () => {
      const { result } = renderHook(() => useMobileReflectionFlow(defaultOptions));

      expect(typeof result.current.goToNextStep).toBe('function');
      expect(typeof result.current.goToPreviousStep).toBe('function');
      expect(typeof result.current.canGoNext).toBe('function');
      expect(typeof result.current.handleDragEnd).toBe('function');
      expect(typeof result.current.setIsTextareaFocused).toBe('function');
      expect(typeof result.current.handleCloseAttempt).toBe('function');
      expect(typeof result.current.confirmExit).toBe('function');
      expect(typeof result.current.cancelExit).toBe('function');
    });
  });
});
