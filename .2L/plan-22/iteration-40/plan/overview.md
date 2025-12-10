# 2L Iteration Plan - MobileReflectionFlow Refactoring

## Project Vision

Refactor the 812-line `MobileReflectionFlow.tsx` mega-component into a maintainable, testable architecture by:
1. Extracting wizard state management into a dedicated `useMobileReflectionFlow` hook
2. Reusing EXISTING extracted components (QuestionStep, ToneStep, ExitConfirmation, GazingOverlay) that are currently NOT being used
3. Creating only ONE new view component (MobileDreamSelectionView)
4. Removing all duplicated constants by importing from shared modules

**Key Insight:** The component already has extracted components that it IGNORES. The refactoring is primarily about USING existing code, not creating new code.

## Success Criteria

Specific, measurable criteria for completion:

- [ ] MobileReflectionFlow.tsx reduced from 812 lines to ~250 lines (~70% reduction)
- [ ] `useMobileReflectionFlow` hook created with 90%+ test coverage
- [ ] `MobileDreamSelectionView` component created with 80%+ test coverage
- [ ] All inline implementations replaced with existing components (QuestionStep, ToneStep, ExitConfirmation, GazingOverlay)
- [ ] All duplicated constants removed (QUESTIONS, STATUS_MESSAGES, CATEGORY_EMOJI, STORAGE_KEY)
- [ ] MobileReflectionFlow integration tests with 80%+ coverage
- [ ] Zero visual/functional regressions (same user experience)
- [ ] All TypeScript strict mode compliance maintained

## MVP Scope

**In Scope:**
- Extract `useMobileReflectionFlow` hook for wizard state management
- Create `MobileDreamSelectionView` component (only NEW component needed)
- Integrate existing `QuestionStep.tsx` component
- Integrate existing `ToneStep.tsx` component
- Integrate existing `ExitConfirmation.tsx` component
- Integrate existing `GazingOverlay.tsx` component (using 'simple' variant)
- Replace inline constants with imports from `lib/reflection/constants.ts`
- Comprehensive test coverage for new/modified code

**Out of Scope (Post-Iteration):**
- Changes to existing extracted components (QuestionStep, ToneStep, etc.)
- Desktop MirrorExperience refactoring
- Animation system changes
- New feature additions
- Performance optimizations beyond refactoring

## Development Phases

1. **Exploration** - Complete
2. **Planning** - Current
3. **Building** - 2 parallel builders (~2-3 hours)
4. **Integration** - ~15 minutes
5. **Validation** - ~30 minutes
6. **Deployment** - Final

## Timeline Estimate

- Exploration: Complete
- Planning: Complete
- Building: ~2-3 hours (2 parallel builders)
- Integration: ~15 minutes
- Validation: ~30 minutes (manual + automated testing)
- **Total: ~3-4 hours**

## Risk Assessment

### High Risks

**Swipe Gesture Behavior Change**
- Current: Custom handleDragEnd with threshold detection (SWIPE_THRESHOLD=50, VELOCITY_THRESHOLD=300)
- Risk: Breaking swipe navigation UX
- Mitigation: Keep exact threshold values in hook; add unit tests for edge cases

**Prop Interface Mismatches**
- Current: Existing components have slightly different interfaces than inline implementations
- Risk: Breaking component integration
- Mitigation: Review existing component props carefully; adapt MobileReflectionFlow to match existing interfaces

### Medium Risks

**Keyboard Height Handling**
- Current: Inline style calculations for keyboard-aware positioning
- Risk: Breaking mobile keyboard experience
- Mitigation: Pass keyboardHeight through to QuestionStep which already supports it

**Exit Confirmation Flow**
- Current: isDirty check with localStorage cleanup
- Risk: Users losing work unexpectedly
- Mitigation: Comprehensive tests for dirty form detection; use existing ExitConfirmation component

**ToneStep Interface Adaptation**
- Current: ToneStep expects `onPrevious`, `onSubmit`, `canGoPrevious`, `isSubmitting`
- Risk: Interface mismatch with current flow
- Mitigation: Hook provides all necessary callbacks; adapter pattern if needed

### Low Risks

**Constant Import Changes**
- Moving from inline to imports
- Risk: Minimal - just import paths
- Mitigation: TypeScript will catch any mismatches

**Animation Continuity**
- Current: Uses shared animation variants
- Risk: Low - GazingOverlay already uses same variants
- Mitigation: Use 'simple' variant of GazingOverlay for mobile

## Integration Strategy

### Component Boundaries

```
MobileReflectionFlow (orchestrator ~250 lines)
├── useMobileReflectionFlow hook (state + navigation)
├── Header (inline - minimal)
├── AnimatePresence (step transitions)
│   ├── MobileDreamSelectionView (NEW - dream selection)
│   ├── QuestionStep (EXISTING - questions 1-4)
│   └── ToneStep (EXISTING - tone selection + submit)
├── GazingOverlay (EXISTING - loading state)
└── ExitConfirmation (EXISTING - exit modal)
```

### Data Flow

```
Props (dreams, formData, handlers)
    → useMobileReflectionFlow (wizard state)
    → View Components (rendering)
```

### Shared State Access

All state flows through props from parent:
- Form data: `formData`, `onFieldChange` (from useReflectionForm in parent)
- Dream selection: `selectedDreamId`, `onDreamSelect` (from parent)
- Tone selection: `selectedTone`, `onToneSelect` (from parent)
- Submission: `onSubmit`, `isSubmitting` (from parent)
- Close: `onClose` (from parent)

New hook manages only:
- `currentStepIndex`, `direction` (wizard navigation)
- `isTextareaFocused` (swipe disable during typing)
- `showExitConfirm` (exit modal visibility)

## Deployment Plan

1. **Pre-Deployment Verification**
   - All tests passing (hook tests, component tests, integration tests)
   - TypeScript compilation clean
   - Visual regression check on mobile devices

2. **Deployment**
   - Standard deployment process (no infrastructure changes)
   - No database migrations required
   - No environment variable changes

3. **Post-Deployment Monitoring**
   - Monitor for errors in reflection flow
   - Verify mobile swipe navigation works
   - Confirm exit confirmation appears for dirty forms

## Files Overview

### Files to Create (NEW)

| File | Lines | Purpose |
|------|-------|---------|
| `hooks/useMobileReflectionFlow.ts` | ~80-100 | Wizard state management |
| `components/reflection/mobile/views/MobileDreamSelectionView.tsx` | ~80-100 | Dream selection step |
| `hooks/__tests__/useMobileReflectionFlow.test.ts` | ~150-200 | Hook tests |
| `components/reflection/mobile/views/__tests__/MobileDreamSelectionView.test.tsx` | ~150-200 | Component tests |
| `components/reflection/mobile/__tests__/MobileReflectionFlow.test.tsx` | ~200-250 | Integration tests |
| `test/fixtures/form-data.ts` | ~40 | Form data factories |

### Files to Modify

| File | Action | Before | After |
|------|--------|--------|-------|
| `components/reflection/mobile/MobileReflectionFlow.tsx` | Major refactor | 812 lines | ~250 lines |
| `hooks/index.ts` | Export new hook | +1 line | +1 line |

### Files to USE (No Modification)

| File | Purpose |
|------|---------|
| `components/reflection/mobile/QuestionStep.tsx` | Question step (145 lines) |
| `components/reflection/mobile/ToneStep.tsx` | Tone selection (167 lines) |
| `components/reflection/mobile/ExitConfirmation.tsx` | Exit modal (36 lines) |
| `components/reflection/mobile/GazingOverlay.tsx` | Loading overlay (354 lines) |
| `lib/reflection/constants.ts` | Shared constants |
| `lib/reflection/types.ts` | Shared types |
| `test/fixtures/dreams.ts` | Dream fixtures (existing) |
