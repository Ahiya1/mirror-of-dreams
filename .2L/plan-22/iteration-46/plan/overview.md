# 2L Iteration Plan - Reflection Component Tests (Iteration 46)

## Project Vision

Create comprehensive test coverage for 6 priority reflection components identified in the exploration phase. These components form the core of the desktop reflection questionnaire experience and shared UI elements used across both desktop and mobile views.

## Success Criteria

Specific, measurable criteria for iteration completion:

- [ ] DreamSelectionView.test.tsx created with 10+ test cases
- [ ] ReflectionFormView.test.tsx created with 13+ test cases
- [ ] ReflectionOutputView.test.tsx created with 7+ test cases
- [ ] ReflectionQuestionCard.test.tsx created with 9+ test cases
- [ ] ToneSelection.test.tsx created with 10+ test cases
- [ ] ToneSelectionCard.test.tsx created with 10+ test cases
- [ ] All tests pass with `npm run test`
- [ ] 80%+ line coverage for priority components
- [ ] Zero TypeScript errors in test files

## Iteration Scope

**In Scope:**
- Desktop view components: DreamSelectionView, ReflectionFormView, ReflectionOutputView
- Shared components: ReflectionQuestionCard, ToneSelection, ToneSelectionCard
- Unit tests with React Testing Library
- Component interaction tests
- Accessibility tests
- Edge case handling

**Out of Scope (Future Iterations):**
- Mobile-specific components (DreamBottomSheet, GazingOverlay, ToneStep, QuestionStep)
- ProgressIndicator component tests
- Integration tests with actual API calls
- Visual regression testing
- End-to-end tests

## Component Summary

| Component | Location | Lines | Test Cases | Complexity |
|-----------|----------|-------|------------|------------|
| DreamSelectionView | views/ | 109 | ~10 | Medium |
| ReflectionFormView | views/ | 128 | ~13 | High |
| ReflectionOutputView | views/ | 56 | ~7 | Low |
| ReflectionQuestionCard | root | 67 | ~9 | Medium |
| ToneSelection | root | 104 | ~10 | Medium |
| ToneSelectionCard | root | 172 | ~10 | High |

**Total: ~59 test cases across 6 components**

## Development Phases

1. **Exploration** - Complete
2. **Planning** - Current
3. **Building** - ~2-3 hours (2 parallel builders)
4. **Integration** - ~15 minutes
5. **Validation** - ~15 minutes
6. **Deployment** - Final

## Timeline Estimate

- Exploration: Complete
- Planning: Complete
- Building: 2-3 hours (parallel builders)
- Integration: 15 minutes
- Validation: 15 minutes
- **Total: ~3 hours**

## Risk Assessment

### Medium Risks

- **Complex component dependencies**: ReflectionFormView orchestrates multiple child components
  - Mitigation: Mock child components when testing parent, test children separately

- **Framer-motion animations**: Motion components require proper mocking
  - Mitigation: Use proven framer-motion mock pattern from existing tests

- **React.memo optimization**: ToneSelection and ReflectionQuestionCard use memo
  - Mitigation: Focus on behavioral tests, not implementation details

### Low Risks

- **Missing test utilities**: Need shared mock factories
  - Mitigation: Create test data factories as part of builder tasks

- **GlassInput integration**: Components use internal UI library
  - Mitigation: Mock GlassInput to isolate component logic

## Integration Strategy

1. Both builders work in parallel on different component sets
2. Builder-1: Desktop views in `components/reflection/views/__tests__/`
3. Builder-2: Shared components in `components/reflection/__tests__/`
4. No file conflicts expected due to separate directories
5. Final validation runs full test suite

## Test File Structure

```
components/reflection/
  __tests__/
    CharacterCounter.test.tsx (existing)
    ProgressBar.test.tsx (existing)
    ToneBadge.test.tsx (existing)
    ReflectionQuestionCard.test.tsx (NEW - Builder-2)
    ToneSelection.test.tsx (NEW - Builder-2)
    ToneSelectionCard.test.tsx (NEW - Builder-2)
  views/
    __tests__/
      DreamSelectionView.test.tsx (NEW - Builder-1)
      ReflectionFormView.test.tsx (NEW - Builder-1)
      ReflectionOutputView.test.tsx (NEW - Builder-1)
```

## Validation Plan

1. Run `npm run test` to execute all tests
2. Run `npm run test:coverage` to verify coverage targets
3. Verify no TypeScript compilation errors
4. Confirm all 6 new test files are created and pass
