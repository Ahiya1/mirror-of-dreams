# Builder Task Breakdown

## Overview

2 primary builders will work in parallel on isolated tasks:
- **Builder 1**: MirrorExperience refactoring (hooks, view components, shared types)
- **Builder 2**: React.memo optimization across the codebase

No dependencies between builders - they work on different files.

---

## Builder-1: MirrorExperience Refactoring

### Scope

Reduce MirrorExperience.tsx from 1504 lines to <400 lines by:
1. Extracting shared types and constants to `lib/reflection/`
2. Extracting custom hooks to `hooks/`
3. Extracting view components to `components/reflection/views/`
4. Enhancing GazingOverlay to support desktop variant

### Complexity Estimate

**HIGH**

State dependencies between hooks require careful extraction to maintain behavior.

### Success Criteria

- [ ] MirrorExperience.tsx reduced to <400 lines
- [ ] `lib/reflection/types.ts` created with shared types
- [ ] `lib/reflection/constants.ts` created with shared constants
- [ ] `hooks/useReflectionForm.ts` created and working
- [ ] `hooks/useReflectionViewMode.ts` created and working
- [ ] `components/reflection/views/DreamSelectionView.tsx` created
- [ ] `components/reflection/views/ReflectionFormView.tsx` created
- [ ] `components/reflection/views/ReflectionOutputView.tsx` created
- [ ] GazingOverlay enhanced with `variant` prop supporting 'simple' | 'elaborate'
- [ ] All existing functionality preserved
- [ ] No TypeScript errors
- [ ] Existing tests pass

### Files to Create

- `lib/reflection/types.ts` - Shared TypeScript interfaces
- `lib/reflection/constants.ts` - Shared constants (STORAGE_KEY, QUESTIONS, CATEGORY_EMOJI)
- `hooks/useReflectionForm.ts` - Form state, validation, persistence
- `hooks/useReflectionViewMode.ts` - View mode and URL sync
- `components/reflection/views/DreamSelectionView.tsx` - Dream selection list
- `components/reflection/views/ReflectionFormView.tsx` - Reflection form with questions
- `components/reflection/views/ReflectionOutputView.tsx` - Reflection display

### Files to Modify

- `app/reflection/MirrorExperience.tsx` - Refactor to use extracted pieces
- `components/reflection/mobile/GazingOverlay.tsx` - Add variant prop for elaborate mode

### Dependencies

**Depends on:** Nothing (can start immediately)
**Blocks:** Nothing

### Implementation Notes

#### Order of Operations

1. **First**: Create `lib/reflection/types.ts` and `lib/reflection/constants.ts`
   - These have no dependencies and enable all other extractions

2. **Second**: Extract hooks
   - Start with `useReflectionViewMode` (simpler, fewer dependencies)
   - Then extract `useReflectionForm` (more complex, depends on dreams prop)

3. **Third**: Extract view components
   - `DreamSelectionView` - pure presentational
   - `ReflectionFormView` - depends on QUESTIONS constant
   - `ReflectionOutputView` - pure presentational

4. **Fourth**: Enhance GazingOverlay
   - Add `variant` prop with default 'simple'
   - Move inline elaborate animation from MirrorExperience
   - Use useMemo for star/particle positions to prevent repositioning

5. **Finally**: Refactor MirrorExperience.tsx
   - Import and use all extracted pieces
   - Keep auth redirect, mobile delegation, demo user CTA
   - Keep inline styles (CSS extraction is out of scope)

#### State Dependency Notes

The `useReflectionForm` hook needs access to:
- `dreams` from tRPC query (passed as option)
- `toast` from useToast (called inside hook)

The hook returns everything needed for form operation, including:
- `formData` and `handleFieldChange`
- `selectedDreamId`, `selectedDream`, `handleDreamSelect`
- `selectedTone`, `setSelectedTone`
- `validateForm`, `clearForm`

#### GazingOverlay Variant Details

The existing GazingOverlay is "simple" mode with:
- CosmicLoader
- Status text cycling
- Background glow

The desktop MirrorExperience has "elaborate" mode with:
- 50 animated stars
- 15 floating particles
- Mirror portal with rotating rings
- Custom status text (not cycling)

Add `variant` prop defaulting to 'simple' for backward compatibility.

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use `useReflectionForm` hook pattern for form extraction
- Use `useReflectionViewMode` hook pattern for view mode
- Use view component patterns for DreamSelectionView, ReflectionFormView, ReflectionOutputView
- Use GazingOverlay enhancement pattern for variant support
- Follow import order convention

### Testing Requirements

- Run existing test suite (no new tests needed)
- Manual smoke test:
  - Desktop: Select dream, fill form, submit, view reflection
  - Mobile: Same flow via MobileReflectionFlow
  - Test localStorage persistence (reload page mid-form)
  - Test URL sync (direct link to reflection)

---

## Builder-2: React.memo Optimization

### Scope

Add React.memo to 10+ high-priority components to reduce unnecessary re-renders. Add useCallback in parent components where needed for memoization to be effective.

### Complexity Estimate

**MEDIUM**

Straightforward pattern application, but requires identifying callback usage sites.

### Success Criteria

- [ ] 10+ components wrapped with React.memo
- [ ] Custom comparators added where object props exist
- [ ] useCallback added in parent components for callback props
- [ ] No TypeScript errors
- [ ] Existing tests pass
- [ ] No functional regressions

### Files to Modify

#### High Priority Components (Must Do)

1. `components/ui/glass/GlowButton.tsx`
   - Wrap with memo
   - No custom comparator needed

2. `components/reflection/ReflectionQuestionCard.tsx`
   - Wrap with memo
   - No custom comparator needed

3. `components/reflection/ProgressBar.tsx`
   - Wrap with memo
   - No custom comparator needed

4. `components/dashboard/shared/ReflectionItem.tsx`
   - Wrap with memo
   - **NEEDS custom comparator** for `reflection` object prop

5. `components/dashboard/shared/TierBadge.tsx`
   - Wrap with memo
   - No custom comparator needed

#### Medium Priority Components (Should Do)

6. `components/reflection/ToneSelection.tsx`
   - Wrap with memo
   - No custom comparator needed

7. `components/ui/glass/CosmicLoader.tsx`
   - Wrap with memo
   - No custom comparator needed

8. `components/reflection/ToneSelectionCard.tsx`
   - Wrap with memo (if exists separately from ToneSelection)
   - No custom comparator needed

#### Parent Components Needing useCallback

9. `app/reflection/MirrorExperience.tsx` (after Builder-1 refactor)
   - Add useCallback for `handleFieldChange`
   - Add useCallback for `handleDreamSelect`
   - Add useCallback for tone selection handler
   - Add useCallback for submit handler

10. `components/reflection/mobile/MobileReflectionFlow.tsx`
    - Add useCallback for callback props passed to children

### Dependencies

**Depends on:** Nothing (can start immediately)
**Blocks:** Nothing

Note: Builder-2 can work in parallel with Builder-1. If Builder-1 finishes first, Builder-2 should add useCallback to the refactored MirrorExperience. If not, Builder-2 adds useCallback to the current MirrorExperience.

### Implementation Notes

#### Memo Pattern to Use

```typescript
// Named function with memo (preserves name in DevTools)
export const ComponentName = memo(function ComponentName(props: Props) {
  // ... implementation
});
```

#### Custom Comparator for ReflectionItem

```typescript
function areReflectionItemPropsEqual(
  prevProps: ReflectionItemProps,
  nextProps: ReflectionItemProps
): boolean {
  return (
    prevProps.reflection.id === nextProps.reflection.id &&
    prevProps.index === nextProps.index &&
    prevProps.animated === nextProps.animated &&
    prevProps.animationDelay === nextProps.animationDelay &&
    prevProps.className === nextProps.className &&
    prevProps.onClick === nextProps.onClick
  );
}
```

#### useCallback Dependencies

For callbacks that call setState functions:
```typescript
const handleFieldChange = useCallback((field: keyof FormData, value: string) => {
  setFormData((prev) => ({ ...prev, [field]: value }));
}, []); // Empty deps - setFormData is stable
```

For callbacks that use external values:
```typescript
const handleDreamSelect = useCallback((dreamId: string) => {
  const dream = dreams?.find((d) => d.id === dreamId);
  setSelectedDream(dream || null);
  setSelectedDreamId(dreamId);
}, [dreams]); // Include dreams in deps
```

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use simple memoization pattern for components with primitive props
- Use custom comparator pattern for ReflectionItem
- Use parent component useCallback pattern

### Testing Requirements

- Run existing test suite
- Manual verification:
  - Dashboard loads correctly with TierBadge, ReflectionItem
  - Reflection form works with memoized components
  - No visual glitches or missing updates

---

## Builder Execution Order

### Parallel Group (No dependencies)

- **Builder-1**: MirrorExperience Refactoring
- **Builder-2**: React.memo Optimization

Both builders can start immediately and work in parallel.

### Integration Notes

**Minimal overlap**: The only potential overlap is MirrorExperience.tsx:
- Builder-1 refactors it to use extracted hooks/components
- Builder-2 adds useCallback for callback props

**Resolution**: Builder-2 should apply useCallback regardless of whether the hooks have been extracted. If Builder-1's hooks already use useCallback internally, Builder-2's changes to the parent are still valid.

**Integration test after both complete**:
1. Run `npm run typecheck`
2. Run `npm run lint`
3. Run `npm run test`
4. Manual smoke test of reflection flow

---

## Summary Table

| Builder | Focus Area | Files Created | Files Modified | Complexity |
|---------|------------|---------------|----------------|------------|
| Builder-1 | MirrorExperience Refactoring | 7 new files | 2 files | HIGH |
| Builder-2 | React.memo Optimization | 0 new files | 8-10 files | MEDIUM |

**Total estimated time**: ~3 hours (parallel execution)
