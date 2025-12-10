# Code Patterns & Conventions

## File Structure

```
mirror-of-dreams/
├── components/
│   └── reflection/
│       └── mobile/
│           ├── MobileReflectionFlow.tsx    # REFACTOR - Main orchestrator
│           ├── QuestionStep.tsx            # EXISTING - Use as-is
│           ├── ToneStep.tsx                # EXISTING - Use as-is
│           ├── ExitConfirmation.tsx        # EXISTING - Use as-is
│           ├── GazingOverlay.tsx           # EXISTING - Use as-is
│           ├── __tests__/
│           │   └── MobileReflectionFlow.test.tsx  # NEW - Integration tests
│           └── views/
│               ├── MobileDreamSelectionView.tsx   # NEW - Dream selection
│               └── __tests__/
│                   └── MobileDreamSelectionView.test.tsx  # NEW
├── hooks/
│   ├── useMobileReflectionFlow.ts          # NEW - Wizard state hook
│   ├── index.ts                            # MODIFY - Export new hook
│   └── __tests__/
│       └── useMobileReflectionFlow.test.ts # NEW - Hook tests
├── lib/
│   └── reflection/
│       ├── constants.ts                    # EXISTING - Import from here
│       └── types.ts                        # EXISTING - Import from here
└── test/
    └── fixtures/
        ├── dreams.ts                       # EXISTING - Use as-is
        └── form-data.ts                    # NEW - Form data factories
```

## Naming Conventions

- Components: PascalCase (`MobileDreamSelectionView.tsx`)
- Hooks: camelCase with `use` prefix (`useMobileReflectionFlow.ts`)
- Types/Interfaces: PascalCase (`UseMobileReflectionFlowReturn`)
- Constants: SCREAMING_SNAKE_CASE (`WIZARD_STEPS`)
- Test files: `*.test.ts` or `*.test.tsx`

## Import Order Convention

```typescript
// 1. React and framework imports
'use client';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. Third-party libraries
import { motion, AnimatePresence, PanInfo, useReducedMotion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';

// 3. Internal components (absolute imports)
import { QuestionStep } from '@/components/reflection/mobile/QuestionStep';
import { ToneStep } from '@/components/reflection/mobile/ToneStep';
import { ExitConfirmation } from '@/components/reflection/mobile/ExitConfirmation';
import { GazingOverlay } from '@/components/reflection/mobile/GazingOverlay';
import { GlowButton } from '@/components/ui/glass';
import { ProgressOrbs } from '@/components/ui/glass/ProgressOrbs';

// 4. Internal hooks
import { useMobileReflectionFlow } from '@/hooks/useMobileReflectionFlow';
import { useKeyboardHeight } from '@/hooks';

// 5. Contexts
import { useHideBottomNav } from '@/contexts/NavigationContext';

// 6. Utilities and constants
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/utils/haptics';
import { QUESTIONS, CATEGORY_EMOJI, STORAGE_KEY } from '@/lib/reflection/constants';
import { stepTransitionVariants } from '@/lib/animations/variants';

// 7. Types (always last, type-only imports)
import type { ToneId } from '@/lib/utils/constants';
import type { FormData, Dream } from '@/lib/reflection/types';
```

---

## Hook Patterns

### useMobileReflectionFlow Hook Structure

**File:** `hooks/useMobileReflectionFlow.ts`

```typescript
'use client';

import { useState, useCallback, useMemo } from 'react';
import type { PanInfo } from 'framer-motion';

import { haptic } from '@/lib/utils/haptics';
import { QUESTIONS, STORAGE_KEY } from '@/lib/reflection/constants';
import type { FormData } from '@/lib/reflection/types';

// Wizard step definitions
export const WIZARD_STEPS = ['dreamSelect', 'q1', 'q2', 'q3', 'q4', 'tone'] as const;
export type WizardStep = (typeof WIZARD_STEPS)[number];

// Swipe thresholds
const SWIPE_THRESHOLD = 50;
const VELOCITY_THRESHOLD = 300;

export interface UseMobileReflectionFlowOptions {
  selectedDreamId: string;
  formData: FormData;
  onClose: () => void;
}

export interface UseMobileReflectionFlowReturn {
  // State
  currentStepIndex: number;
  currentStep: WizardStep;
  direction: number;
  isTextareaFocused: boolean;
  showExitConfirm: boolean;
  isDirty: boolean;
  totalSteps: number;

  // Actions
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  canGoNext: () => boolean;
  handleDragEnd: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
  setIsTextareaFocused: (focused: boolean) => void;
  handleCloseAttempt: () => void;
  confirmExit: () => void;
  cancelExit: () => void;
}

export function useMobileReflectionFlow({
  selectedDreamId,
  formData,
  onClose,
}: UseMobileReflectionFlowOptions): UseMobileReflectionFlowReturn {
  // Step state
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Derived state
  const currentStep = WIZARD_STEPS[currentStepIndex];
  const totalSteps = WIZARD_STEPS.length;

  // Dirty form detection
  const isDirty = useMemo(() => {
    return Object.values(formData).some((value) => value.trim().length > 0);
  }, [formData]);

  // Can advance check
  const canGoNext = useCallback((): boolean => {
    if (currentStep === 'dreamSelect') {
      return !!selectedDreamId;
    }
    if (currentStep === 'tone') {
      return true; // Tone has default selection
    }
    // Question steps require content
    const questionIndex = currentStepIndex - 1;
    if (questionIndex >= 0 && questionIndex < QUESTIONS.length) {
      const field = QUESTIONS[questionIndex].id;
      return formData[field].trim().length > 0;
    }
    return true;
  }, [currentStep, selectedDreamId, currentStepIndex, formData]);

  // Navigation
  const goToNextStep = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      setDirection(1);
      setCurrentStepIndex((prev) => prev + 1);
      haptic('light');
    }
  }, [currentStepIndex, totalSteps]);

  const goToPreviousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setDirection(-1);
      setCurrentStepIndex((prev) => prev - 1);
      haptic('light');
    }
  }, [currentStepIndex]);

  // Swipe handler
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (isTextareaFocused) return;

      const shouldAdvance =
        info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -VELOCITY_THRESHOLD;
      const shouldGoBack =
        info.offset.x > SWIPE_THRESHOLD || info.velocity.x > VELOCITY_THRESHOLD;

      if (shouldAdvance && canGoNext()) {
        goToNextStep();
      } else if (shouldGoBack && currentStepIndex > 0) {
        goToPreviousStep();
      }
    },
    [isTextareaFocused, canGoNext, goToNextStep, goToPreviousStep, currentStepIndex]
  );

  // Exit handling
  const handleCloseAttempt = useCallback(() => {
    if (isDirty) {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  const confirmExit = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    onClose();
  }, [onClose]);

  const cancelExit = useCallback(() => {
    setShowExitConfirm(false);
  }, []);

  return {
    // State
    currentStepIndex,
    currentStep,
    direction,
    isTextareaFocused,
    showExitConfirm,
    isDirty,
    totalSteps,

    // Actions
    goToNextStep,
    goToPreviousStep,
    canGoNext,
    handleDragEnd,
    setIsTextareaFocused,
    handleCloseAttempt,
    confirmExit,
    cancelExit,
  };
}
```

---

## Component Patterns

### MobileDreamSelectionView Component Structure

**File:** `components/reflection/mobile/views/MobileDreamSelectionView.tsx`

```typescript
'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { GlowButton } from '@/components/ui/glass';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/utils/haptics';
import { CATEGORY_EMOJI } from '@/lib/reflection/constants';

export interface Dream {
  id: string;
  title: string;
  description?: string;
  category?: string;
}

interface MobileDreamSelectionViewProps {
  dreams: Dream[];
  selectedDreamId: string;
  onDreamSelect: (dream: Dream) => void;
}

/**
 * MobileDreamSelectionView - Full-screen dream selection step for mobile wizard
 *
 * Features:
 * - Large touch targets for dream selection
 * - Category emoji display
 * - Selection indicator
 * - Empty state with CTA to create dreams
 */
export function MobileDreamSelectionView({
  dreams,
  selectedDreamId,
  onDreamSelect,
}: MobileDreamSelectionViewProps) {
  const router = useRouter();

  const handleDreamClick = (dream: Dream) => {
    haptic('light');
    onDreamSelect(dream);
  };

  return (
    <div className="pb-safe flex h-full flex-col px-6 pt-4">
      <h2 className="mb-8 text-center text-2xl font-light text-white">
        Which dream are you reflecting on?
      </h2>

      <div className="flex-1 space-y-3 overflow-y-auto">
        {dreams.length > 0 ? (
          dreams.map((dream) => {
            const isSelected = dream.id === selectedDreamId;
            const emoji = CATEGORY_EMOJI[dream.category || 'other'] || CATEGORY_EMOJI.other;

            return (
              <motion.button
                key={dream.id}
                onClick={() => handleDreamClick(dream)}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'flex w-full items-center gap-4 p-4',
                  'min-h-[60px] rounded-2xl',
                  'transition-colors duration-200',
                  isSelected
                    ? 'border border-purple-500/50 bg-purple-500/20'
                    : 'border border-white/10 bg-white/5 active:bg-white/10'
                )}
                data-testid={`dream-card-${dream.id}`}
              >
                <span className="text-2xl" role="img" aria-label={dream.category || 'dream'}>
                  {emoji}
                </span>
                <div className="flex-1 text-left">
                  <h3 className="truncate font-medium text-white">{dream.title}</h3>
                  {dream.description && (
                    <p className="mt-0.5 truncate text-sm text-white/60">{dream.description}</p>
                  )}
                </div>
                {isSelected && (
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500"
                    data-testid="selection-indicator"
                  >
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
              </motion.button>
            );
          })
        ) : (
          <div className="py-8 text-center" data-testid="empty-state">
            <p className="mb-6 text-white/70">No active dreams yet.</p>
            <GlowButton variant="primary" size="md" onClick={() => router.push('/dreams')}>
              Create Your First Dream
            </GlowButton>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### Refactored MobileReflectionFlow Orchestrator Pattern

**File:** `components/reflection/mobile/MobileReflectionFlow.tsx`

```typescript
'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import React, { useCallback, useEffect } from 'react';

// Components
import { QuestionStep } from './QuestionStep';
import { ToneStep } from './ToneStep';
import { ExitConfirmation } from './ExitConfirmation';
import { GazingOverlay } from './GazingOverlay';
import { MobileDreamSelectionView } from './views/MobileDreamSelectionView';
import { ProgressOrbs } from '@/components/ui/glass/ProgressOrbs';

// Hooks
import { useMobileReflectionFlow, WIZARD_STEPS } from '@/hooks/useMobileReflectionFlow';
import { useKeyboardHeight } from '@/hooks';
import { useHideBottomNav } from '@/contexts/NavigationContext';

// Utilities
import { stepTransitionVariants } from '@/lib/animations/variants';
import { QUESTIONS, STORAGE_KEY } from '@/lib/reflection/constants';

// Types
import type { ToneId } from '@/lib/utils/constants';

export interface FormData {
  dream: string;
  plan: string;
  relationship: string;
  offering: string;
}

export interface Dream {
  id: string;
  title: string;
  description?: string;
  targetDate?: string | null;
  daysLeft?: number | null;
  category?: string;
}

export interface MobileReflectionFlowProps {
  dreams: Dream[];
  selectedDreamId: string;
  onDreamSelect: (dream: Dream) => void;
  formData: FormData;
  onFieldChange: (field: keyof FormData, value: string) => void;
  selectedTone: ToneId;
  onToneSelect: (tone: ToneId) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  onClose: () => void;
}

export function MobileReflectionFlow({
  dreams,
  selectedDreamId,
  onDreamSelect,
  formData,
  onFieldChange,
  selectedTone,
  onToneSelect,
  onSubmit,
  isSubmitting,
  onClose,
}: MobileReflectionFlowProps) {
  const prefersReducedMotion = useReducedMotion();
  const keyboardHeight = useKeyboardHeight();

  // Hide bottom navigation
  useHideBottomNav();

  // Wizard state management
  const flow = useMobileReflectionFlow({
    selectedDreamId,
    formData,
    onClose,
  });

  // Browser back/refresh prevention
  useEffect(() => {
    if (!flow.isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [flow.isDirty]);

  // Handle dream selection with auto-advance
  const handleDreamSelection = useCallback(
    (dream: Dream) => {
      onDreamSelect(dream);
      setTimeout(() => {
        flow.goToNextStep();
      }, 300);
    },
    [onDreamSelect, flow]
  );

  // Handle final submit
  const handleFinalSubmit = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    onSubmit();
  }, [onSubmit]);

  // Render step content
  const renderStepContent = () => {
    switch (flow.currentStep) {
      case 'dreamSelect':
        return (
          <MobileDreamSelectionView
            dreams={dreams}
            selectedDreamId={selectedDreamId}
            onDreamSelect={handleDreamSelection}
          />
        );

      case 'q1':
      case 'q2':
      case 'q3':
      case 'q4': {
        const questionIndex = flow.currentStepIndex - 1;
        const question = QUESTIONS[questionIndex];

        return (
          <QuestionStep
            questionNumber={question.number}
            totalQuestions={QUESTIONS.length}
            questionText={question.text}
            guidingText={question.guide}
            placeholder={question.placeholder}
            value={formData[question.id]}
            onChange={(value) => onFieldChange(question.id, value)}
            maxLength={question.limit}
            onNext={flow.goToNextStep}
            onPrevious={flow.goToPreviousStep}
            canGoNext={flow.canGoNext()}
            canGoPrevious={flow.currentStepIndex > 0}
            onFocus={() => flow.setIsTextareaFocused(true)}
            onBlur={() => flow.setIsTextareaFocused(false)}
            keyboardHeight={keyboardHeight}
          />
        );
      }

      case 'tone':
        return (
          <ToneStep
            selectedTone={selectedTone}
            onSelect={onToneSelect}
            onPrevious={flow.goToPreviousStep}
            onSubmit={handleFinalSubmit}
            canGoPrevious={true}
            isSubmitting={isSubmitting}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-mirror-void-deep">
      {/* Header */}
      <div className="pt-safe flex items-center justify-between border-b border-white/10 px-4 pb-4">
        <button
          onClick={flow.handleCloseAttempt}
          className="-m-2 p-2 text-white/60 transition-colors hover:text-white"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>
        <ProgressOrbs currentStep={flow.currentStepIndex} steps={flow.totalSteps} />
        <div className="w-10" />
      </div>

      {/* Step Content with swipe */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait" custom={flow.direction}>
          <motion.div
            key={flow.currentStepIndex}
            custom={flow.direction}
            variants={!prefersReducedMotion ? stepTransitionVariants : undefined}
            initial={!prefersReducedMotion ? 'enter' : undefined}
            animate={!prefersReducedMotion ? 'center' : undefined}
            exit={!prefersReducedMotion ? 'exit' : undefined}
            drag={flow.isTextareaFocused ? false : 'x'}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.5}
            onDragEnd={flow.handleDragEnd}
            className="absolute inset-0"
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Gazing Overlay */}
      <GazingOverlay isVisible={isSubmitting} variant="simple" />

      {/* Exit Confirmation */}
      <ExitConfirmation
        isOpen={flow.showExitConfirm}
        onConfirm={flow.confirmExit}
        onCancel={flow.cancelExit}
      />
    </div>
  );
}

export default MobileReflectionFlow;
```

---

## Testing Patterns

### Test File Structure

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('ModuleName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('featureName', () => {
    it('should handle normal case', () => {
      // Arrange
      // Act
      // Assert
    });

    it('should handle edge case', () => {
      // ...
    });
  });
});
```

### Hook Testing Pattern

**File:** `hooks/__tests__/useMobileReflectionFlow.test.ts`

```typescript
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useMobileReflectionFlow, WIZARD_STEPS } from '../useMobileReflectionFlow';
import { EMPTY_FORM_DATA } from '@/lib/reflection/constants';

// Mock haptics
vi.mock('@/lib/utils/haptics', () => ({
  haptic: vi.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useMobileReflectionFlow', () => {
  const mockOnClose = vi.fn();
  const defaultOptions = {
    selectedDreamId: '',
    formData: { ...EMPTY_FORM_DATA },
    onClose: mockOnClose,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe('initialization', () => {
    it('initializes at first step (dreamSelect)', () => {
      const { result } = renderHook(() => useMobileReflectionFlow(defaultOptions));

      expect(result.current.currentStepIndex).toBe(0);
      expect(result.current.currentStep).toBe('dreamSelect');
      expect(result.current.direction).toBe(0);
      expect(result.current.isTextareaFocused).toBe(false);
      expect(result.current.showExitConfirm).toBe(false);
    });

    it('calculates isDirty correctly for empty form', () => {
      const { result } = renderHook(() => useMobileReflectionFlow(defaultOptions));

      expect(result.current.isDirty).toBe(false);
    });

    it('calculates isDirty correctly for filled form', () => {
      const { result } = renderHook(() =>
        useMobileReflectionFlow({
          ...defaultOptions,
          formData: { dream: 'My dream', plan: '', relationship: '', offering: '' },
        })
      );

      expect(result.current.isDirty).toBe(true);
    });
  });

  describe('canGoNext', () => {
    it('returns false on dreamSelect step without selection', () => {
      const { result } = renderHook(() => useMobileReflectionFlow(defaultOptions));

      expect(result.current.canGoNext()).toBe(false);
    });

    it('returns true on dreamSelect step with selection', () => {
      const { result } = renderHook(() =>
        useMobileReflectionFlow({
          ...defaultOptions,
          selectedDreamId: 'dream-1',
        })
      );

      expect(result.current.canGoNext()).toBe(true);
    });

    it('returns false on question step without content', () => {
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

    it('returns true on question step with content', () => {
      const { result } = renderHook(() =>
        useMobileReflectionFlow({
          ...defaultOptions,
          selectedDreamId: 'dream-1',
          formData: { dream: 'My dream content', plan: '', relationship: '', offering: '' },
        })
      );

      // Advance to q1
      act(() => {
        result.current.goToNextStep();
      });

      expect(result.current.currentStep).toBe('q1');
      expect(result.current.canGoNext()).toBe(true);
    });

    it('returns true on tone step (has default)', () => {
      const { result } = renderHook(() =>
        useMobileReflectionFlow({
          ...defaultOptions,
          selectedDreamId: 'dream-1',
          formData: { dream: 'a', plan: 'b', relationship: 'c', offering: 'd' },
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

  describe('navigation', () => {
    it('advances to next step with goToNextStep', () => {
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
      expect(result.current.direction).toBe(1);
    });

    it('goes back with goToPreviousStep', () => {
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

      expect(result.current.currentStepIndex).toBe(0);
      expect(result.current.currentStep).toBe('dreamSelect');
      expect(result.current.direction).toBe(-1);
    });

    it('does not go past first step', () => {
      const { result } = renderHook(() => useMobileReflectionFlow(defaultOptions));

      act(() => {
        result.current.goToPreviousStep();
      });

      expect(result.current.currentStepIndex).toBe(0);
    });

    it('does not go past last step', () => {
      const { result } = renderHook(() =>
        useMobileReflectionFlow({
          ...defaultOptions,
          selectedDreamId: 'dream-1',
          formData: { dream: 'a', plan: 'b', relationship: 'c', offering: 'd' },
        })
      );

      // Advance to last step
      act(() => {
        for (let i = 0; i < WIZARD_STEPS.length; i++) {
          result.current.goToNextStep();
        }
      });

      // Try to go further
      act(() => {
        result.current.goToNextStep();
      });

      expect(result.current.currentStepIndex).toBe(WIZARD_STEPS.length - 1);
    });
  });

  describe('swipe handling', () => {
    it('advances on left swipe when canGoNext', () => {
      const { result } = renderHook(() =>
        useMobileReflectionFlow({
          ...defaultOptions,
          selectedDreamId: 'dream-1',
        })
      );

      act(() => {
        result.current.handleDragEnd({} as MouseEvent, {
          offset: { x: -60, y: 0 },
          velocity: { x: 0, y: 0 },
        } as any);
      });

      expect(result.current.currentStepIndex).toBe(1);
    });

    it('goes back on right swipe', () => {
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
        result.current.handleDragEnd({} as MouseEvent, {
          offset: { x: 60, y: 0 },
          velocity: { x: 0, y: 0 },
        } as any);
      });

      expect(result.current.currentStepIndex).toBe(0);
    });

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

      // Try to swipe
      act(() => {
        result.current.handleDragEnd({} as MouseEvent, {
          offset: { x: -60, y: 0 },
          velocity: { x: 0, y: 0 },
        } as any);
      });

      expect(result.current.currentStepIndex).toBe(0);
    });

    it('handles high velocity swipe', () => {
      const { result } = renderHook(() =>
        useMobileReflectionFlow({
          ...defaultOptions,
          selectedDreamId: 'dream-1',
        })
      );

      act(() => {
        result.current.handleDragEnd({} as MouseEvent, {
          offset: { x: -10, y: 0 },
          velocity: { x: -400, y: 0 },
        } as any);
      });

      expect(result.current.currentStepIndex).toBe(1);
    });
  });

  describe('exit handling', () => {
    it('shows confirmation when form is dirty', () => {
      const { result } = renderHook(() =>
        useMobileReflectionFlow({
          ...defaultOptions,
          formData: { dream: 'content', plan: '', relationship: '', offering: '' },
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

    it('confirmExit clears localStorage and closes', () => {
      const { result } = renderHook(() =>
        useMobileReflectionFlow({
          ...defaultOptions,
          formData: { dream: 'content', plan: '', relationship: '', offering: '' },
        })
      );

      act(() => {
        result.current.handleCloseAttempt();
      });
      act(() => {
        result.current.confirmExit();
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('MIRROR_REFLECTION_DRAFT');
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('cancelExit hides confirmation modal', () => {
      const { result } = renderHook(() =>
        useMobileReflectionFlow({
          ...defaultOptions,
          formData: { dream: 'content', plan: '', relationship: '', offering: '' },
        })
      );

      act(() => {
        result.current.handleCloseAttempt();
      });
      act(() => {
        result.current.cancelExit();
      });

      expect(result.current.showExitConfirm).toBe(false);
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });
});
```

### Component Testing Pattern

**File:** `components/reflection/mobile/views/__tests__/MobileDreamSelectionView.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { MobileDreamSelectionView } from '../MobileDreamSelectionView';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock haptics
vi.mock('@/lib/utils/haptics', () => ({
  haptic: vi.fn(),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, onClick, className, ...props }: any) => (
      <button onClick={onClick} className={className} {...props}>
        {children}
      </button>
    ),
  },
}));

describe('MobileDreamSelectionView', () => {
  const mockOnDreamSelect = vi.fn();
  const mockDreams = [
    { id: 'dream-1', title: 'Learn Guitar', description: 'Master basic chords', category: 'creative' },
    { id: 'dream-2', title: 'Run Marathon', description: 'Complete 42km', category: 'health' },
    { id: 'dream-3', title: 'Start Business', category: 'career' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the heading', () => {
      render(
        <MobileDreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );

      expect(screen.getByText('Which dream are you reflecting on?')).toBeInTheDocument();
    });

    it('renders all dreams', () => {
      render(
        <MobileDreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );

      expect(screen.getByText('Learn Guitar')).toBeInTheDocument();
      expect(screen.getByText('Run Marathon')).toBeInTheDocument();
      expect(screen.getByText('Start Business')).toBeInTheDocument();
    });

    it('renders dream descriptions when provided', () => {
      render(
        <MobileDreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );

      expect(screen.getByText('Master basic chords')).toBeInTheDocument();
      expect(screen.getByText('Complete 42km')).toBeInTheDocument();
    });

    it('renders category emoji', () => {
      render(
        <MobileDreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );

      // Check for emoji elements
      const emojiElements = screen.getAllByRole('img');
      expect(emojiElements.length).toBeGreaterThan(0);
    });
  });

  describe('empty state', () => {
    it('renders empty state when no dreams', () => {
      render(
        <MobileDreamSelectionView
          dreams={[]}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No active dreams yet.')).toBeInTheDocument();
      expect(screen.getByText('Create Your First Dream')).toBeInTheDocument();
    });
  });

  describe('selection', () => {
    it('calls onDreamSelect when dream clicked', () => {
      render(
        <MobileDreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );

      fireEvent.click(screen.getByTestId('dream-card-dream-1'));

      expect(mockOnDreamSelect).toHaveBeenCalledTimes(1);
      expect(mockOnDreamSelect).toHaveBeenCalledWith(mockDreams[0]);
    });

    it('shows selection indicator for selected dream', () => {
      render(
        <MobileDreamSelectionView
          dreams={mockDreams}
          selectedDreamId="dream-1"
          onDreamSelect={mockOnDreamSelect}
        />
      );

      expect(screen.getByTestId('selection-indicator')).toBeInTheDocument();
    });

    it('does not show selection indicator for unselected dreams', () => {
      render(
        <MobileDreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );

      expect(screen.queryByTestId('selection-indicator')).not.toBeInTheDocument();
    });

    it('applies selected styling to selected dream', () => {
      render(
        <MobileDreamSelectionView
          dreams={mockDreams}
          selectedDreamId="dream-1"
          onDreamSelect={mockOnDreamSelect}
        />
      );

      const selectedCard = screen.getByTestId('dream-card-dream-1');
      expect(selectedCard).toHaveClass('bg-purple-500/20');
    });
  });
});
```

### Integration Test Pattern

**File:** `components/reflection/mobile/__tests__/MobileReflectionFlow.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import MobileReflectionFlow from '../MobileReflectionFlow';

// Mock all external dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/hooks', () => ({
  useKeyboardHeight: () => 0,
}));

vi.mock('@/contexts/NavigationContext', () => ({
  useHideBottomNav: vi.fn(),
}));

vi.mock('@/lib/utils/haptics', () => ({
  haptic: vi.fn(),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, onClick, ...props }: any) => (
      <button onClick={onClick} {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: any) => children,
  useReducedMotion: () => true, // Disable animations in tests
}));

describe('MobileReflectionFlow', () => {
  const mockDreams = [
    { id: 'dream-1', title: 'Learn Guitar', category: 'creative' },
    { id: 'dream-2', title: 'Run Marathon', category: 'health' },
  ];

  const defaultProps = {
    dreams: mockDreams,
    selectedDreamId: '',
    onDreamSelect: vi.fn(),
    formData: { dream: '', plan: '', relationship: '', offering: '' },
    onFieldChange: vi.fn(),
    selectedTone: 'fusion' as const,
    onToneSelect: vi.fn(),
    onSubmit: vi.fn(),
    isSubmitting: false,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('rendering', () => {
    it('renders initial dream selection step', () => {
      render(<MobileReflectionFlow {...defaultProps} />);

      expect(screen.getByText('Which dream are you reflecting on?')).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(<MobileReflectionFlow {...defaultProps} />);

      expect(screen.getByLabelText('Close')).toBeInTheDocument();
    });

    it('renders progress indicator', () => {
      render(<MobileReflectionFlow {...defaultProps} />);

      // ProgressOrbs should be present
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });
  });

  describe('wizard flow', () => {
    it('advances to question step after dream selection', async () => {
      const onDreamSelect = vi.fn();
      render(<MobileReflectionFlow {...defaultProps} onDreamSelect={onDreamSelect} />);

      fireEvent.click(screen.getByTestId('dream-card-dream-1'));

      await waitFor(() => {
        expect(onDreamSelect).toHaveBeenCalledWith(mockDreams[0]);
      });
    });
  });

  describe('exit confirmation', () => {
    it('shows confirmation when closing with dirty form', async () => {
      render(
        <MobileReflectionFlow
          {...defaultProps}
          formData={{ dream: 'content', plan: '', relationship: '', offering: '' }}
        />
      );

      fireEvent.click(screen.getByLabelText('Close'));

      await waitFor(() => {
        expect(screen.getByText('Leave reflection?')).toBeInTheDocument();
      });
    });

    it('closes directly when form is clean', async () => {
      const onClose = vi.fn();
      render(<MobileReflectionFlow {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByLabelText('Close'));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('gazing overlay', () => {
    it('shows overlay when isSubmitting is true', () => {
      render(<MobileReflectionFlow {...defaultProps} isSubmitting={true} />);

      // GazingOverlay should be visible
      expect(screen.getByText(/gazing|reflecting|crafting|weaving/i)).toBeInTheDocument();
    });
  });
});
```

---

## Test Data Factories

**File:** `test/fixtures/form-data.ts`

```typescript
// test/fixtures/form-data.ts - Form data test fixtures

import type { FormData } from '@/lib/reflection/types';

/**
 * Empty form data - default state
 */
export const EMPTY_FORM_DATA: FormData = {
  dream: '',
  plan: '',
  relationship: '',
  offering: '',
};

/**
 * Creates mock form data with sensible defaults
 */
export const createMockFormData = (overrides: Partial<FormData> = {}): FormData => ({
  dream: 'My dream is to learn guitar and play my favorite songs',
  plan: 'I will practice 30 minutes daily and take weekly lessons',
  relationship: 'This dream connects to my creative expression and inner peace',
  offering: 'I am willing to sacrifice TV time and invest in equipment',
  ...overrides,
});

/**
 * Partially filled form - typical in-progress state
 */
export const partialFormData = createMockFormData({
  dream: 'Started writing about my dream',
  plan: '',
  relationship: '',
  offering: '',
});

/**
 * Minimal valid form - bare minimum content
 */
export const minimalFormData = createMockFormData({
  dream: 'a',
  plan: 'b',
  relationship: 'c',
  offering: 'd',
});

/**
 * Long content form - for testing limits
 */
export const longContentFormData = createMockFormData({
  dream: 'A'.repeat(500),
  plan: 'B'.repeat(500),
  relationship: 'C'.repeat(500),
  offering: 'D'.repeat(500),
});
```

---

## Mocking Patterns

### LocalStorage Mock

```typescript
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
```

### Framer Motion Mock

```typescript
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, onClick, ...props }: any) => (
      <button onClick={onClick} {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: any) => children,
  useReducedMotion: () => true,
}));
```

### Next.js Navigation Mock

```typescript
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));
```

---

## Error Handling Patterns

### User-Facing Errors

```typescript
// In components, show toast or inline error
const handleError = (error: Error) => {
  console.error('Reflection flow error:', error);
  // Don't expose internal errors to users
};
```

### Form Validation

```typescript
// Validation is per-step, handled by canGoNext
const canGoNext = useCallback((): boolean => {
  if (currentStep === 'dreamSelect') {
    return !!selectedDreamId;
  }
  // Question steps require non-empty content
  const field = QUESTIONS[questionIndex].id;
  return formData[field].trim().length > 0;
}, [currentStep, selectedDreamId, formData]);
```

---

## Coverage Expectations

| Module Type | Minimum Coverage | Target Coverage |
|-------------|------------------|-----------------|
| Hooks (useMobileReflectionFlow) | 85% | 90% |
| View Components (MobileDreamSelectionView) | 75% | 80% |
| Orchestrator (MobileReflectionFlow) | 75% | 80% |

---

## Security Patterns

### LocalStorage Handling

```typescript
// Always use shared constant for storage key
import { STORAGE_KEY } from '@/lib/reflection/constants';

// Clear on exit
localStorage.removeItem(STORAGE_KEY);

// Clear on successful submit
localStorage.removeItem(STORAGE_KEY);
```

### Input Sanitization

Input sanitization is handled by:
1. GlassInput component (maxLength enforcement)
2. QUESTION_LIMITS constants
3. Server-side validation in tRPC procedures (out of scope for this refactoring)
