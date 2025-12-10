# Explorer 1 Report: Integration Test Coverage Analysis

## Executive Summary

The integration test suite for Mirror of Dreams covers **9 of 12 tRPC routers** with extensive tests for auth, dreams, reflections, clarify, evolution, visualizations, and users. Three routers are missing integration tests: **lifecycle**, **subscriptions**, and **artifact**. The existing tests demonstrate a mature testing pattern with comprehensive mocking infrastructure, tier-based authorization, and error handling coverage. Key gaps exist in cross-router integration tests, full user journey tests, and database transaction testing.

## Current Integration Test Coverage

### Routers WITH Integration Tests (9/12)

| Router | Test File | Test Count | Coverage Assessment |
|--------|-----------|------------|---------------------|
| auth | `auth/signin.test.ts`, `auth/signup.test.ts`, `auth/signout.test.ts` | ~35 tests | HIGH - signin, signup, signout well covered |
| dreams | `dreams/create.test.ts`, `dreams/crud.test.ts`, `dreams/list.test.ts` | ~50 tests | HIGH - CRUD, tier limits, stats covered |
| reflection | `reflection/reflection-create.test.ts` | ~50 tests | HIGH - AI generation, tiers, prompts covered |
| reflections | `reflections/reflections.test.ts` | ~45 tests | HIGH - list, getById, update, delete, feedback |
| users | `users/users.test.ts` | ~20 tests | MEDIUM - profile, preferences, stats |
| clarify | `clarify/clarify.test.ts` | ~80 tests | HIGH - sessions, messages, patterns, limits |
| evolution | `evolution/evolution.test.ts` | ~60 tests | HIGH - dream/cross-dream evolution, list, get |
| visualizations | `visualizations/visualizations.test.ts` | ~35 tests | HIGH - generate, list, get |

### Routers WITHOUT Integration Tests (3/12)

| Router | Priority | Complexity | Reason for Gap |
|--------|----------|------------|----------------|
| **lifecycle** | HIGH | HIGH | Dream evolution ceremonies, achievements, releases |
| **subscriptions** | MEDIUM | MEDIUM | Stripe integration, checkout flows |
| **artifact** | LOW | LOW | Certificate/artifact generation |
| **admin** | N/A | N/A | Admin-only operations, may be out of scope |

## Critical Flows Analysis

### Auth Flows (signin/signup/signout) - GOOD COVERAGE

**Existing Tests:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/integration/auth/signin.test.ts` - 12 tests
  - Valid credentials, JWT generation, last_sign_in_at update
  - Monthly counter reset, case-insensitive email
  - Error: non-existent email, invalid password, format validation
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/integration/auth/signup.test.ts` - 14 tests
  - User creation, JWT generation, cookie setting
  - Email normalization, verification status
  - Error: duplicate email, validation, database errors
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/integration/auth/signout.test.ts` - 10 tests
  - Cookie clearing for all user tiers

**Missing:**
- Password reset flow (`auth.requestPasswordReset`, `auth.resetPassword`)
- Email verification flow (`auth.verifyEmail`, `auth.resendVerification`)
- Change password flow (`auth.changePassword`)
- Account deletion flow (`auth.deleteAccount`)
- Demo account flow (`auth.startDemo`)

### Dream Management (CRUD) - GOOD COVERAGE

**Existing Tests:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/integration/dreams/create.test.ts` - 20 tests
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/integration/dreams/crud.test.ts` - 25 tests
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/integration/dreams/list.test.ts` - 18 tests

**Missing:**
- Dream status transitions: active -> achieved -> released (cross-router with lifecycle)
- N+1 query optimization verification
- Batch operations (if any exist)

### Reflection Workflows - GOOD COVERAGE

**Existing Tests:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/integration/reflection/reflection-create.test.ts` - 50 tests
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/integration/reflections/reflections.test.ts` - 45 tests

**Missing:**
- View count increment tracking
- Cross-dream reflection patterns

### User Management - ADEQUATE COVERAGE

**Existing Tests:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/integration/users/users.test.ts` - 20 tests

**Missing:**
- `users.getReflectionStats` - monthly activity data
- `users.getDreamStats` - dream distribution stats

## Gaps Identified

### 1. Missing Router Integration Tests

#### Lifecycle Router (HIGH PRIORITY)
The lifecycle router handles critical dream lifecycle ceremonies:
- `lifecycle.evolve` - Dream evolution with AI synthesis
- `lifecycle.achieve` - Achievement ceremony with AI synthesis
- `lifecycle.release` - Release ceremony with AI farewell
- `lifecycle.getEvolutionHistory` - Evolution history retrieval
- `lifecycle.getAchievementArtifact` - Achievement artifact generation

**Test Requirements:**
```typescript
// Required test cases for lifecycle.ts integration tests
describe('lifecycle.evolve', () => {
  // Success cases
  - should evolve dream with valid input
  - should update dream title, description, category, targetDate
  - should create evolution_history record
  - should generate AI synthesis for evolution
  - should verify dream ownership before evolution

  // Authorization
  - should reject unauthenticated user
  - should reject demo user
  - should reject evolving other user's dream

  // Validation
  - should require evolution reflection (min 10 chars)
  - should validate dream exists
});

describe('lifecycle.achieve', () => {
  // Success cases
  - should mark dream as achieved
  - should generate AI ceremony synthesis
  - should create artifact record
  - should set achieved_at timestamp

  // Authorization
  - should reject demo user
  - should verify dream ownership
});

describe('lifecycle.release', () => {
  // Success cases
  - should release dream with required fields
  - should generate AI farewell message
  - should set released_at timestamp

  // Validation
  - should require whatILearned, whatImGratefulFor, whatIRelease
});
```

#### Subscriptions Router (MEDIUM PRIORITY)
Handles Stripe integration for tier upgrades:
- `subscriptions.getStatus` - Current subscription status
- `subscriptions.createCheckout` - Stripe checkout session
- `subscriptions.cancelSubscription` - Cancel flow

**Test Requirements:**
```typescript
// Mock Stripe for subscription tests
describe('subscriptions.getStatus', () => {
  - should return correct status for free tier
  - should return correct status for pro tier with active subscription
  - should return correct status for unlimited tier
  - should handle missing Stripe subscription
});

describe('subscriptions.createCheckout', () => {
  - should create checkout session for pro monthly
  - should create checkout session for pro yearly
  - should create checkout session for unlimited
  - should reject already subscribed users
});
```

#### Artifact Router (LOW PRIORITY)
Handles achievement certificates:
- `artifact.create` - Create artifact
- `artifact.get` - Retrieve artifact
- `artifact.list` - List user artifacts
- `artifact.delete` - Delete artifact

### 2. Missing Auth Flow Tests

**Password Reset Flow:**
```typescript
describe('auth.requestPasswordReset', () => {
  - should send reset email for valid user
  - should not reveal user existence
});

describe('auth.resetPassword', () => {
  - should reset password with valid token
  - should reject expired token
  - should reject invalid token
});
```

**Email Verification:**
```typescript
describe('auth.verifyEmail', () => {
  - should verify email with valid token
  - should reject expired token
  - should set email_verified to true
});
```

**Demo Account:**
```typescript
describe('auth.startDemo', () => {
  - should create demo user
  - should set isDemo flag
  - should return JWT with demo restrictions
});
```

### 3. Cross-Router Integration Tests (Not Covered)

**Full User Journey Tests:**
```typescript
describe('User Journey: New User to Pro Subscriber', () => {
  it('should complete full onboarding flow', async () => {
    // 1. Sign up
    const signup = await caller.auth.signup({ ... });
    
    // 2. Create first dream
    const dream = await caller.dreams.create({ ... });
    
    // 3. Generate reflection
    const reflection = await caller.reflection.create({ dreamId: dream.id, ... });
    
    // 4. View reflection stats
    const stats = await caller.reflections.checkUsage();
    
    // 5. Verify user counters updated
    const user = await caller.auth.me();
    expect(user.totalReflections).toBe(1);
  });
});

describe('User Journey: Dream Lifecycle', () => {
  it('should complete dream from creation to achievement', async () => {
    // 1. Create dream
    // 2. Generate 4 reflections
    // 3. Check evolution eligibility
    // 4. Generate evolution report
    // 5. Mark dream as achieved
    // 6. Generate achievement artifact
  });
});
```

### 4. Database Transaction Tests (Not Covered)

Currently, tests mock Supabase at the query level. Missing:
- Transaction rollback testing
- Concurrent update handling
- Foreign key constraint validation
- RLS (Row Level Security) policy verification

## Recommended New Tests

### Priority 1: Lifecycle Router Tests (15-20 tests)
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/integration/lifecycle/lifecycle.test.ts`

```typescript
// Test structure for lifecycle router
describe('lifecycle.evolve', () => { /* 5-6 tests */ });
describe('lifecycle.achieve', () => { /* 4-5 tests */ });
describe('lifecycle.release', () => { /* 4-5 tests */ });
describe('lifecycle.getEvolutionHistory', () => { /* 3 tests */ });
describe('lifecycle.getAchievementArtifact', () => { /* 3 tests */ });
```

### Priority 2: Auth Flow Completion (10-15 tests)
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/integration/auth/password.test.ts`
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/integration/auth/verification.test.ts`
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/integration/auth/demo.test.ts`

### Priority 3: Subscriptions Router Tests (8-10 tests)
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/integration/subscriptions/subscriptions.test.ts`

### Priority 4: Cross-Router Journey Tests (5-8 tests)
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/integration/journeys/user-journey.test.ts`

## Mocking Requirements

### Existing Mocks (from `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/integration/setup.ts`)

The test setup provides excellent mocking infrastructure:

1. **supabaseMock** - Full Supabase client mock with:
   - `from()` - Table query builder
   - `auth` - Auth operations
   - `storage` - File storage
   - `rpc()` - Remote procedure calls

2. **anthropicMock** - Anthropic API mock:
   - `messages.create()` - Standard API
   - `beta.messages.create()` - Extended thinking API

3. **cookieMock** - Auth cookie operations

4. **cacheMock** - Redis cache mock

5. **promptsMock** - Prompt loading mock

6. **rateLimitMock** - Rate limiter bypass

### New Mocks Needed

#### Stripe Mock (for subscriptions tests)
```typescript
const stripeMock = vi.hoisted(() => ({
  checkout: {
    sessions: {
      create: vi.fn().mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/c/pay/cs_test_123',
      }),
    },
  },
  subscriptions: {
    retrieve: vi.fn().mockResolvedValue({
      id: 'sub_123',
      status: 'active',
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    }),
    update: vi.fn().mockResolvedValue({ id: 'sub_123' }),
  },
  customers: {
    create: vi.fn().mockResolvedValue({ id: 'cus_123' }),
  },
}));

vi.mock('stripe', () => ({
  default: function() { return stripeMock; },
}));
```

#### Lifecycle Prompt Mock
```typescript
// Add to setup.ts
const lifecycleMock = {
  loadCeremonyPrompt: vi.fn().mockResolvedValue('Mocked ceremony prompt'),
  loadEvolutionPrompt: vi.fn().mockResolvedValue('Mocked evolution prompt'),
  loadReleasePrompt: vi.fn().mockResolvedValue('Mocked release prompt'),
};
```

### Test Fixtures Needed

#### Lifecycle Fixtures
```typescript
// /home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/fixtures/lifecycle.ts
export const createMockEvolutionHistory = (overrides = {}) => ({
  id: 'evol-history-123',
  dream_id: 'dream-123',
  user_id: 'user-123',
  previous_title: 'Original Dream',
  new_title: 'Evolved Dream',
  evolution_reflection: 'My journey has evolved...',
  ai_synthesis: 'The evolution of your dream reflects...',
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockAchievementArtifact = (overrides = {}) => ({
  id: 'artifact-123',
  dream_id: 'dream-123',
  user_id: 'user-123',
  artifact_type: 'achievement',
  ceremony_text: 'You have achieved your dream...',
  created_at: new Date().toISOString(),
  ...overrides,
});
```

## Summary of Recommendations

1. **Create lifecycle integration tests** - Highest priority gap affecting dream completion ceremonies
2. **Complete auth flow tests** - Password reset, email verification, demo accounts
3. **Add subscriptions tests** - Important for Stripe integration verification
4. **Implement cross-router journey tests** - Test full user flows end-to-end
5. **Consider database transaction tests** - For data integrity validation

## Test Count Summary

| Category | Existing | Needed | Total Target |
|----------|----------|--------|--------------|
| Auth | ~35 | ~25 | 60 |
| Dreams | ~50 | ~5 | 55 |
| Reflections | ~95 | ~5 | 100 |
| Clarify | ~80 | ~5 | 85 |
| Evolution | ~60 | ~5 | 65 |
| Visualizations | ~35 | ~5 | 40 |
| Users | ~20 | ~10 | 30 |
| **Lifecycle** | 0 | ~20 | 20 |
| **Subscriptions** | 0 | ~10 | 10 |
| **Journeys** | 0 | ~8 | 8 |
| **Total** | ~375 | ~98 | ~473 |
