# 2L Iteration Plan - Integration Tests Expansion (Iteration 50)

## Project Vision

Expand the integration test suite to achieve comprehensive coverage of all tRPC routers, focusing on the three untested routers (lifecycle, subscriptions, artifact) and adding missing auth flow tests. This iteration addresses the gaps identified in the exploration phase and creates cross-router journey tests to verify end-to-end user flows.

## Success Criteria

Specific, measurable criteria for iteration completion:

- [ ] Create lifecycle router integration tests with 20+ test cases
- [ ] Create subscriptions router integration tests with 10+ test cases
- [ ] Add missing auth flow tests (password reset, email verification, demo) with 15+ test cases
- [ ] Create user journey cross-router tests with 8+ test cases
- [ ] All new tests pass with `npm run test:integration`
- [ ] Total new tests: 60+ (target: 63)
- [ ] No regressions in existing test suite

## Iteration Scope

**In Scope:**

1. **Lifecycle Router Tests** (NEW - 20 tests)
   - `lifecycle.evolve` - Dream evolution with reflection history
   - `lifecycle.achieve` - Achievement ceremony with AI synthesis
   - `lifecycle.release` - Release ritual with gratitude prompts
   - `lifecycle.getEvolutionHistory` - Evolution timeline retrieval
   - `lifecycle.getCeremony` - Achievement ceremony retrieval
   - `lifecycle.getRitual` - Release ritual retrieval
   - `lifecycle.updateCeremonyNote` - Update personal note

2. **Subscriptions Router Tests** (NEW - 10 tests)
   - `subscriptions.getStatus` - Current subscription status
   - `subscriptions.createCheckout` - PayPal checkout session
   - `subscriptions.getPlanId` - Plan ID for tier/period
   - `subscriptions.activateSubscription` - Post-checkout activation
   - `subscriptions.cancel` - Subscription cancellation

3. **Extended Auth Flow Tests** (15 tests)
   - Password reset request and completion
   - Email verification flow
   - Demo account creation and limitations
   - Change password flow

4. **User Journey Tests** (NEW - 8 tests)
   - New user onboarding journey
   - Dream lifecycle: create -> reflect -> evolve -> achieve
   - Subscription upgrade journey
   - Cross-dream reflection patterns

**Out of Scope (Post-MVP):**

- Admin router tests (admin-only operations)
- Artifact router tests (lower priority per exploration)
- Database transaction rollback tests
- RLS policy verification
- Performance/load testing

## Development Phases

1. **Exploration** - COMPLETE
2. **Planning** - COMPLETE (this document)
3. **Building** - 2 parallel builders (~2 hours)
4. **Integration** - 15 minutes
5. **Validation** - 15 minutes
6. **Deployment** - Final

## Timeline Estimate

- Exploration: Complete
- Planning: Complete
- Building: ~2 hours (parallel builders)
- Integration: 15 minutes
- Validation: 15 minutes
- **Total: ~2.5 hours**

## Risk Assessment

### High Risks

- **PayPal mock complexity**: Subscriptions router uses PayPal SDK which needs careful mocking
  - *Mitigation*: Create comprehensive PayPal mock in setup similar to Anthropic mock

- **Ceremony prompt file loading**: Lifecycle router reads prompts from filesystem
  - *Mitigation*: Mock `loadCeremonyPrompt` via existing prompts mock pattern

### Medium Risks

- **AI response parsing in lifecycle.achieve**: Complex parsing of ceremony synthesis
  - *Mitigation*: Mock Anthropic responses with correctly formatted ceremony sections

- **Cross-router state consistency**: Journey tests depend on multiple router states
  - *Mitigation*: Use comprehensive mockQueries to maintain state between calls

### Low Risks

- **Test isolation**: Long test files may have mock leakage
  - *Mitigation*: Use `beforeEach` with `vi.clearAllMocks()` consistently

## Integration Strategy

Builders work on isolated test files:

- **Builder-1**: `/test/integration/lifecycle/` and `/test/integration/auth/` extensions
- **Builder-2**: `/test/integration/subscriptions/` and `/test/integration/journeys/`

No overlapping files - integration is merge-only. Both builders use shared:
- `test/integration/setup.ts` (existing, no modifications needed)
- `test/fixtures/users.ts` (existing)
- `test/fixtures/dreams.ts` (existing)

New fixtures created by builders:
- Builder-1: `test/fixtures/lifecycle.ts`
- Builder-2: `test/fixtures/subscriptions.ts`

## Deployment Plan

1. Run full test suite: `npm run test:integration`
2. Verify coverage increase with `npm run test:coverage`
3. Commit with message: `test(integration): add lifecycle, subscriptions, and journey tests`
4. No production deployment - testing only iteration

## File Structure After Completion

```
test/
  integration/
    auth/
      signin.test.ts        (existing)
      signup.test.ts        (existing)
      signout.test.ts       (existing)
      password-reset.test.ts  (NEW - Builder-1)
      verification.test.ts    (NEW - Builder-1)
      demo.test.ts            (NEW - Builder-1)
    lifecycle/
      lifecycle.test.ts       (NEW - Builder-1)
    subscriptions/
      subscriptions.test.ts   (NEW - Builder-2)
    journeys/
      user-journey.test.ts    (NEW - Builder-2)
  fixtures/
    users.ts              (existing)
    dreams.ts             (existing)
    reflections.ts        (existing)
    lifecycle.ts          (NEW - Builder-1)
    subscriptions.ts      (NEW - Builder-2)
```
