# Builder Task Breakdown

## Overview

**2 primary builders** will work in parallel with clear boundaries:
- **Builder-1:** Extract hook + test fixtures
- **Builder-2:** Create view component + refactor orchestrator

**Estimated Total Time:** 2-3 hours (parallel execution)

**Critical Insight:** The refactoring primarily involves USING existing components (QuestionStep, ToneStep, ExitConfirmation, GazingOverlay) that are already extracted but not used by MobileReflectionFlow. Only ONE new view component needs to be created (MobileDreamSelectionView).

---

## Builder-1: Hook Extraction & Test Infrastructure

### Scope

Extract wizard state management into `useMobileReflectionFlow` hook and create test fixtures.

### Complexity Estimate

**MEDIUM**

Straightforward extraction of existing logic into a hook with comprehensive testing.

### Success Criteria

- [ ] `useMobileReflectionFlow` hook created at `hooks/useMobileReflectionFlow.ts` (~80-100 lines)
- [ ] Hook exported from `hooks/index.ts`
- [ ] `WIZARD_STEPS` constant and `WizardStep` type exported from hook
- [ ] Hook tests created with 90%+ coverage
- [ ] Test fixtures created at `test/fixtures/form-data.ts`
- [ ] All TypeScript strict mode compliance

### Files to Create

| File | Lines | Purpose |
|------|-------|---------|
| `hooks/useMobileReflectionFlow.ts` | ~80-100 | Wizard state management hook |
| `hooks/__tests__/useMobileReflectionFlow.test.ts` | ~200 | Comprehensive hook tests |
| `test/fixtures/form-data.ts` | ~40 | Form data test factories |

### Files to Modify

| File | Change |
|------|--------|
| `hooks/index.ts` | Add export for `useMobileReflectionFlow` |

### Dependencies

**Depends on:** Nothing (can start immediately)
**Blocks:** Builder-2 (needs hook for orchestrator refactor)

### Implementation Notes

**Hook must include:**
1. State: `currentStepIndex`, `direction`, `isTextareaFocused`, `showExitConfirm`
2. Derived: `currentStep`, `isDirty`, `totalSteps`
3. Actions: `goToNextStep`, `goToPreviousStep`, `canGoNext`, `handleDragEnd`, `setIsTextareaFocused`, `handleCloseAttempt`, `confirmExit`, `cancelExit`

**Critical values to preserve:**
- `SWIPE_THRESHOLD = 50`
- `VELOCITY_THRESHOLD = 300`

**Import from shared constants:**
```typescript
import { QUESTIONS, STORAGE_KEY } from '@/lib/reflection/constants';
```

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use "useMobileReflectionFlow Hook Structure" pattern
- Use "Hook Testing Pattern" for tests
- Use "LocalStorage Mock" pattern in tests

### Testing Requirements

**Unit tests for hook:**

| Test Category | Test Cases |
|---------------|------------|
| Initialization | Initial state values, isDirty calculation |
| canGoNext | Per step validation (dreamSelect, q1-q4, tone) |
| Navigation | goToNextStep, goToPreviousStep, boundary checks |
| Swipe handling | Threshold detection, velocity, textarea focus blocking |
| Exit handling | Dirty form confirmation, clean form direct close, confirmExit, cancelExit |

**Coverage target:** 90%

---

## Builder-2: View Component & Orchestrator Refactoring

### Scope

Create `MobileDreamSelectionView` component and refactor `MobileReflectionFlow` to use existing components and new hook.

### Complexity Estimate

**MEDIUM-HIGH**

Requires careful integration with existing components and ensuring no visual/functional regressions.

### Success Criteria

- [ ] `MobileDreamSelectionView` component created (~80-100 lines)
- [ ] View component tests with 80%+ coverage
- [ ] `MobileReflectionFlow.tsx` refactored from 812 lines to ~250 lines
- [ ] All inline implementations replaced with existing components
- [ ] All duplicated constants removed
- [ ] MobileReflectionFlow integration tests with 80%+ coverage
- [ ] Zero visual/functional regressions

### Files to Create

| File | Lines | Purpose |
|------|-------|---------|
| `components/reflection/mobile/views/MobileDreamSelectionView.tsx` | ~80-100 | Dream selection step |
| `components/reflection/mobile/views/__tests__/MobileDreamSelectionView.test.tsx` | ~150 | Component tests |
| `components/reflection/mobile/__tests__/MobileReflectionFlow.test.tsx` | ~200 | Integration tests |

### Files to Modify

| File | Before | After | Change |
|------|--------|-------|--------|
| `components/reflection/mobile/MobileReflectionFlow.tsx` | 812 lines | ~250 lines | Major refactor |

### Dependencies

**Depends on:** Builder-1 (needs `useMobileReflectionFlow` hook)
**Blocks:** Nothing (final integration)

### Implementation Notes

**MobileDreamSelectionView component:**
- Only NEW component needed (other steps use existing components)
- Props: `dreams`, `selectedDreamId`, `onDreamSelect`
- Import `CATEGORY_EMOJI` from `@/lib/reflection/constants`
- Add `data-testid` attributes for testing

**MobileReflectionFlow refactor:**

Replace inline implementations with existing components:

| Inline Code | Replace With |
|-------------|--------------|
| Lines 304-367 (dream selection) | `MobileDreamSelectionView` |
| Lines 369-438 (q1-q4) | `QuestionStep` |
| Lines 440-486 (tone) | `ToneStep` |
| Lines 529-762 (gazing overlay) | `GazingOverlay` (variant="simple") |
| Lines 765-806 (exit confirmation) | `ExitConfirmation` |

**Constants to remove (import instead):**
```typescript
// REMOVE these inline definitions:
// - QUESTIONS (lines 64-98)
// - STATUS_MESSAGES (lines 100-106)
// - STORAGE_KEY (line 111)
// - CATEGORY_EMOJI (lines 115-130)

// IMPORT from shared modules:
import { QUESTIONS, STORAGE_KEY } from '@/lib/reflection/constants';
```

**Existing component integration:**

1. **QuestionStep** (lines 41-145 of QuestionStep.tsx):
   ```typescript
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
   ```

2. **ToneStep** (lines 42-49 of ToneStep.tsx):
   ```typescript
   <ToneStep
     selectedTone={selectedTone}
     onSelect={onToneSelect}
     onPrevious={flow.goToPreviousStep}
     onSubmit={handleFinalSubmit}
     canGoPrevious={true}
     isSubmitting={isSubmitting}
   />
   ```

3. **GazingOverlay** (lines 18-22 of GazingOverlay.tsx):
   ```typescript
   <GazingOverlay isVisible={isSubmitting} variant="simple" />
   ```

4. **ExitConfirmation** (lines 6-10 of ExitConfirmation.tsx):
   ```typescript
   <ExitConfirmation
     isOpen={flow.showExitConfirm}
     onConfirm={flow.confirmExit}
     onCancel={flow.cancelExit}
   />
   ```

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use "MobileDreamSelectionView Component Structure" pattern
- Use "Refactored MobileReflectionFlow Orchestrator Pattern"
- Use "Component Testing Pattern" for view tests
- Use "Integration Test Pattern" for orchestrator tests

### Testing Requirements

**MobileDreamSelectionView tests:**

| Test Category | Test Cases |
|---------------|------------|
| Rendering | Heading, all dreams, descriptions, category emoji |
| Empty state | No dreams message, CTA button |
| Selection | Click handler, selection indicator, selected styling |

**MobileReflectionFlow integration tests:**

| Test Category | Test Cases |
|---------------|------------|
| Rendering | Initial dream selection step, close button, progress |
| Wizard flow | Dream selection -> question advance |
| Exit confirmation | Dirty form confirmation, clean form direct close |
| Gazing overlay | Shows when isSubmitting is true |

**Coverage targets:**
- MobileDreamSelectionView: 80%
- MobileReflectionFlow: 80%

---

## Builder Execution Order

### Parallel Group 1 (Initial - No dependencies)

| Builder | Task | Estimated Time |
|---------|------|----------------|
| Builder-1 | Hook extraction + tests + fixtures | ~1.5 hours |
| Builder-2 (Phase 1) | MobileDreamSelectionView + tests | ~1 hour |

### Sequential (Builder-2 Phase 2 - Depends on Builder-1)

| Builder | Task | Estimated Time |
|---------|------|----------------|
| Builder-2 (Phase 2) | MobileReflectionFlow refactor + integration tests | ~1-1.5 hours |

### Integration Notes

**Merge order:**
1. Builder-1 completes first (hook + fixtures)
2. Builder-2 Phase 1 can complete independently (view component)
3. Builder-2 Phase 2 depends on Builder-1 (orchestrator uses hook)

**Potential conflict areas:**
- None - builders work on separate files

**Shared files that need coordination:**
- None - all shared dependencies are read-only (existing components, constants)

---

## Verification Checklist

### Pre-Integration Verification

- [ ] All tests passing for useMobileReflectionFlow hook
- [ ] All tests passing for MobileDreamSelectionView
- [ ] Hook exports correctly from hooks/index.ts
- [ ] TypeScript compilation clean

### Post-Integration Verification

- [ ] All integration tests passing for MobileReflectionFlow
- [ ] MobileReflectionFlow.tsx is ~250 lines (down from 812)
- [ ] No visual regressions (manual check)
- [ ] Swipe navigation works correctly
- [ ] Exit confirmation appears for dirty forms
- [ ] Form submission triggers GazingOverlay
- [ ] All question steps render correctly
- [ ] Tone selection works correctly

### Coverage Verification

- [ ] useMobileReflectionFlow hook: >= 90% coverage
- [ ] MobileDreamSelectionView: >= 80% coverage
- [ ] MobileReflectionFlow integration: >= 80% coverage

---

## Risk Mitigation

### If QuestionStep interface doesn't match

The existing QuestionStep has specific props. If there are mismatches:
1. Verify prop types match expected usage
2. The QuestionStep accepts all needed props based on exploration
3. If needed, create thin wrapper, but this should NOT be necessary

### If ToneStep interface doesn't match

ToneStep expects:
- `selectedTone: ToneId | null`
- `onSelect: (tone: ToneId) => void`
- `onPrevious: () => void`
- `onSubmit: () => void`
- `canGoPrevious: boolean`
- `isSubmitting: boolean`

All of these can be provided from the orchestrator.

### If animations break

The orchestrator keeps all animation handling:
- `AnimatePresence` with `stepTransitionVariants`
- Swipe gesture via `drag` and `onDragEnd`
- GazingOverlay handles its own animations internally

---

## Summary

| Builder | New Files | Modified Files | Lines (Approx) | Coverage Target |
|---------|-----------|----------------|----------------|-----------------|
| Builder-1 | 3 | 1 | ~320 total | 90% (hook) |
| Builder-2 | 3 | 1 | ~430 total | 80% (components) |

**Total new code:** ~750 lines (including tests)
**Lines reduced:** 812 -> ~250 = **562 lines removed** (69% reduction)
**Net result:** Better organized code with comprehensive test coverage
