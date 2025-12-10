# Builder Task Breakdown - Integration Tests Expansion

## Overview

**2** primary builders will work in parallel.
No splits anticipated - tasks are scoped appropriately.

## Builder Assignment Strategy

- **Builder-1**: Lifecycle router tests + Extended auth tests (~40 tests)
- **Builder-2**: Subscriptions tests + User journey tests (~25 tests)

Builders work on isolated directories with no file overlap.

---

## Builder-1: Lifecycle Router & Extended Auth Tests

### Scope

Create comprehensive integration tests for:
1. **Lifecycle router** - All 7 procedures (evolve, achieve, release, getEvolutionHistory, getCeremony, getRitual, updateCeremonyNote)
2. **Extended auth tests** - Password reset, email verification, demo account flows
3. **Lifecycle fixtures** - Test data factory for evolution events, ceremonies, rituals

### Complexity Estimate

**MEDIUM-HIGH**

Lifecycle tests require complex mock setups with sequential database calls and AI response parsing. Auth flow tests are straightforward.

### Success Criteria

- [ ] `test/integration/lifecycle/lifecycle.test.ts` with 20+ tests
- [ ] `test/integration/auth/password-reset.test.ts` with 6+ tests
- [ ] `test/integration/auth/verification.test.ts` with 5+ tests
- [ ] `test/integration/auth/demo.test.ts` with 4+ tests
- [ ] `test/fixtures/lifecycle.ts` created
- [ ] All tests pass with `npm run test:integration`
- [ ] Total: ~35-40 tests

### Files to Create

| File | Purpose | Est. Tests |
|------|---------|------------|
| `test/integration/lifecycle/lifecycle.test.ts` | Lifecycle router tests | 20 |
| `test/integration/auth/password-reset.test.ts` | Password reset flow tests | 6 |
| `test/integration/auth/verification.test.ts` | Email verification tests | 5 |
| `test/integration/auth/demo.test.ts` | Demo account tests | 4 |
| `test/fixtures/lifecycle.ts` | Lifecycle test fixtures | - |

### Dependencies

**Depends on:** None (independent work)
**Blocks:** Nothing (integration tests only)

### Implementation Notes

#### Lifecycle Router Tests

The lifecycle router at `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/lifecycle.ts` has 7 procedures:

1. **`lifecycle.evolve`** (mutation)
   - Tests: success, ownership check, status check (active only), validation, auth
   - Complex mock: sequential dreams table calls (fetch then update), evolution_events insert

2. **`lifecycle.getEvolutionHistory`** (query)
   - Tests: success, ownership check, empty history, auth
   - Mock: dreams fetch, evolution_events fetch with ordering

3. **`lifecycle.achieve`** (mutation)
   - Tests: success with AI synthesis, success without reflections, ownership, status check, existing ceremony check, AI failure graceful degradation
   - Complex mock: dreams, reflections, achievement_ceremonies, Anthropic mock with ceremony format

4. **`lifecycle.getCeremony`** (query)
   - Tests: success, not found, ownership
   - Mock: achievement_ceremonies fetch

5. **`lifecycle.updateCeremonyNote`** (mutation)
   - Tests: success, not found, ownership
   - Mock: achievement_ceremonies update

6. **`lifecycle.release`** (mutation)
   - Tests: success, ownership, status check, existing ritual check, validation
   - Mock: dreams, reflections count, release_rituals insert

7. **`lifecycle.getRitual`** (query)
   - Tests: success, not found, ownership
   - Mock: release_rituals fetch

#### Auth Extended Tests

Reference existing auth tests in `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/integration/auth/` for patterns.

**Password Reset Tests:**
```typescript
describe('auth.requestPasswordReset', () => {
  // TC-AR-01: should send reset email for existing user
  // TC-AR-02: should not reveal user existence (silent success for non-existent)
  // TC-AR-03: should rate limit requests
});

describe('auth.resetPassword', () => {
  // TC-AR-04: should reset password with valid token
  // TC-AR-05: should reject expired token
  // TC-AR-06: should reject invalid token
});
```

**Email Verification Tests:**
```typescript
describe('auth.verifyEmail', () => {
  // TC-AV-01: should verify email with valid token
  // TC-AV-02: should reject expired token
  // TC-AV-03: should reject invalid token
  // TC-AV-04: should set email_verified to true
});

describe('auth.resendVerification', () => {
  // TC-AV-05: should resend verification email
});
```

**Demo Account Tests:**
```typescript
describe('auth.startDemo', () => {
  // TC-AD-01: should create demo user
  // TC-AD-02: should set isDemo flag
  // TC-AD-03: should return JWT with demo flag
  // TC-AD-04: should have limited access (test via other router)
});
```

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use **Sequential Calls Mock** for lifecycle.evolve (fetch then update dreams)
- Use **AI Mock Patterns** for lifecycle.achieve ceremony synthesis
- Use **Authorization Test Patterns** for all procedures
- Use **Lifecycle Fixtures** pattern for test data

### Testing Requirements

- Unit tests: N/A (integration tests only)
- Integration tests: All procedures covered
- Coverage target: 80%+ for lifecycle router

### Test IDs

Use these prefixes:
- Lifecycle: `TC-LC-XX`
- Auth Password Reset: `TC-AR-XX`
- Auth Verification: `TC-AV-XX`
- Auth Demo: `TC-AD-XX`

---

## Builder-2: Subscriptions Router & User Journey Tests

### Scope

Create comprehensive integration tests for:
1. **Subscriptions router** - All 5 procedures with PayPal mocking
2. **User journey tests** - Cross-router integration scenarios
3. **Subscriptions fixtures** - Test data factory for subscription states

### Complexity Estimate

**MEDIUM**

Subscriptions tests require PayPal mock setup. Journey tests are complex conceptually but follow established patterns.

### Success Criteria

- [ ] `test/integration/subscriptions/subscriptions.test.ts` with 10+ tests
- [ ] `test/integration/journeys/user-journey.test.ts` with 8+ tests
- [ ] `test/fixtures/subscriptions.ts` created
- [ ] PayPal mock integrated (inline or via setup extension)
- [ ] All tests pass with `npm run test:integration`
- [ ] Total: ~18-25 tests

### Files to Create

| File | Purpose | Est. Tests |
|------|---------|------------|
| `test/integration/subscriptions/subscriptions.test.ts` | Subscriptions router tests | 12 |
| `test/integration/journeys/user-journey.test.ts` | Cross-router journey tests | 8 |
| `test/fixtures/subscriptions.ts` | Subscription test fixtures | - |

### Dependencies

**Depends on:** None (independent work)
**Blocks:** Nothing (integration tests only)

### Implementation Notes

#### Subscriptions Router Tests

The subscriptions router at `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/subscriptions.ts` has 5 procedures:

1. **`subscriptions.getStatus`** (query)
   - Tests: free tier, pro tier active, unlimited tier, canceled with grace period, database error fallback
   - Mock: users table select with subscription fields

2. **`subscriptions.createCheckout`** (mutation)
   - Tests: pro monthly, pro yearly, unlimited tier, error handling
   - Mock: PayPal createSubscription

3. **`subscriptions.getPlanId`** (query)
   - Tests: all tier/period combinations
   - Mock: PayPal getPlanId

4. **`subscriptions.activateSubscription`** (mutation)
   - Tests: success activation, invalid subscription status, database update error
   - Mock: PayPal getSubscriptionDetails, users table update

5. **`subscriptions.cancel`** (mutation)
   - Tests: success, no subscription found, PayPal error
   - Mock: users table select, PayPal cancelSubscription, users table update

**PayPal Mock Setup:**

```typescript
// Add at top of subscriptions.test.ts
const paypalMock = vi.hoisted(() => ({
  createSubscription: vi.fn().mockResolvedValue('https://paypal.com/approve/123'),
  cancelSubscription: vi.fn().mockResolvedValue(undefined),
  getPlanId: vi.fn().mockImplementation((tier, period) => `P-${tier.toUpperCase()}-${period.toUpperCase()}`),
  getSubscriptionDetails: vi.fn().mockResolvedValue({
    id: 'I-SUB123',
    status: 'ACTIVE',
    plan_id: 'P-PRO-MONTHLY',
    subscriber: { payer_id: 'PAYER123' },
  }),
  determineTierFromPlanId: vi.fn().mockReturnValue('pro'),
  determinePeriodFromPlanId: vi.fn().mockReturnValue('monthly'),
}));

vi.mock('@/server/lib/paypal', () => paypalMock);
```

#### User Journey Tests

Test complete user flows across multiple routers:

1. **New User Onboarding Journey**
   - Signup -> Verify email -> Create first dream -> Generate reflection
   - Tests user counters update correctly

2. **Dream Lifecycle Journey**
   - Create dream -> Generate 4 reflections -> Achieve with ceremony
   - Tests status transitions and AI synthesis

3. **Subscription Upgrade Journey**
   - Free user -> Check limits -> Upgrade to pro -> Verify new limits

4. **Cross-Dream Patterns Journey**
   - Create multiple dreams -> Generate reflections -> Cross-dream evolution report

**Journey Test Pattern:**

```typescript
describe('User Journey: Dream Lifecycle', () => {
  it('should complete full lifecycle from creation to achievement', async () => {
    const user = proTierUser;
    const { caller, supabase } = createTestCaller(user);

    // Setup comprehensive mocks that track state changes
    const state = {
      dreamStatus: 'active',
      reflectionCount: 0,
      hasCeremony: false,
    };

    // Mock that responds based on state
    supabase.from.mockImplementation((table: string) => {
      // Dynamic responses based on state
      // ...
    });

    // Step 1: Create dream
    // Step 2: Generate reflections (mock increment reflectionCount)
    // Step 3: Achieve dream
    // Assert: ceremony created, status changed
  });
});
```

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use **Single Table Mock** for getStatus
- Use **RPC Mock Pattern** style for PayPal function mocks
- Use **User Journey Test Pattern** for cross-router tests
- Use **Subscriptions Fixtures** pattern for test data

### Testing Requirements

- Unit tests: N/A (integration tests only)
- Integration tests: All procedures and journeys covered
- Coverage target: 80%+ for subscriptions router

### Test IDs

Use these prefixes:
- Subscriptions: `TC-SB-XX`
- User Journeys: `TC-UJ-XX`

---

## Builder Execution Order

### Parallel Group 1 (No dependencies)

| Builder | Focus | Est. Tests | Est. Time |
|---------|-------|------------|-----------|
| Builder-1 | Lifecycle + Auth flows | 35-40 | 1.5-2 hrs |
| Builder-2 | Subscriptions + Journeys | 18-25 | 1-1.5 hrs |

Both builders start simultaneously with no blocking dependencies.

---

## Integration Notes

### How Builder Outputs Merge

1. **No file conflicts** - Each builder creates unique files in separate directories
2. **Shared setup** - Both use existing `test/integration/setup.ts` without modification
3. **Fixtures isolated** - Each builder creates their own fixtures file

### Merge Process

1. Builder-1 completes: `test/integration/lifecycle/`, `test/integration/auth/*.test.ts`, `test/fixtures/lifecycle.ts`
2. Builder-2 completes: `test/integration/subscriptions/`, `test/integration/journeys/`, `test/fixtures/subscriptions.ts`
3. Run full test suite to verify no regressions: `npm run test:integration`

### Potential Coordination Points

- **Fixtures may have similar patterns**: Both builders creating fixtures, ensure no naming conflicts
- **PayPal mock**: Builder-2 creates inline mock; if shared setup needed, coordinate after

### Validation Checklist

After both builders complete:

- [ ] `npm run test:integration` passes all tests
- [ ] No import errors in new files
- [ ] Test count: 60+ new tests total
- [ ] Coverage report shows lifecycle and subscriptions routers covered

---

## Summary Table

| Builder | Router/Feature | Tests | Files | Priority |
|---------|---------------|-------|-------|----------|
| Builder-1 | Lifecycle router | 20 | 2 | HIGH |
| Builder-1 | Auth password reset | 6 | 1 | HIGH |
| Builder-1 | Auth verification | 5 | 1 | MEDIUM |
| Builder-1 | Auth demo | 4 | 1 | MEDIUM |
| Builder-1 | Lifecycle fixtures | - | 1 | HIGH |
| Builder-2 | Subscriptions router | 12 | 1 | HIGH |
| Builder-2 | User journeys | 8 | 1 | MEDIUM |
| Builder-2 | Subscriptions fixtures | - | 1 | HIGH |
| **Total** | | **55-65** | **9** | |
