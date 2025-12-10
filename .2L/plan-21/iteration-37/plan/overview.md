# 2L Iteration Plan - Testing Infrastructure

## Project Vision

Establish a robust testing infrastructure for Mirror of Dreams by:
1. Fixing 12 unhandled promise rejections that cause test instability
2. Making CI properly block on test failures (removing continue-on-error)
3. Adding Playwright E2E testing for critical user flows

This iteration ensures the test suite is reliable, CI is trustworthy, and end-to-end testing validates real user journeys.

## Success Criteria

Specific, measurable criteria for MVP completion:

- [ ] Zero unhandled promise rejections when running `npm run test:run`
- [ ] All 12 identified test cases in retry.test.ts and anthropic-retry.test.ts fixed
- [ ] CI workflow fails when tests fail (continue-on-error removed)
- [ ] Coverage thresholds configured in vitest.config.ts
- [ ] Playwright installed and configured
- [ ] E2E test directory structure created with page objects
- [ ] At least 2 E2E test specs passing (signin flow, signup flow)
- [ ] CI workflow includes E2E job
- [ ] All tests pass in CI environment

## MVP Scope

**In Scope:**
- Fix async test patterns in retry.test.ts (8 tests)
- Fix async test patterns in anthropic-retry.test.ts (4 tests)
- Remove continue-on-error from CI workflow
- Add coverage thresholds to vitest.config.ts
- Install @playwright/test dependency
- Create playwright.config.ts
- Create E2E directory structure with page objects
- Create auth E2E tests (signin, signup)
- Add E2E npm scripts to package.json
- Add E2E job to CI workflow
- Update .gitignore for Playwright artifacts

**Out of Scope (Post-MVP):**
- Visual regression testing
- Performance testing
- Database seeding scripts for E2E (simplified approach for MVP)
- Full reflection creation E2E tests (requires AI mocking)
- Firefox/Safari browser testing in CI

## Development Phases

1. **Exploration** - Complete
2. **Planning** - Complete
3. **Building** - ~2-3 hours (parallel builders)
4. **Integration** - ~15 minutes
5. **Validation** - ~20 minutes
6. **Deployment** - Final

## Timeline Estimate

- Exploration: Complete
- Planning: Complete
- Building: 2-3 hours (2 parallel builders)
- Integration: 15 minutes
- Validation: 20 minutes
- Total: ~3-4 hours

## Risk Assessment

### High Risks

- **Flaky E2E Tests:** Network-dependent tests may fail intermittently in CI
  - Mitigation: Use retries in CI, implement proper waitFor patterns, run in serial mode

- **CI Resource Constraints:** E2E tests may timeout in CI environment
  - Mitigation: Run only Chromium initially, increase timeouts, limit parallelism

### Medium Risks

- **Test Data Dependency:** E2E tests require specific test user to exist
  - Mitigation: Use demo login flow initially (already exists in app)

- **Breaking Existing CI:** Removing continue-on-error may reveal hidden test failures
  - Mitigation: Ensure all unit tests pass before removing flag

### Low Risks

- **Package Conflicts:** Playwright installation may conflict with existing deps
  - Mitigation: @playwright/test is well-tested with Next.js projects

## Integration Strategy

Both builders work on independent concerns:
- Builder-1 focuses on unit test fixes and CI configuration
- Builder-2 focuses on E2E infrastructure setup

Integration points:
1. Both modify package.json (different sections - scripts vs devDependencies)
2. Both modify CI workflow (different jobs)
3. Both modify .gitignore (additive changes)

**Merge Strategy:** Builder-2 should incorporate Builder-1's changes when merging, as both touch the same files but different sections.

## Deployment Plan

1. Run full test suite locally: `npm run test:run`
2. Verify zero unhandled rejections
3. Run E2E tests locally: `npm run test:e2e`
4. Commit and push
5. CI runs all tests (unit + E2E)
6. Merge to main after CI passes
