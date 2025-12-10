# 2L Iteration Plan - Hook Tests (Iteration 45)

## Project Vision

Add comprehensive test coverage for the two highest-priority React hooks in the codebase: `useReflectionForm` and `useReflectionViewMode`. These hooks are critical for the reflection feature and currently have 0% test coverage despite being production-ready code.

## Success Criteria

Specific, measurable criteria for completion:
- [ ] `useReflectionForm.test.ts` created with 85%+ coverage (~35 tests)
- [ ] `useReflectionViewMode.test.ts` created with 85%+ coverage (~20 tests)
- [ ] All tests pass with `npm test`
- [ ] Tests follow existing patterns from `useMobileReflectionFlow.test.ts`
- [ ] ToastContext mock created and reusable
- [ ] Navigation mock (searchParams) created and reusable
- [ ] No regressions in existing test suite

## MVP Scope

**In Scope:**
- Complete test coverage for `useReflectionForm` hook (169 lines)
- Complete test coverage for `useReflectionViewMode` hook (63 lines)
- localStorage mock patterns (build on existing)
- ToastContext mock utility
- Next.js navigation mock (useSearchParams)
- History API mock for resetToQuestionnaire

**Out of Scope (Post-MVP):**
- `useAuth` tests (complex tRPC mocking, defer to future iteration)
- Animation hooks tests (useAnimatedCounter, useBreathingEffect, etc.)
- Viewport hooks tests (useIsMobile, useKeyboardHeight, etc.)
- Integration tests with actual components

## Development Phases

1. **Exploration** - Complete
2. **Planning** - Current
3. **Building** - ~3 hours (2 parallel builders)
4. **Integration** - ~15 minutes
5. **Validation** - ~15 minutes

## Timeline Estimate

- Exploration: Complete
- Planning: Complete
- Building: 3 hours (parallel builders)
- Integration: 15 minutes
- Validation: 15 minutes
- **Total: ~3.5 hours**

## Risk Assessment

### High Risks
- **ToastContext mock complexity**: The toast hook returns an object with success/error/warning/info methods. Mitigation: Create a proper mock factory that can track calls.

### Medium Risks
- **localStorage timing in useEffect**: Multiple useEffects interact with localStorage. Mitigation: Use act() properly and test each effect in isolation.
- **searchParams reactivity**: URL parameter changes trigger useEffect. Mitigation: Create helper to update mock searchParams and trigger re-renders.

### Low Risks
- **Test isolation**: localStorage state could leak between tests. Mitigation: Clear localStorage mock in beforeEach (already pattern in existing tests).

## Integration Strategy

Both builder outputs create new test files that don't overlap:
- Builder-1: `/hooks/__tests__/useReflectionForm.test.ts`
- Builder-2: `/hooks/__tests__/useReflectionViewMode.test.ts`

No file conflicts expected. Both builders use shared fixtures from `test/fixtures/form-data.ts`.

## Deployment Plan

Tests are self-validating. Run `npm test` to verify all tests pass before merge.

## Builder Summary

| Builder | Target Hook | Lines | Tests | Coverage Target |
|---------|-------------|-------|-------|-----------------|
| Builder-1 | useReflectionForm | 169 | ~35 | 90% |
| Builder-2 | useReflectionViewMode | 63 | ~20 | 90% |

## Dependencies

### Existing Resources
- `hooks/__tests__/useMobileReflectionFlow.test.ts` - Pattern reference (995 lines)
- `test/fixtures/form-data.ts` - Form data fixtures
- `test/helpers/render.tsx` - Custom render utilities
- `test/helpers/trpc.ts` - tRPC mock utilities
- `vitest.setup.ts` - Global test setup

### External Dependencies
- `@testing-library/react` - renderHook, act
- `vitest` - describe, it, expect, vi
