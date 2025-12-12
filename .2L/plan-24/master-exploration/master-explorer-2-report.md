# Master Exploration Report

## Explorer ID
master-explorer-2

## Focus Area
Dependencies & Mocking Strategy

## Vision Summary
Achieve 95%+ test coverage by expanding unit, integration, and E2E tests, with specific focus on mocking external services (PayPal, Anthropic, Supabase, S3) to enable comprehensive testing of undertested areas.

---

## External Service Dependencies Inventory

### 1. Supabase (Database & Auth)

**Files Affected:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/supabase.ts` - Client singleton
- All routers via database queries

**Current Coverage:**
- Supabase client wrapper: 0%
- Integration tests use `test/integration/setup.ts` with comprehensive mocks

**Current Mocking Pattern:**
```typescript
// From test/mocks/supabase.ts
export const createSupabaseMock = () => ({
  from: vi.fn((table: string) => createSupabaseQueryMock({ data: null, error: null })),
  auth: createSupabaseAuthMock(),
  storage: createSupabaseStorageMock(),
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
});
```

**Mock Quality:** EXCELLENT
- Full chainable query builder pattern (select, insert, update, delete, eq, gt, lt, etc.)
- Auth methods (getUser, signInWithPassword, signUp, signOut, resetPasswordForEmail)
- Storage methods (upload, download, remove, getPublicUrl)
- Helper factories for success/error responses

**Gap Assessment:** LOW RISK
- Mock infrastructure is mature
- Need to test the actual `supabase.ts` client initialization (0% coverage)

---

### 2. Anthropic (Claude AI)

**Files Affected:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/clarify.ts`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/reflection.ts`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/evolution.ts`

**Current Coverage:**
- Clarify router: 45.62% (undertested AI conversation logic)

**Current Mocking Pattern:**
```typescript
// From test/mocks/anthropic.ts
export const createAnthropicMock = () => ({
  messages: {
    create: createMessagesCreateMock(),
    stream: createMessagesStreamMock(),
  },
  beta: {
    messages: {
      create: createMessagesCreateMock(),
      stream: createMessagesStreamMock(),
    },
  },
});
```

**Mock Quality:** EXCELLENT
- Standard message responses with content blocks
- Streaming mock with async iterator
- Extended thinking support
- Pre-built scenarios (reflection, clarify, evolution, withThinking, minimal)
- Error factories (unauthorized, rateLimited, invalidRequest, serverError)

**Gap Assessment:** MEDIUM RISK
- Streaming behavior needs more coverage in clarify tests
- Tool use flows untested (createSession with initial message)
- Pattern extraction from AI responses untested

---

### 3. PayPal (Payments)

**Files Affected:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/paypal.ts` (89.39% coverage)
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/subscription/PayPalCheckoutModal.tsx` (0% coverage)

**Current Coverage:**
- Server-side paypal.ts: 89.39%
- Client-side PayPalCheckoutModal: 0%

**Current Mocking Pattern:**
```typescript
// From test/integration/subscriptions/subscriptions.test.ts
const paypalMock = vi.hoisted(() => ({
  createSubscription: vi.fn().mockResolvedValue('https://paypal.com/approve/123'),
  cancelSubscription: vi.fn().mockResolvedValue(undefined),
  getPlanId: vi.fn().mockImplementation((tier, period) => `P-${tier.toUpperCase()}-${period.toUpperCase()}`),
  getSubscriptionDetails: vi.fn().mockResolvedValue({...}),
  determineTierFromPlanId: vi.fn().mockReturnValue('pro'),
  determinePeriodFromPlanId: vi.fn().mockReturnValue('monthly'),
}));
vi.mock('@/server/lib/paypal', () => paypalMock);
```

**Client-side SDK:**
```typescript
// PayPalCheckoutModal uses @paypal/react-paypal-js
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
```

**Mock Quality:** GOOD (server), MISSING (client)
- Server-side PayPal functions well mocked
- No mock for `@paypal/react-paypal-js` SDK

**Gap Assessment:** HIGH RISK
- PayPalCheckoutModal component has 0% coverage
- Need to mock PayPalScriptProvider and PayPalButtons
- Subscription components depend on PayPal SDK

**Recommended Mock for PayPal SDK:**
```typescript
// test/mocks/paypal-sdk.ts
vi.mock('@paypal/react-paypal-js', () => ({
  PayPalScriptProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PayPalButtons: vi.fn(({ createSubscription, onApprove, onError, onCancel }) => (
    <button
      data-testid="paypal-button"
      onClick={() => onApprove?.({ subscriptionID: 'mock-subscription-id' })}
    >
      PayPal Button
    </button>
  )),
}));
```

---

### 4. S3 / File Storage

**Files Affected:**
- Storage handled through Supabase Storage (not direct S3)

**Current Status:**
- Supabase storage mock already exists in `test/mocks/supabase.ts`
- No direct AWS S3 SDK usage found in codebase

**Mock Quality:** GOOD
- `createSupabaseStorageMock()` handles upload, download, remove, getPublicUrl, createSignedUrl, list

**Gap Assessment:** LOW RISK
- Storage is abstracted through Supabase
- Existing mock coverage is adequate

---

## Current Mocking Patterns Analysis

### Integration Test Setup (`test/integration/setup.ts`)

**Strengths:**
1. Uses `vi.hoisted()` for proper mock initialization before imports
2. Centralized `createTestCaller()` factory pattern
3. Returns mock utilities alongside caller for flexible assertions
4. Includes `mockQuery()` and `mockQueries()` helpers for table-specific responses
5. Comprehensive module mocking for all external dependencies

**Pattern Example:**
```typescript
export function createTestCaller(user: User | null = null) {
  vi.clearAllMocks();
  const caller = appRouter.createCaller({ user, req: new Request('http://localhost:3000') });
  return {
    caller,
    supabase: supabaseMock,
    cookies: cookieMock,
    mockQuery: <T>(table: string, response: SupabaseQueryResponse<T>) => {...},
    mockQueries: (tableResponses: Record<string, SupabaseQueryResponse<any>>) => {...},
    resetMocks: () => {...},
  };
}
```

**Mocked Modules:**
- `@/server/lib/supabase` - Database client
- `@/server/lib/cookies` - Auth cookies
- `@/server/lib/rate-limiter` - Rate limiting (bypassed)
- `@/server/lib/logger` - Logging (suppressed)
- `@/server/lib/email` - Email sending
- `@/server/lib/cache` - Caching layer
- `@/server/lib/prompts` - AI prompts
- `@anthropic-ai/sdk` - Claude AI

### Component Test Setup (`test/helpers/render.tsx`)

**Strengths:**
1. `renderWithProviders()` wraps components with QueryClientProvider
2. Returns QueryClient for cache manipulation
3. Test-optimized settings (no retries, no cache, no refetch)

**tRPC Mock Helpers (`test/helpers/trpc.ts`):**
- `createMockQueryResult<T>(data)` - Success state
- `createMockLoadingResult<T>()` - Loading state
- `createMockErrorResult<T>(error)` - Error state
- `createMockMutation<I,O>(options)` - Mutation mocking
- `createMockInfiniteQueryResult<T>(pages, options)` - Paginated queries
- `createMockContext(user, req)` - tRPC context

### Test Factories (`test/factories/`)

**Available Factories:**
| Factory | File | Purpose |
|---------|------|---------|
| User | `user.factory.ts` | User objects with tier variations |
| Dream | `dream.factory.ts` | Dreams with status/category variations |
| Reflection | `reflection.factory.ts` | Reflections with tone variations |
| Clarify | `clarify.factory.ts` | Sessions, messages, patterns |

**Pre-configured Scenarios:**
- `freeTierUser`, `proTierUser`, `unlimitedTierUser`, `creatorUser`, `adminUser`, `demoUser`
- `activeDream`, `achievedDream`, `archivedDream`, `releasedDream`
- `basicReflection`, `premiumReflection`, `gentleReflection`, `intenseReflection`
- `activeSession`, `archivedSession`, `userMessage`, `assistantMessage`, `messageWithToolUse`

---

## Recommended Mocking Strategies for Each Service

### 1. Supabase Client Testing (0% -> 90%)

**Strategy:** Test initialization and error handling

**New Mock Needed:** None (existing mock sufficient)

**Test Focus:**
```typescript
// server/lib/__tests__/supabase.test.ts
describe('Supabase Client', () => {
  it('should create client with environment variables', () => {
    // Test client initialization
  });
  it('should handle missing SUPABASE_URL', () => {
    // Test placeholder fallback
  });
  it('should handle missing SUPABASE_SERVICE_ROLE_KEY', () => {
    // Test placeholder fallback
  });
});
```

**Risk:** LOW - Simple module, existing patterns work

---

### 2. PayPal SDK Component Testing (0% -> 90%)

**Strategy:** Mock `@paypal/react-paypal-js` components

**New Mock Required:**
```typescript
// test/mocks/paypal-sdk.tsx
import { vi } from 'vitest';
import React from 'react';

export const mockPayPalOnApprove = vi.fn();
export const mockPayPalOnError = vi.fn();
export const mockPayPalOnCancel = vi.fn();
export const mockCreateSubscription = vi.fn();

export const PayPalScriptProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export const PayPalButtons = vi.fn(({
  createSubscription,
  onApprove,
  onError,
  onCancel,
  style
}) => {
  // Store callbacks for test triggering
  mockCreateSubscription.mockImplementation(createSubscription);
  mockPayPalOnApprove.mockImplementation(onApprove);
  mockPayPalOnError.mockImplementation(onError);
  mockPayPalOnCancel.mockImplementation(onCancel);

  return (
    <div data-testid="paypal-buttons" data-style={JSON.stringify(style)}>
      <button
        data-testid="paypal-subscribe-button"
        onClick={() => onApprove?.({ subscriptionID: 'I-MOCK-SUB-123' })}
      >
        Subscribe with PayPal
      </button>
      <button
        data-testid="paypal-cancel-button"
        onClick={() => onCancel?.()}
      >
        Cancel
      </button>
      <button
        data-testid="paypal-error-button"
        onClick={() => onError?.({ message: 'Mock payment error' })}
      >
        Trigger Error
      </button>
    </div>
  );
});

// Module mock
vi.mock('@paypal/react-paypal-js', () => ({
  PayPalScriptProvider,
  PayPalButtons,
}));
```

**Test Scenarios:**
1. Render checkout modal with loading state
2. Render with plan data loaded
3. Successful subscription approval flow
4. Payment error handling
5. Payment cancellation
6. Missing PayPal client ID error state

**Risk:** MEDIUM - New mock pattern needed, but straightforward

---

### 3. Anthropic Streaming & Tool Use Testing

**Strategy:** Extend existing mock for tool use scenarios

**Enhanced Mock Pattern:**
```typescript
// In test/mocks/anthropic.ts - add tool use support
export const createToolUseStreamMock = (toolName: string, toolInput: object) => {
  const mockStream = {
    on: vi.fn().mockReturnThis(),
    [Symbol.asyncIterator]: vi.fn().mockImplementation(async function* () {
      yield { type: 'content_block_start', index: 0, content_block: { type: 'tool_use', id: 'tool_1', name: toolName, input: {} } };
      yield { type: 'content_block_delta', index: 0, delta: { type: 'input_json_delta', partial_json: JSON.stringify(toolInput) } };
      yield { type: 'content_block_stop', index: 0 };
      yield { type: 'message_stop' };
    }),
    finalMessage: vi.fn().mockResolvedValue({
      ...createMockMessageResponse(),
      content: [{ type: 'tool_use', id: 'tool_1', name: toolName, input: toolInput }],
      stop_reason: 'tool_use',
    }),
  };
  return vi.fn().mockReturnValue(mockStream);
};

export const mockToolResponses = {
  createDream: createToolUseStreamMock('create_dream', {
    title: 'AI Generated Dream',
    category: 'personal_growth'
  }),
  readDreams: createToolUseStreamMock('read_dreams', {}),
};
```

**Test Scenarios:**
1. Session creation without initial message
2. Session creation with initial message (triggers AI)
3. Send message with text response
4. Send message with tool use (create_dream)
5. Pattern extraction from conversation history
6. Error recovery in AI calls

**Risk:** MEDIUM - Streaming behavior complex, but mock pattern established

---

### 4. Cookies Module Testing (33% -> 90%)

**Current State:** Tests exist but use configuration validation approach

**Strategy:** Add actual function behavior tests with Next.js cookies() mock

**New Test Approach:**
```typescript
// Enhanced test pattern for actual cookie operations
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    set: vi.fn(),
    get: vi.fn().mockReturnValue({ value: 'mock-token' }),
    delete: vi.fn(),
  })),
}));

describe('Cookie Functions', () => {
  it('getAuthCookie should return token from cookie store', async () => {
    const result = await getAuthCookie();
    expect(result).toBe('mock-token');
  });

  it('setAuthCookie should call cookies().set with correct options', async () => {
    await setAuthCookie('new-token', false);
    expect(cookies().set).toHaveBeenCalledWith('auth_token', 'new-token', expect.objectContaining({
      httpOnly: true,
      sameSite: 'lax',
    }));
  });

  it('clearAuthCookie should delete the auth cookie', async () => {
    await clearAuthCookie();
    expect(cookies().delete).toHaveBeenCalledWith('auth_token');
  });
});
```

**Risk:** MEDIUM - Next.js cookies() API requires careful mocking

---

## Risk Assessment for Complex Mocking Scenarios

### HIGH RISK

| Area | Risk Factor | Mitigation |
|------|-------------|------------|
| PayPal Component Tests | No existing SDK mock | Create dedicated mock module with test triggers |
| Clarify Tool Use | Complex streaming + tool handling | Use simplified mock that returns tool_use content blocks |
| E2E PayPal Flow | External service in E2E | Mock at API level, not SDK level |

### MEDIUM RISK

| Area | Risk Factor | Mitigation |
|------|-------------|------------|
| Auth Router Tests | Multiple DB calls per operation | Use sequential call tracking in mock |
| Cookies Module | Next.js headers API | Mock next/headers module |
| tRPC Core | Sentry integration | Mock @sentry/nextjs |

### LOW RISK

| Area | Risk Factor | Mitigation |
|------|-------------|------------|
| Supabase Client | Simple initialization | Test env variable handling |
| Dashboard Components | Pure render tests | Use existing tRPC mock helpers |
| Shared Components | UI-only logic | Standard testing-library approach |

---

## Dependencies Between Test Areas

### Dependency Graph

```
FOUNDATION (Iteration 1)
├── Supabase Client Tests
│   └── Required by: All integration tests
├── Cookies Module Tests
│   └── Required by: Auth Router Tests
├── tRPC Core Tests
│   └── Required by: All router tests
│
CORE ROUTERS (Iteration 1 continuation)
├── Auth Router Tests (70% -> 90%)
│   └── Depends on: Cookies, Supabase
├── Clarify Router Tests (45% -> 90%)
│   └── Depends on: Anthropic mock, Supabase, Cache
│
COMPONENTS (Iteration 2)
├── Dashboard Components
│   └── Depends on: tRPC mock helpers
├── Subscription Components
│   └── Depends on: PayPal SDK mock (NEW)
├── Clarify Components
│   └── Depends on: tRPC mock helpers
│
E2E EXPANSION (Iteration 3)
├── Profile E2E
│   └── Depends on: Auth flow
├── Subscription E2E
│   └── Depends on: Mock PayPal API responses
├── Clarify E2E
│   └── Depends on: Mock Anthropic API
```

### Critical Path

1. **PayPal SDK Mock** must be created before subscription component tests
2. **Cookies actual function tests** must be added before auth router full coverage
3. **Anthropic tool use mock** must be enhanced before clarify sendMessage tests

---

## Recommendations for Master Plan

### 1. Create PayPal SDK Mock Module First

**Priority:** HIGH
**Effort:** 2-3 hours
**Reason:** Blocks all 8 subscription components (0% -> 90%)

**Deliverable:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/mocks/paypal-sdk.tsx`

### 2. Enhance Anthropic Mock for Tool Use

**Priority:** MEDIUM
**Effort:** 1-2 hours
**Reason:** Required for clarify sendMessage coverage (45% -> 90%)

**Deliverable:** Extend `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/mocks/anthropic.ts`

### 3. Add Next.js cookies() Mock Pattern

**Priority:** MEDIUM
**Effort:** 1 hour
**Reason:** Required for cookies module tests (33% -> 90%)

**Deliverable:** Pattern in `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/__tests__/cookies.test.ts`

### 4. Consider MSW for E2E API Mocking

**Priority:** LOW (for E2E phase)
**Effort:** 4-6 hours
**Reason:** Would enable more realistic E2E tests for payment flows

**Note:** MSW package is already in package-lock.json but not actively used

---

## Iteration Breakdown Recommendation

### Recommendation: MULTI-ITERATION (3 phases)

**Rationale:**
- Clear dependency order (mocks -> routers -> components -> E2E)
- Some mock infrastructure needed before component tests
- E2E requires different mocking approach than unit tests

### Iteration 1: Server-Side Remaining Gaps

**Focus:** Complete server-side coverage first
**Dependencies:** Existing mock infrastructure sufficient

**Scope:**
- Clarify router (45% -> 90%)
- Auth router (70% -> 90%)
- Cookies module (33% -> 90%)
- Supabase client (0% -> 90%)
- tRPC core (57% -> 90%)

**Risk:** LOW - All mocks already exist

### Iteration 2: Component Coverage

**Focus:** Component tests with new PayPal mock
**Dependencies:** PayPal SDK mock must be created

**Pre-requisite Task:** Create PayPal SDK mock

**Scope:**
- Subscription components (0% -> 90%)
- Dashboard card gaps
- Clarify components (0% -> 90%)
- Dreams component gaps
- Shared component gaps

**Risk:** MEDIUM - New PayPal mock required

### Iteration 3: E2E Expansion

**Focus:** End-to-end user flow coverage
**Dependencies:** API-level mocking for external services

**Scope:**
- Profile E2E
- Subscription E2E (mocked PayPal)
- Admin E2E
- Clarify E2E (mocked Anthropic)
- Error handling E2E

**Risk:** MEDIUM - E2E mocking more complex

---

## Notes & Observations

1. **Mock Quality is High:** The existing mock infrastructure in `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/` is well-designed and follows best practices (factories, helpers, fixtures).

2. **PayPal SDK Gap is Critical:** The only significant missing mock is for `@paypal/react-paypal-js`, which blocks 8 subscription components at 0%.

3. **No Direct S3 Usage:** Storage is handled through Supabase Storage, simplifying the mocking requirements.

4. **E2E Tests Use Page Objects:** Existing E2E tests follow the Page Object pattern (e.g., `SignInPage`), which is good practice.

5. **Test Count Projection:**
   - Current: 3477 tests
   - New tests needed: ~775
   - Target: ~4250 tests

6. **Coverage Targets are Achievable:** Given the mature mock infrastructure, reaching 95% line coverage is realistic within 3 iterations.

---

*Exploration completed: 2025-12-12*
*This report informs master planning decisions*
