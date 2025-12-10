# Explorer 1 Report: Architecture & Structure Analysis

**Focus Area:** MobileReflectionFlow.tsx Refactoring  
**Component Lines:** 812 lines (target: < 300 lines)  
**Current Test Coverage:** 0%  
**Target Coverage:** 80%

---

## Executive Summary

MobileReflectionFlow.tsx is a 812-line mega-component that handles the entire mobile reflection wizard experience. The component has significant structural duplication with existing extracted components (QuestionStep.tsx, ToneStep.tsx, ExitConfirmation.tsx, GazingOverlay.tsx, DreamBottomSheet.tsx) that are already defined but **not used by MobileReflectionFlow.tsx**. The refactoring strategy is clear: replace inline implementations with existing components and extract wizard state management into a dedicated hook.

The desktop counterpart (MirrorExperience.tsx) demonstrates the target pattern: thin orchestrator component using `useReflectionForm` and `useReflectionViewMode` hooks with view components. MobileReflectionFlow should follow this pattern with a new `useMobileReflectionFlow` hook for wizard-specific state.

---

## Current Component Analysis

### File Location
`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/mobile/MobileReflectionFlow.tsx`

### Component Structure

```
MobileReflectionFlow (812 lines)
├── Props Interface (lines 47-58)
│   └── Receives: dreams, selectedDreamId, onDreamSelect, formData, 
│       onFieldChange, selectedTone, onToneSelect, onSubmit, isSubmitting, onClose
│
├── Constants (lines 60-130)
│   ├── WIZARD_STEPS array
│   ├── QUESTIONS array (duplicated from lib/reflection/constants.ts)
│   ├── STATUS_MESSAGES (duplicated from GazingOverlay.tsx)
│   ├── STORAGE_KEY (duplicated from lib/reflection/constants.ts)
│   └── CATEGORY_EMOJI (duplicated from lib/reflection/constants.ts)
│
├── State Management (lines 162-173)
│   ├── currentStepIndex (wizard navigation)
│   ├── direction (animation direction)
│   ├── isTextareaFocused (keyboard handling)
│   ├── showDreamSheet (unused - inline dream selection used instead)
│   ├── showExitConfirm (modal visibility)
│   └── statusIndex (loading message cycling)
│
├── Navigation Logic (lines 186-239)
│   ├── goToNextStep()
│   ├── goToPreviousStep()
│   ├── handleDragEnd() (swipe handler)
│   └── canGoNext()
│
├── Side Effects (lines 251-275)
│   ├── beforeunload handler for dirty form
│   └── status message interval cycling
│
├── Render Functions (lines 301-491)
│   ├── renderStepContent() switch statement
│   ├── case 'dreamSelect' (60 lines - inline dream selection)
│   ├── case 'q1'-'q4' (70 lines - inline question rendering)
│   └── case 'tone' (45 lines - inline tone selection)
│
└── JSX Return (lines 493-812)
    ├── Header with close button + ProgressOrbs
    ├── AnimatePresence for step transitions
    ├── Gazing overlay (160 lines inline - duplicates GazingOverlay.tsx)
    └── Exit confirmation modal (40 lines inline - duplicates ExitConfirmation.tsx)
```

### Identified Issues

1. **Massive Duplication**: The component reimplements functionality that already exists in:
   - `QuestionStep.tsx` (145 lines) - not used
   - `ToneStep.tsx` (167 lines) - not used
   - `ExitConfirmation.tsx` (36 lines) - not used
   - `GazingOverlay.tsx` (354 lines) - not used
   - `DreamBottomSheet.tsx` (280 lines) - not used

2. **Constant Duplication**: Constants duplicated from shared modules:
   - `QUESTIONS` - exists in `lib/reflection/constants.ts`
   - `STATUS_MESSAGES` - exists in `lib/reflection/constants.ts` as `GAZING_STATUS_MESSAGES`
   - `CATEGORY_EMOJI` - exists in `lib/reflection/constants.ts`
   - `STORAGE_KEY` - exists in `lib/reflection/constants.ts`

3. **Mixed Concerns**: Component handles:
   - Wizard step state management
   - Swipe gesture handling
   - Keyboard height awareness
   - Exit confirmation logic
   - Loading state animation
   - LocalStorage interaction (duplicate of useReflectionForm)

4. **Inline Animations**: 160+ lines of gazing overlay animations inlined

---

## Extractable Hooks

### Hook 1: useMobileReflectionFlow (NEW)

**Purpose:** Manage wizard step navigation and transitions

**Responsibilities:**
- currentStepIndex state
- direction state for animations
- goToNextStep/goToPreviousStep functions
- canGoNext validation per step
- handleDragEnd swipe gesture handling
- Integrate with isTextareaFocused

**Proposed Interface:**
```typescript
interface UseMobileReflectionFlowOptions {
  totalSteps: number;
  selectedDreamId: string;
  formData: FormData;
  onComplete?: () => void;
}

interface UseMobileReflectionFlowReturn {
  currentStepIndex: number;
  direction: number;
  currentStep: WizardStep;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  canGoNext: () => boolean;
  handleDragEnd: (event: any, info: PanInfo) => void;
  isTextareaFocused: boolean;
  setIsTextareaFocused: (focused: boolean) => void;
}
```

**Estimated Lines:** 80-100 lines

### Hook 2: useDirtyFormGuard (NEW, optional)

**Purpose:** Handle beforeunload and exit confirmation logic

**Responsibilities:**
- Track if form is dirty
- Show exit confirmation when navigating away
- Handle beforeunload event
- Clear localStorage on confirmed exit

**Proposed Interface:**
```typescript
interface UseDirtyFormGuardReturn {
  isDirty: boolean;
  showExitConfirm: boolean;
  handleCloseAttempt: () => void;
  confirmExit: () => void;
  cancelExit: () => void;
}
```

**Estimated Lines:** 40-50 lines

**Note:** This could also be merged into useMobileReflectionFlow for simplicity.

---

## Extractable View Components

### View 1: MobileDreamSelectionView.tsx (NEW)

**Current Location:** Inline in renderStepContent() case 'dreamSelect' (lines 304-367)

**Purpose:** Full-screen dream selection step for mobile wizard

**Props Interface:**
```typescript
interface MobileDreamSelectionViewProps {
  dreams: Dream[];
  selectedDreamId: string;
  onDreamSelect: (dream: Dream) => void;
}
```

**Reuses:**
- `CATEGORY_EMOJI` from `lib/reflection/constants.ts`
- GlowButton from UI components

**Estimated Lines:** 80-100 lines

### View 2: MobileQuestionnaireView.tsx (REPLACE with QuestionStep.tsx)

**Current Location:** Inline in renderStepContent() case 'q1'-'q4' (lines 369-438)

**Solution:** The existing `QuestionStep.tsx` (145 lines) already implements this functionality. Should be used directly instead of inline implementation.

**Existing Component:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/mobile/QuestionStep.tsx`

### View 3: MobileToneSelectionView.tsx (REPLACE with ToneStep.tsx)

**Current Location:** Inline in renderStepContent() case 'tone' (lines 440-486)

**Solution:** The existing `ToneStep.tsx` (167 lines) already implements this functionality. Should be used directly.

**Existing Component:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/mobile/ToneStep.tsx`

### View 4: GazingOverlay (ALREADY EXISTS - USE IT)

**Current Location:** Inline in JSX (lines 529-762)

**Solution:** The existing `GazingOverlay.tsx` (354 lines) already implements both 'simple' and 'elaborate' variants. Use the 'simple' variant for mobile.

**Existing Component:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/mobile/GazingOverlay.tsx`

### View 5: ExitConfirmation (ALREADY EXISTS - USE IT)

**Current Location:** Inline in JSX (lines 765-806)

**Solution:** The existing `ExitConfirmation.tsx` (36 lines) implements this modal.

**Existing Component:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/mobile/ExitConfirmation.tsx`

---

## Dependency Map

### External Dependencies (npm packages)
```
framer-motion
├── motion, AnimatePresence, PanInfo, useReducedMotion
├── Used for: step transitions, swipe gestures, gazing overlay

lucide-react
├── X, ChevronLeft, ChevronRight, Check, Sparkles
├── Used for: icons in navigation and selection

next/navigation
├── useRouter
├── Used for: navigation to /dreams when no dreams exist
```

### Internal Dependencies (project modules)

**Components:**
```
@/components/reflection/ToneSelectionCard
@/components/ui/glass (GlowButton, CosmicLoader, GlassInput)
@/components/ui/glass/ProgressOrbs
```

**Contexts:**
```
@/contexts/NavigationContext (useHideBottomNav)
```

**Hooks:**
```
@/hooks (useKeyboardHeight)
```

**Libraries:**
```
@/lib/animations/variants (stepTransitionVariants, gazingOverlayVariants, statusTextVariants)
@/lib/utils (cn)
@/lib/utils/constants (QUESTION_LIMITS, ToneId)
@/lib/utils/haptics (haptic)
```

**Should Use (currently duplicated):**
```
@/lib/reflection/constants (QUESTIONS, STORAGE_KEY, CATEGORY_EMOJI, GAZING_STATUS_MESSAGES)
@/lib/reflection/types (FormData, Dream)
```

### Existing Mobile Components (NOT USED - should be used)
```
@/components/reflection/mobile/QuestionStep.tsx
@/components/reflection/mobile/ToneStep.tsx
@/components/reflection/mobile/ExitConfirmation.tsx
@/components/reflection/mobile/GazingOverlay.tsx
@/components/reflection/mobile/DreamBottomSheet.tsx
```

---

## Refactoring Strategy

### Phase 1: Extract useMobileReflectionFlow Hook

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/hooks/useMobileReflectionFlow.ts`

**Extract:**
1. WIZARD_STEPS constant
2. currentStepIndex, direction states
3. goToNextStep, goToPreviousStep functions
4. canGoNext validation logic
5. handleDragEnd swipe handler
6. isTextareaFocused state

**Line Reduction:** ~80 lines moved to hook

### Phase 2: Replace Inline Components with Existing

**Replace inline dream selection with MobileDreamSelectionView:**
- Create new `MobileDreamSelectionView.tsx` (~80 lines)
- Remove inline implementation (~60 lines saved)

**Replace inline question rendering with QuestionStep:**
- Already exists at `QuestionStep.tsx`
- Remove inline implementation (~70 lines saved)

**Replace inline tone selection with ToneStep:**
- Already exists at `ToneStep.tsx`
- Remove inline implementation (~45 lines saved)

**Replace inline gazing overlay with GazingOverlay:**
- Already exists at `GazingOverlay.tsx`
- Remove inline implementation (~160 lines saved)

**Replace inline exit confirmation with ExitConfirmation:**
- Already exists at `ExitConfirmation.tsx`
- Remove inline implementation (~40 lines saved)

### Phase 3: Remove Constant Duplication

**Replace with imports:**
```typescript
import { QUESTIONS, STORAGE_KEY, CATEGORY_EMOJI, GAZING_STATUS_MESSAGES } from '@/lib/reflection/constants';
import type { FormData, Dream } from '@/lib/reflection/types';
```

**Line Reduction:** ~70 lines of constants removed

### Phase 4: Final Structure

**Refactored MobileReflectionFlow.tsx (~200-250 lines):**
```typescript
'use client';

import { useMobileReflectionFlow } from '@/hooks/useMobileReflectionFlow';
import { MobileDreamSelectionView } from './views/MobileDreamSelectionView';
import { QuestionStep } from './QuestionStep';
import { ToneStep } from './ToneStep';
import { GazingOverlay } from './GazingOverlay';
import { ExitConfirmation } from './ExitConfirmation';

export function MobileReflectionFlow(props) {
  const flow = useMobileReflectionFlow({...});
  
  // Minimal orchestration logic
  return (
    <div className="fixed inset-0 ...">
      <Header />
      <AnimatePresence mode="wait">
        {flow.currentStep === 'dreamSelect' && <MobileDreamSelectionView />}
        {flow.currentStep.startsWith('q') && <QuestionStep />}
        {flow.currentStep === 'tone' && <ToneStep />}
      </AnimatePresence>
      <GazingOverlay isVisible={isSubmitting} variant="simple" />
      <ExitConfirmation isOpen={showExitConfirm} />
    </div>
  );
}
```

---

## Risk Assessment

### High Risk Areas

1. **Swipe Gesture Behavior**
   - Current: Custom handleDragEnd with threshold detection
   - Risk: Changing the gesture handling could break UX
   - Mitigation: Keep exact threshold values (SWIPE_THRESHOLD=50, VELOCITY_THRESHOLD=300)

2. **Keyboard Height Handling**
   - Current: Inline style calculations for keyboard-aware positioning
   - Risk: Breaking mobile keyboard experience
   - Mitigation: Test on real mobile devices, keep useKeyboardHeight integration

3. **Animation Continuity**
   - Current: Inline variants with prefersReducedMotion support
   - Risk: Losing animation smoothness or a11y support
   - Mitigation: Use existing animation variants from lib/animations/variants.ts

### Medium Risk Areas

1. **LocalStorage Persistence**
   - Current: Inline STORAGE_KEY and localStorage.removeItem on close
   - Risk: Breaking draft persistence
   - Mitigation: Use shared STORAGE_KEY from constants, verify behavior in tests

2. **Exit Confirmation Flow**
   - Current: isDirty check before closing
   - Risk: Users losing work unexpectedly
   - Mitigation: Add comprehensive tests for dirty form detection

3. **Step Validation**
   - Current: canGoNext checks per step
   - Risk: Allowing invalid progression
   - Mitigation: Keep validation logic in hook with same conditions

### Low Risk Areas

1. **Component Composition**
   - Using existing QuestionStep, ToneStep, etc.
   - Risk: Props interface mismatch
   - Mitigation: Props are already aligned with existing components

2. **Constant Imports**
   - Moving from inline to imports
   - Risk: Minimal - just import paths
   - Mitigation: TypeScript will catch any mismatches

---

## Recommendations for Planner

### Recommendation 1: Single Builder, Three Phases

The refactoring is interconnected and should be done by a single builder in phases:

**Phase 1:** Create useMobileReflectionFlow hook (60-80 lines)
**Phase 2:** Replace inline components with existing ones
**Phase 3:** Create MobileDreamSelectionView.tsx
**Phase 4:** Clean up and verify

**Rationale:** The components are tightly coupled. Splitting across builders would create merge conflicts and integration issues.

### Recommendation 2: Prioritize Existing Component Reuse

The existing mobile components (QuestionStep, ToneStep, ExitConfirmation, GazingOverlay) are **already tested patterns** but not used. Using them:
- Reduces code duplication
- Ensures consistency with desktop flow
- Makes testing easier (components already have clear interfaces)

### Recommendation 3: Create MobileDreamSelectionView as New Component

Unlike other steps, dream selection has no existing extracted component. Create:
`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/mobile/views/MobileDreamSelectionView.tsx`

### Recommendation 4: Test Strategy

Create tests in this order:
1. `useMobileReflectionFlow.test.ts` - Hook logic isolation
2. `MobileDreamSelectionView.test.tsx` - New component
3. `MobileReflectionFlow.test.tsx` - Integration tests

---

## Resource Map

### Critical Files to Modify

| File | Action | Estimated Lines |
|------|--------|-----------------|
| `MobileReflectionFlow.tsx` | Refactor | 812 -> ~250 |
| `hooks/useMobileReflectionFlow.ts` | Create | ~80-100 |
| `mobile/views/MobileDreamSelectionView.tsx` | Create | ~80-100 |
| `hooks/index.ts` | Export new hook | +1 |
| `mobile/index.ts` | Export new view | +1 |

### Files to Use (No Modification Needed)

| File | Purpose |
|------|---------|
| `mobile/QuestionStep.tsx` | Question step (use as-is) |
| `mobile/ToneStep.tsx` | Tone selection (use as-is) |
| `mobile/ExitConfirmation.tsx` | Exit modal (use as-is) |
| `mobile/GazingOverlay.tsx` | Loading overlay (use as-is) |
| `lib/reflection/constants.ts` | Shared constants |
| `lib/reflection/types.ts` | Shared types |

### Test Files to Create

| File | Coverage Target |
|------|-----------------|
| `hooks/__tests__/useMobileReflectionFlow.test.ts` | 90% |
| `mobile/views/__tests__/MobileDreamSelectionView.test.tsx` | 80% |
| `mobile/__tests__/MobileReflectionFlow.test.tsx` | 80% |

---

## Questions for Planner

1. **Should useMobileReflectionFlow include dirty form guard logic**, or should that remain in the component for simplicity?

2. **Should MobileDreamSelectionView be placed in `mobile/views/` subdirectory** (matching desktop pattern) or directly in `mobile/`?

3. **The ToneStep component uses a slightly different prop interface** than the inline implementation (it accepts `onPrevious` and `canGoPrevious` but not `onClose`). Should we update ToneStep or create an adapter?

4. **QuestionStep uses forwardRef with imperative handle** - is this pattern needed for the refactored integration, or can we simplify?

---

## Summary

The MobileReflectionFlow refactoring is straightforward because:

1. **Existing components exist but are not used** - QuestionStep, ToneStep, ExitConfirmation, GazingOverlay are all already extracted but MobileReflectionFlow duplicates their functionality inline.

2. **Clear extraction pattern** - Desktop MirrorExperience.tsx demonstrates the target pattern with hooks + views.

3. **Shared constants exist** - lib/reflection/constants.ts already has the duplicated constants.

**Estimated Line Reduction:** 812 -> ~250 lines (70% reduction)
**New Files:** 2 (useMobileReflectionFlow.ts, MobileDreamSelectionView.tsx)
**Test Files:** 3 (hook test, view test, integration test)

The refactoring is low-risk because we are primarily replacing inline implementations with existing, tested components rather than creating new logic.
