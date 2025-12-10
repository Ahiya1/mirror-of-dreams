# 2L Iteration Plan - Dashboard Component Tests (Iteration 47)

## Project Vision

Add comprehensive test coverage for dashboard components in the Mirror of Dreams application. The dashboard currently has 15 components with only 1 tested (TierBadge at 6.7% coverage). This iteration focuses on achieving 80%+ test coverage for priority dashboard components to ensure reliability and prevent regressions.

## Success Criteria

Specific, measurable criteria for iteration completion:

- [ ] DashboardCard tests achieve 80%+ coverage
- [ ] DreamsCard tests achieve 80%+ coverage
- [ ] EvolutionCard tests achieve 80%+ coverage
- [ ] ReflectionsCard tests achieve 80%+ coverage
- [ ] VisualizationCard tests achieve 80%+ coverage
- [ ] ReflectionItem tests achieve 80%+ coverage
- [ ] DashboardHero tests achieve 80%+ coverage
- [ ] All tests pass with `npm run test`
- [ ] No regressions in existing TierBadge tests

## Iteration Scope

**In Scope:**
- DashboardCard shared component tests (foundation for all cards)
- DreamsCard tests (tRPC queries, interactions, states)
- EvolutionCard tests (tRPC queries, eligibility states)
- ReflectionsCard tests (tRPC queries, ReflectionItem rendering)
- VisualizationCard tests (tRPC queries, preview states)
- ReflectionItem tests (time formatting, tone display, navigation)
- DashboardHero tests (time-based greeting, CTA states)

**Out of Scope (Post-Iteration):**
- UsageCard tests (lower priority)
- SubscriptionCard tests (lower priority)
- ProgressStatsCard tests (lower priority)
- ProgressRing tests (visual only)
- WelcomeSection tests (simple component)
- DashboardGrid tests (CSS layout only)

## Development Phases

1. **Exploration** - Complete
2. **Planning** - Current
3. **Building** - 2 parallel builders (~2.5 hours each)
4. **Integration** - ~15 minutes
5. **Validation** - ~15 minutes
6. **Deployment** - Final commit

## Timeline Estimate

- Exploration: Complete
- Planning: Complete
- Building: ~2.5 hours (2 parallel builders)
- Integration: ~15 minutes
- Validation: ~15 minutes
- Total: ~3 hours

## Risk Assessment

### Medium Risks

- **tRPC Mock Complexity**: Card components use multiple tRPC queries
  - Mitigation: Follow established mock patterns from existing tests; use test helpers from `@/test/helpers`

- **Framer Motion Mocking**: DashboardCard uses framer-motion animations
  - Mitigation: Mock framer-motion to render as plain divs; skip animation-specific tests

- **Time-Based Tests**: DashboardHero has time-dependent greeting
  - Mitigation: Mock Date object to control test time

### Low Risks

- **CSS Module Imports**: ReflectionItem uses CSS modules
  - Mitigation: Vitest already configured for CSS module handling

## Integration Strategy

Both builders create test files in separate directories:
- Builder-1: `/components/dashboard/cards/__tests__/`
- Builder-2: `/components/dashboard/shared/__tests__/` and `/components/dashboard/__tests__/`

No file conflicts expected. Integration involves:
1. Verify all test files import correctly
2. Run full test suite to confirm no conflicts
3. Check coverage thresholds are met

## Deployment Plan

1. Run `npm run test` to verify all tests pass
2. Run `npm run test:coverage` to verify coverage targets
3. Commit with message: "Iteration 47: Dashboard Component Tests"
4. Push to main branch
