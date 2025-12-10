# 2L Iteration Plan - Iteration 48: UI and Auth Component Tests

## Project Vision

Add comprehensive test coverage for the remaining untested UI and Auth components in the Mirror of Dreams application. This iteration focuses on testing 7 critical components to achieve 80%+ coverage across the glass UI system and authentication layouts.

## Success Criteria

Specific, measurable criteria for completion:

- [ ] GlassCard.test.tsx created with 20+ test cases
- [ ] GlassInput.test.tsx created with 35+ test cases
- [ ] GlassModal.test.tsx created with 25+ test cases
- [ ] CosmicLoader.test.tsx created with 10+ test cases
- [ ] AuthLayout.test.tsx created with 12+ test cases
- [ ] BottomSheet.test.tsx created with 25+ test cases
- [ ] AnimatedBackground.test.tsx created with 10+ test cases
- [ ] All tests pass with `npm run test`
- [ ] Combined coverage target: 80%+ for tested components

## MVP Scope

**In Scope:**
- GlassCard component tests (rendering, elevated/interactive states, keyboard interaction)
- GlassInput component tests (input types, validation, counters, password toggle)
- GlassModal component tests (visibility, close behaviors, focus trap, mobile swipe)
- CosmicLoader component tests (sizes, accessibility, animation)
- AuthLayout component tests (rendering, logo, title/subtitle)
- BottomSheet component tests (visibility, height modes, swipe dismiss)
- AnimatedBackground component tests (variants, intensity, reduced motion)

**Out of Scope (Post-MVP):**
- ProgressOrbs component (MEDIUM priority, deferred)
- Integration tests between components
- Visual regression testing
- E2E tests

## Development Phases

1. **Exploration** - Complete
2. **Planning** - Current
3. **Building** - Estimated 2-3 hours (2 parallel builders)
4. **Integration** - 15 minutes
5. **Validation** - 20 minutes
6. **Deployment** - Final (tests only, no deployment needed)

## Timeline Estimate

- Exploration: Complete
- Planning: Complete
- Building: 2-3 hours (parallel builders)
- Integration: 15 minutes
- Validation: 20 minutes
- Total: ~3-4 hours

## Risk Assessment

### High Risks
- **Framer Motion mocking complexity**: The components heavily use framer-motion animations. Mitigation: Use existing mock patterns and test behavioral outcomes rather than animation internals.
- **Focus trap testing**: GlassModal and BottomSheet use react-focus-lock. Mitigation: Mock FocusLock to render children directly, test focus behavior separately.

### Medium Risks
- **useIsMobile hook dependency**: GlassModal and some components depend on mobile detection. Mitigation: Mock the hook to control mobile/desktop state in tests.
- **Event simulation for swipe gestures**: Testing drag/swipe behavior. Mitigation: Use fireEvent with appropriate motion values, test callback invocations.

### Low Risks
- **Custom CSS class assertions**: Testing Tailwind classes. Mitigation: Use toHaveClass matcher, follow existing patterns.

## Integration Strategy

Both builders work on isolated test files. No shared state or dependencies between builder outputs. Integration is straightforward file merge.

**Shared Resources:**
- Mock utilities can be shared in test setup
- Both builders use same test patterns from patterns.md

**Conflict Prevention:**
- Builder-1 works in `/components/ui/glass/__tests__/`
- Builder-2 works in `/components/auth/__tests__/` and `/components/ui/mobile/__tests__/`

## Test File Locations

```
components/
├── auth/
│   └── __tests__/
│       └── AuthLayout.test.tsx          # Builder-2
├── ui/
│   ├── glass/
│   │   └── __tests__/
│   │       ├── GlassCard.test.tsx       # Builder-1
│   │       ├── GlassInput.test.tsx      # Builder-1
│   │       ├── GlassModal.test.tsx      # Builder-1
│   │       ├── CosmicLoader.test.tsx    # Builder-1
│   │       └── AnimatedBackground.test.tsx # Builder-2
│   └── mobile/
│       └── __tests__/
│           └── BottomSheet.test.tsx     # Builder-2
```

## Validation Plan

1. Run `npm run test` to verify all tests pass
2. Run `npm run test:coverage` to verify coverage targets
3. Ensure no regressions in existing tests
4. Verify TypeScript compilation with `npx tsc --noEmit`
