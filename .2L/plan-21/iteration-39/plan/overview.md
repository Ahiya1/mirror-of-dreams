# 2L Iteration Plan - Iteration 39: Code Quality & Refactoring

## Project Vision

Reduce technical debt in MirrorExperience.tsx through strategic refactoring and improve render performance across the application through React.memo optimization. This iteration focuses on maintainability and performance without changing user-facing functionality.

## Success Criteria

- [ ] MirrorExperience.tsx reduced from 1504 lines to <400 lines
- [ ] 2 custom hooks extracted: `useReflectionForm`, `useReflectionViewMode`
- [ ] 3 view components extracted: `DreamSelectionView`, `ReflectionFormView`, `ReflectionOutputView`
- [ ] GazingOverlay enhanced to handle desktop variant (replacing inline implementation)
- [ ] Shared types and constants extracted to `lib/reflection/`
- [ ] React.memo applied to 10+ high-priority components
- [ ] All existing tests pass
- [ ] No visual or functional regressions

## MVP Scope

**In Scope:**
- Extract custom hooks from MirrorExperience.tsx
- Extract view components from MirrorExperience.tsx
- Consolidate GazingOverlay implementations
- Extract shared types and constants
- Apply React.memo to high-priority components
- Add useCallback where needed for memoization benefits

**Out of Scope (Post-MVP):**
- CSS module extraction from inline styles (~490 lines) - defer to future iteration
- MobileReflectionFlow refactoring to use shared components
- New tests for extracted components (existing tests should continue to pass)
- Performance benchmarking/metrics

## Development Phases

1. **Exploration** - Complete
2. **Planning** - Current
3. **Building** - 2 parallel builders (~2-3 hours each)
4. **Integration** - 15 minutes
5. **Validation** - 30 minutes
6. **Deployment** - Final

## Timeline Estimate

- Exploration: Complete
- Planning: Complete
- Building: ~3 hours (2 parallel builders)
- Integration: 15 minutes
- Validation: 30 minutes
- Total: ~4 hours

## Risk Assessment

### Medium Risks

- **Hook extraction complexity**: MirrorExperience has interconnected state and effects
  - Mitigation: Extract hooks incrementally, maintain exact same behavior

- **GazingOverlay enhancement**: Desktop version has more elaborate animations than mobile
  - Mitigation: Add `variant` prop to support both simple and elaborate modes

- **Memoization breaking due to unstable callbacks**: React.memo is ineffective without useCallback
  - Mitigation: Add useCallback in parent components when applying memo

### Low Risks

- **Type extraction**: Moving interfaces to separate files is mechanical
- **View component extraction**: Components are largely presentational

## Integration Strategy

Builder 1 (MirrorExperience refactoring) and Builder 2 (React.memo optimization) work on different files with minimal overlap:

**Potential Overlap Points:**
- `GlowButton.tsx` - Builder 2 adds memo, no conflict with Builder 1
- `ReflectionQuestionCard.tsx` - Builder 2 adds memo, no conflict with Builder 1

**Integration Steps:**
1. Builder 1 completes MirrorExperience refactoring
2. Builder 2 completes React.memo additions
3. Run full test suite to verify no regressions
4. Manual smoke test of reflection flow

## Deployment Plan

1. Standard PR process
2. CI validation (lint, type-check, tests)
3. Code review focusing on:
   - Hook behavior matches original
   - No functional changes
   - Memo applied correctly with proper comparators
4. Merge to main
