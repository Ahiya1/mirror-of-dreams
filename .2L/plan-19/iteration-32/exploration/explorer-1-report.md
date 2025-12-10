# Explorer 1 Report: tRPC Router Integration Test Analysis

## Executive Summary

This report analyzes the Mirror of Dreams tRPC router architecture to identify critical procedures for integration testing. The codebase has 13 routers with approximately 60+ procedures. Existing test infrastructure includes mocks for Supabase and Anthropic, plus user fixtures. Key dependencies requiring mocking are Supabase (database), Anthropic (AI), PayPal (payments), and cookie/JWT handling.

## Discoveries

### Router Architecture Overview

The application uses 13 tRPC routers organized by domain:

| Router | Procedures | Priority | Dependencies |
|--------|-----------|----------|--------------|
| `auth` | 8 | HIGH | Supabase, bcrypt, JWT, cookies, email |
| `dreams` | 8 | HIGH | Supabase |
| `reflections` | 6 | HIGH | Supabase |
| `reflection` | 1 | HIGH | Supabase, Anthropic |
| `subscriptions` | 5 | HIGH | Supabase, PayPal |
| `users` | 6 | MEDIUM | Supabase, bcrypt, JWT |
| `clarify` | 9 | MEDIUM | Supabase, Anthropic |
| `evolution` | 5 | MEDIUM | Supabase, Anthropic |
| `admin` | 8 | LOW | Supabase |
| `lifecycle` | TBD | LOW | Supabase |
| `artifact` | TBD | LOW | Supabase |
| `visualizations` | TBD | LOW | Supabase |

### Middleware/Procedure Types

Located in `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/middleware.ts`:

1. **`publicProcedure`** - No auth required
2. **`protectedProcedure`** - Requires authenticated user
3. **`creatorProcedure`** - Requires creator/admin role
4. **`premiumProcedure`** - Requires paid tier
5. **`usageLimitedProcedure`** - Auth + not demo + usage limit check
6. **`writeProcedure`** - Auth + not demo
7. **`clarifyProcedure`** - Auth + not demo + paid tier
8. **`clarifySessionLimitedProcedure`** - Clarify + session limit
9. **`authRateLimitedProcedure`** - IP rate limited
10. **`aiRateLimitedProcedure`** - User rate limited
11. **`writeRateLimitedProcedure`** - User rate limited

### Context Creation

Located in `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/context.ts`:

- JWT verification from cookie (preferred) or Authorization header
- Fresh user data fetched from Supabase on each request
- Monthly usage counter reset logic

## Priority Procedures for Integration Testing

### Priority 1: Authentication (CRITICAL)

**Router:** `auth` at `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/auth.ts`

| Procedure | Type | Test Cases |
|-----------|------|------------|
| `signup` | mutation | New user creation, duplicate email rejection, password hashing, JWT generation, cookie setting, email verification token |
| `signin` | mutation | Valid credentials, invalid email, invalid password, monthly reset logic, JWT generation |
| `signout` | mutation | Cookie clearing |
| `verifyToken` | query | Valid token returns user, invalid/expired token rejected |
| `me` | query | Returns authenticated user |
| `updateProfile` | mutation | Name/language update |
| `changePassword` | mutation | Current password verification, new password validation, same password rejection |
| `deleteAccount` | mutation | Email confirmation, password verification, cascade delete |
| `loginDemo` | mutation | Demo user login, special JWT flags |

### Priority 2: Dreams CRUD (CRITICAL)

**Router:** `dreams` at `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/dreams.ts`

| Procedure | Type | Test Cases |
|-----------|------|------------|
| `create` | mutation | Tier limit enforcement (free:2, pro:5, unlimited:999999), field validation, usage response |
| `list` | query | Filter by status, includeStats option, proper ordering |
| `get` | query | Single dream with stats, ownership verification |
| `update` | mutation | Ownership verification, partial updates |
| `updateStatus` | mutation | Status transitions (active/achieved/archived/released), timestamps |
| `delete` | mutation | Ownership verification, cascade behavior |
| `getLimits` | query | Correct tier limits returned |

### Priority 3: Reflections CRUD (CRITICAL)

**Router:** `reflections` at `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/reflections.ts`

| Procedure | Type | Test Cases |
|-----------|------|------------|
| `list` | query | Pagination, filtering (tone, isPremium), search, sorting |
| `getById` | query | Ownership verification, view count increment |
| `update` | mutation | Title/tags update, ownership verification |
| `delete` | mutation | Ownership verification, usage counter decrement |
| `submitFeedback` | mutation | Rating validation (1-10), optional feedback |
| `checkUsage` | query | Correct tier limits, creator/admin bypass |

### Priority 4: AI Reflection Generation (HIGH)

**Router:** `reflection` at `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/reflection.ts`

| Procedure | Type | Test Cases |
|-----------|------|------------|
| `create` | mutation | Dream linking, premium detection, Anthropic API call, response storage, usage counter update, evolution eligibility check |

**Anthropic Mock Scenarios:**
- Successful text response
- Extended thinking response (premium)
- API error handling
- Rate limit handling

### Priority 5: Subscriptions (HIGH)

**Router:** `subscriptions` at `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/subscriptions.ts`

| Procedure | Type | Test Cases |
|-----------|------|------------|
| `getStatus` | query | Free tier default, active subscription details, next billing calculation |
| `createCheckout` | mutation | PayPal plan ID retrieval, approval URL generation |
| `getPlanId` | query | Correct plan IDs for tier/period combinations |
| `activateSubscription` | mutation | PayPal verification, tier update, database update |
| `cancel` | mutation | PayPal cancellation, local status update |

### Priority 6: Users (MEDIUM)

**Router:** `users` at `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/users.ts`

| Procedure | Type | Test Cases |
|-----------|------|------------|
| `completeOnboarding` | mutation | Flag update |
| `getProfile` | query | Comprehensive user data, calculated metrics |
| `updateProfile` | mutation | Field updates |
| `changeEmail` | mutation | Email uniqueness, password verification, new JWT |
| `updatePreferences` | mutation | JSONB merge, partial updates |
| `getUsageStats` | query | Statistics calculation |
| `getDashboardData` | query | Combined data fetch |

### Priority 7: Clarify Sessions (MEDIUM)

**Router:** `clarify` at `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/clarify.ts`

Key test areas:
- Session creation with initial message
- Message sending with AI response
- Tool use handling (createDream)
- Session ownership verification
- Tier-based access control

### Priority 8: Evolution Reports (MEDIUM)

**Router:** `evolution` at `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/evolution.ts`

Key test areas:
- Threshold checking (4 for dream-specific, 12 for cross-dream)
- Temporal distribution selection
- API usage logging
- Cost calculation

## Dependencies to Mock

### 1. Supabase Client (EXISTING MOCK)

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/mocks/supabase.ts`

**Capabilities:**
- Chainable query builder mock
- Auth mock (not heavily used - custom JWT auth)
- Storage mock
- RPC mock

**Enhancement Needed:**
- Add count support for pagination
- Add transaction support
- Add join support for foreign key relations

### 2. Anthropic Client (EXISTING MOCK)

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/mocks/anthropic.ts`

**Capabilities:**
- Message response mocking
- Thinking response mocking
- Streaming mock
- Error scenarios (rate limit, auth, server error)

**Enhancement Needed:**
- Tool use response mocking for Clarify
- Token count in usage

### 3. PayPal Client (NEW MOCK NEEDED)

**Location:** Create at `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/mocks/paypal.ts`

**Functions to mock:**
```typescript
export const createPayPalMock = () => ({
  createSubscription: vi.fn().mockResolvedValue('https://paypal.com/approve/test'),
  cancelSubscription: vi.fn().mockResolvedValue(undefined),
  getSubscriptionDetails: vi.fn().mockResolvedValue({
    id: 'I-TEST123',
    status: 'ACTIVE',
    plan_id: 'P-PRO-MONTHLY',
    subscriber: {
      payer_id: 'PAYER123',
      email_address: 'test@example.com',
      name: { given_name: 'Test', surname: 'User' }
    },
    billing_info: {
      next_billing_time: '2025-02-01',
      cycle_executions: []
    }
  }),
  verifyWebhookSignature: vi.fn().mockResolvedValue(true),
  getPlanId: vi.fn().mockReturnValue('P-PRO-MONTHLY'),
  determineTierFromPlanId: vi.fn().mockReturnValue('pro'),
  determinePeriodFromPlanId: vi.fn().mockReturnValue('monthly'),
});
```

### 4. Cookie/JWT Handling (NEW MOCK NEEDED)

**Location:** Create at `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/mocks/cookies.ts`

**Functions to mock:**
```typescript
export const createCookieMock = () => ({
  getAuthCookie: vi.fn().mockResolvedValue(null),
  setAuthCookie: vi.fn().mockResolvedValue(undefined),
  clearAuthCookie: vi.fn().mockResolvedValue(undefined),
});
```

### 5. Rate Limiter (CONSIDER MOCKING)

Rate limiting should be disabled/mocked in tests to avoid test pollution.

## Test Data Fixtures Needed

### 1. Users (EXISTING)

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/fixtures/users.ts`

Pre-configured scenarios:
- `freeTierUser`, `freeTierAtLimit`
- `proTierUser`, `proTierAtDailyLimit`
- `unlimitedTierUser`, `unlimitedTierAtDailyLimit`
- `canceledSubscriptionUser`, `expiredSubscriptionUser`
- `creatorUser`, `adminUser`, `demoUser`
- `hebrewUser`, `customPreferencesUser`, `newUser`

### 2. Dreams (NEW FIXTURE NEEDED)

**Location:** Create at `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/fixtures/dreams.ts`

```typescript
export interface DreamRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  category: string;
  priority: number;
  status: 'active' | 'achieved' | 'archived' | 'released';
  achieved_at: string | null;
  archived_at: string | null;
  released_at: string | null;
  created_at: string;
  updated_at: string;
}

export const createMockDream = (overrides: Partial<DreamRow> = {}): DreamRow => ({
  id: 'dream-uuid-1234',
  user_id: 'test-user-uuid-1234',
  title: 'Learn to play guitar',
  description: 'Master basic chords and play my favorite songs',
  target_date: '2025-12-31',
  category: 'creative',
  priority: 5,
  status: 'active',
  achieved_at: null,
  archived_at: null,
  released_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// Pre-configured scenarios
export const activeDream = createMockDream();
export const achievedDream = createMockDream({ status: 'achieved', achieved_at: new Date().toISOString() });
export const archivedDream = createMockDream({ status: 'archived', archived_at: new Date().toISOString() });
```

### 3. Reflections (NEW FIXTURE NEEDED)

**Location:** Create at `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/fixtures/reflections.ts`

```typescript
export const createMockReflectionRow = (overrides: Partial<ReflectionRow> = {}): ReflectionRow => ({
  id: 'reflection-uuid-1234',
  user_id: 'test-user-uuid-1234',
  dream_id: 'dream-uuid-1234',
  dream: 'I want to learn guitar',
  plan: 'Practice 30 minutes daily',
  has_date: 'yes',
  dream_date: '2025-12-31',
  relationship: 'This dream connects me to my creative side',
  offering: 'Time and dedication',
  ai_response: 'Your journey with guitar speaks to...',
  tone: 'fusion',
  is_premium: false,
  word_count: 350,
  estimated_read_time: 2,
  title: 'Learning Guitar',
  tags: ['creativity', 'music'],
  rating: null,
  user_feedback: null,
  view_count: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});
```

### 4. Subscriptions (NEW FIXTURE NEEDED)

**Location:** Create at `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/fixtures/subscriptions.ts`

```typescript
export const mockSubscriptionStatuses = {
  freeDefault: {
    tier: 'free',
    status: null,
    period: null,
    isActive: false,
    isSubscribed: false,
    cancelAtPeriodEnd: false,
  },
  proActive: {
    tier: 'pro',
    status: 'active',
    period: 'monthly',
    isActive: true,
    isSubscribed: true,
    cancelAtPeriodEnd: false,
    paypal_subscription_id: 'I-PRO123',
  },
  proCanceled: {
    tier: 'pro',
    status: 'active',
    period: 'monthly',
    isActive: true,
    isSubscribed: true,
    cancelAtPeriodEnd: true,
    paypal_subscription_id: 'I-PRO456',
  },
};
```

## Integration Test File Structure Recommendation

```
test/
├── mocks/
│   ├── anthropic.ts          # EXISTING
│   ├── supabase.ts           # EXISTING
│   ├── paypal.ts             # NEW
│   ├── cookies.ts            # NEW
│   └── index.ts              # NEW - re-exports all mocks
├── fixtures/
│   ├── users.ts              # EXISTING
│   ├── dreams.ts             # NEW
│   ├── reflections.ts        # NEW
│   ├── subscriptions.ts      # NEW
│   ├── clarify-sessions.ts   # NEW (if testing clarify)
│   └── index.ts              # NEW - re-exports all fixtures
├── integration/
│   ├── setup.ts              # Test caller setup with mocked dependencies
│   ├── auth/
│   │   ├── signup.test.ts
│   │   ├── signin.test.ts
│   │   ├── signout.test.ts
│   │   ├── verify-token.test.ts
│   │   └── password.test.ts
│   ├── dreams/
│   │   ├── create.test.ts
│   │   ├── list.test.ts
│   │   ├── update.test.ts
│   │   └── delete.test.ts
│   ├── reflections/
│   │   ├── list.test.ts
│   │   ├── create.test.ts    # AI generation
│   │   ├── update.test.ts
│   │   └── feedback.test.ts
│   ├── subscriptions/
│   │   ├── status.test.ts
│   │   ├── checkout.test.ts
│   │   ├── activate.test.ts
│   │   └── cancel.test.ts
│   └── users/
│       ├── profile.test.ts
│       ├── preferences.test.ts
│       └── email.test.ts
└── helpers/
    ├── create-test-caller.ts  # Creates tRPC caller with mocked context
    └── assertions.ts          # Common assertion helpers
```

## Test Caller Setup Pattern

```typescript
// test/integration/setup.ts
import { appRouter } from '@/server/trpc/routers/_app';
import { createSupabaseMock } from '@/test/mocks/supabase';
import { createMockUser, freeTierUser } from '@/test/fixtures/users';

export function createTestCaller(user: User | null = freeTierUser) {
  const supabaseMock = createSupabaseMock();
  
  // Mock the supabase import
  vi.mock('@/server/lib/supabase', () => ({
    supabase: supabaseMock,
  }));
  
  // Create caller with mocked context
  const caller = appRouter.createCaller({
    user,
    req: new Request('http://localhost:3000'),
  });
  
  return {
    caller,
    supabase: supabaseMock,
    // Helper to configure specific query responses
    mockQuery: (table: string, response: any) => {
      supabaseMock.from.mockImplementation((t: string) => {
        if (t === table) {
          return createSupabaseQueryMock(response);
        }
        return createSupabaseQueryMock({ data: null, error: null });
      });
    },
  };
}
```

## Risks and Challenges

### Technical Risks

1. **Context Mocking Complexity** - The context creation involves JWT verification and database fetch. Need to mock at appropriate level.

2. **Rate Limiter State** - Tests may interfere with each other if rate limiter state persists.

3. **Cookie Handling** - Next.js cookies API needs proper mocking in test environment.

4. **Anthropic Streaming** - Streaming tests require async iterator mocking.

### Complexity Risks

1. **AI Response Validation** - Difficult to assert on AI-generated content; focus on structure.

2. **PayPal Integration** - External API responses need comprehensive mocking.

3. **Monthly Reset Logic** - Time-dependent tests need careful date mocking.

## Recommendations for Planner

1. **Start with auth router tests** - Foundation for all other tests requiring authenticated users.

2. **Create comprehensive fixtures first** - Dreams, reflections, subscriptions fixtures needed before integration tests.

3. **Extend existing mocks** - Supabase mock needs count/join support enhancement.

4. **Mock at module level** - Use `vi.mock()` for Supabase, Anthropic, PayPal imports rather than function-level mocking.

5. **Disable rate limiting in tests** - Add environment check to bypass rate limiting.

6. **Use createCaller pattern** - Direct procedure calling without HTTP layer for unit-style integration tests.

7. **Consider test database option** - For true integration tests, Supabase local dev instance may be valuable.

## Resource Map

### Critical Files/Directories

| Path | Purpose |
|------|---------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/_app.ts` | Root router combining all routers |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/context.ts` | Request context creation |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/middleware.ts` | Auth and permission middlewares |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/trpc.ts` | tRPC instance and base procedures |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/mocks/` | Existing mock factories |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/fixtures/` | Test data factories |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/vitest.config.ts` | Test configuration |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/vitest.setup.ts` | Test environment setup |

### Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `vitest` | - | Test runner |
| `@trpc/server` | - | tRPC server |
| `@supabase/supabase-js` | - | Database client |
| `@anthropic-ai/sdk` | - | AI client |
| `jsonwebtoken` | - | JWT handling |
| `bcryptjs` | - | Password hashing |

## Questions for Planner

1. Should we prioritize unit-style integration tests (mocked dependencies) or true integration tests (real Supabase local)?

2. Should rate limiting be completely disabled in test environment or selectively bypassed?

3. What coverage threshold should we target for integration tests?

4. Should clarify/evolution routers be included in this iteration or deferred?

5. Do we need E2E tests in addition to integration tests for critical flows?
