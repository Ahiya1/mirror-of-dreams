# 2L Iteration Plan - Test Infrastructure Hardening

## Iteration Details
- **Iteration:** 41
- **Plan:** plan-22
- **Mode:** PRODUCTION

## Project Vision

This iteration focuses on hardening the test infrastructure to support sustainable, high-quality testing practices. The goal is to establish proper test factories, helpers, and configuration that enable rapid test development while maintaining code quality gates.

## Success Criteria

Specific, measurable criteria for MVP completion:

- [ ] `test/factories/` directory created with all core factories
- [ ] User, Dream, Reflection, and ClarifySession factories implemented with proper type safety
- [ ] `test/helpers/render.tsx` created with provider wrapper for component tests
- [ ] `test/helpers/trpc.ts` created with tRPC client mocking utilities
- [ ] `vitest.config.ts` updated with realistic thresholds (30% lines, 45% functions)
- [ ] `lcov` reporter added for CI badge compatibility
- [ ] All existing tests pass with new configuration
- [ ] Factory exports follow established fixture patterns

## MVP Scope

**In Scope:**
- Create `test/factories/` directory with factory files
- Create `test/factories/user.factory.ts` - Port existing user fixtures to factory pattern
- Create `test/factories/dream.factory.ts` - Port existing dream fixtures to factory pattern
- Create `test/factories/reflection.factory.ts` - Port existing reflection fixtures to factory pattern
- Create `test/factories/clarify.factory.ts` - NEW: ClarifySession and ClarifyMessage factories
- Create `test/factories/index.ts` - Barrel export for all factories
- Create `test/helpers/render.tsx` - Custom render with providers
- Create `test/helpers/trpc.ts` - tRPC client test utilities
- Create `test/helpers/index.ts` - Barrel export for helpers
- Update `vitest.config.ts` - Lower thresholds, add lcov reporter
- Document factory and helper usage patterns

**Out of Scope (Post-MVP):**
- CI badge generation (future iteration)
- PR coverage comments
- Per-file coverage thresholds
- MSW integration for API mocking
- Playwright E2E test factories
- Coverage increase to 80% (progressive iterations)

## Development Phases

1. **Exploration** - Complete
2. **Planning** - Current (Iteration 41)
3. **Building** - Estimated 2-3 hours (parallel builders)
4. **Integration** - Estimated 15 minutes
5. **Validation** - Estimated 15 minutes
6. **Deployment** - Final verification

## Timeline Estimate

- Exploration: Complete
- Planning: Complete
- Building: 2-3 hours (2 parallel builders)
- Integration: 15 minutes
- Validation: 15 minutes
- Total: ~3 hours

## Risk Assessment

### High Risks

- **Coverage threshold too aggressive:** Starting at 30% which is just above actual (29.53%). If any code is added without tests, CI will fail.
  - *Mitigation:* Start conservatively, can raise thresholds in next iteration.

- **Factory pattern incompatibility:** Existing tests use fixtures directly; factories may have different API.
  - *Mitigation:* Factories will re-export existing fixture patterns for backward compatibility.

### Medium Risks

- **tRPC mock complexity:** Component tests need mock tRPC context which differs from integration test setup.
  - *Mitigation:* Build on existing `test/integration/setup.ts` patterns.

- **Provider nesting issues:** Multiple providers (Auth, tRPC) may have dependency order requirements.
  - *Mitigation:* Document and test provider order in render helper.

### Low Risks

- **Lcov reporter overhead:** Additional reporter may slow test runs.
  - *Mitigation:* Lcov is lightweight; impact minimal.

## Integration Strategy

Builders work on isolated concerns:
- **Builder 1:** Factories and vitest config (foundation layer)
- **Builder 2:** Test helpers (depends on factories existing)

Integration points:
1. Builder 2 will import from `@/test/factories` created by Builder 1
2. Both builders use existing `@/types/*` definitions
3. No merge conflicts expected as files are new

## Deployment Plan

1. All files are new, no existing code modified except `vitest.config.ts`
2. Run `npm run test:coverage` to verify thresholds pass
3. Verify `coverage/lcov.info` is generated
4. Commit with message: "Iteration 41: Test Infrastructure Hardening"
5. CI will run tests and verify coverage thresholds
