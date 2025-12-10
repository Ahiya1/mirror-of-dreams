# 2L Iteration Plan - E2E Test Expansion (Iteration 51)

## Project Vision

Expand the Mirror of Dreams E2E test suite from 39 tests (auth-only) to 100+ tests by adding comprehensive coverage for Dashboard, Dreams, Reflection, and Landing flows. This iteration leverages the existing Playwright infrastructure, Page Object Model patterns, and authentication fixtures to create maintainable, reliable end-to-end tests.

## Success Criteria

Specific, measurable criteria for iteration completion:

- [ ] E2E test count increases from 39 to 100+ tests
- [ ] Dashboard E2E tests: 15+ tests covering all cards and navigation
- [ ] Dreams E2E tests: 15+ tests covering list, CRUD, filters
- [ ] Reflection E2E tests: 20+ tests covering desktop and mobile flows
- [ ] Landing E2E tests: 12+ tests covering homepage, features, navigation
- [ ] All new tests use Page Object Model pattern
- [ ] All authenticated tests use existing `authenticatedPage` fixture
- [ ] All tests pass in CI (Chromium) and locally (multi-browser)
- [ ] No flaky tests (reliable waits, no arbitrary timeouts)

## MVP Scope

**In Scope:**
- Dashboard page E2E tests (cards, navigation, responsive)
- Dreams list page E2E tests (list, filters, empty state)
- Reflection flow E2E tests (desktop form, mobile flow, output)
- Landing page E2E tests (hero, features, footer, navigation)
- New Page Object Models for each feature area
- Shared fixtures for test data (dreams, reflections)

**Out of Scope (Post-MVP):**
- Clarify conversation flow (requires streaming/AI mocking)
- Settings page toggles (lower priority)
- Evolution flow (complex AI integration)
- Visualizations (image generation)
- Subscription/billing flows (requires payment mocking)
- Full CRUD operations requiring database state

## Development Phases

1. **Exploration** - Complete
2. **Planning** - Current (Iteration 51)
3. **Building** - 2 parallel builders
4. **Integration** - Merge and verify
5. **Validation** - Full test suite run
6. **Deployment** - CI integration

## Timeline Estimate

- Exploration: Complete
- Planning: Complete
- Building: 45-60 minutes (2 parallel builders)
- Integration: 10 minutes
- Validation: 15 minutes (full test run)
- Total: ~75-90 minutes

## Builder Assignment

| Builder | Scope | Test Count |
|---------|-------|------------|
| Builder-1 | Dashboard + Dreams E2E | ~30 tests |
| Builder-2 | Reflection + Landing E2E | ~32 tests |

## Risk Assessment

### High Risks

- **Demo login unavailable:** If demo login button is not visible, all authenticated tests fail
  - *Mitigation:* Use existing `authenticatedPage` fixture which handles this gracefully

- **Flaky mobile tests:** Mobile viewport tests may behave inconsistently
  - *Mitigation:* Use Playwright's `devices['iPhone 13']` preset consistently

### Medium Risks

- **Element locator changes:** UI changes may break locators
  - *Mitigation:* Prefer data-testid attributes, use stable CSS selectors

- **Animation timing issues:** Stagger animations may cause element visibility issues
  - *Mitigation:* Use `waitForSelector` and `toBeVisible` assertions with appropriate timeouts

### Low Risks

- **Test isolation:** Tests may affect each other's state
  - *Mitigation:* Each test navigates fresh, demo user state resets between sessions

## Integration Strategy

1. Both builders create tests in separate directories (`e2e/dashboard/`, `e2e/dreams/`, `e2e/reflection/`, `e2e/landing/`)
2. Page Objects live in `e2e/pages/` - no overlap expected
3. Fixtures in `e2e/fixtures/` extend existing auth fixture
4. Final integration runs full `npm run test:e2e` to verify all 100+ tests pass

## Test File Structure

```
e2e/
  auth/
    signin.spec.ts       (existing - 20 tests)
    signup.spec.ts       (existing - 19 tests)
  dashboard/
    dashboard.spec.ts    (new - Builder-1 - ~15 tests)
  dreams/
    dreams.spec.ts       (new - Builder-1 - ~15 tests)
  reflection/
    reflection.spec.ts   (new - Builder-2 - ~20 tests)
  landing/
    landing.spec.ts      (new - Builder-2 - ~12 tests)
  fixtures/
    auth.fixture.ts      (existing)
    test-data.fixture.ts (new - shared test constants)
  pages/
    signin.page.ts       (existing)
    signup.page.ts       (existing)
    dashboard.page.ts    (new - Builder-1)
    dreams.page.ts       (new - Builder-1)
    reflection.page.ts   (new - Builder-2)
    landing.page.ts      (new - Builder-2)
```

## Deployment Plan

1. All E2E tests run in CI via GitHub Actions
2. Chromium-only in CI for speed (existing config)
3. Multi-browser (Chromium, Firefox, Mobile Safari) locally
4. Tests gated on PR merge
