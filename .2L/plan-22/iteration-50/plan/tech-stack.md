# Technology Stack - Integration Tests Expansion

## Testing Framework

**Decision:** Vitest 1.x

**Rationale:**
- Already established as the project's testing framework
- Fast execution with native ESM support
- Compatible with existing test infrastructure in `test/integration/setup.ts`
- `vi.hoisted()` and `vi.mock()` patterns already proven in codebase

**Configuration:**
- Config file: `vitest.config.ts` (existing)
- Integration test glob: `test/integration/**/*.test.ts`

## Mocking Strategy

**Decision:** Vitest native mocking with hoisted mocks

**Rationale:**
- Existing setup in `test/integration/setup.ts` provides comprehensive mocking infrastructure
- `vi.hoisted()` ensures mocks are defined before `vi.mock()` runs
- Supports `mockImplementation`, `mockResolvedValue`, `mockRejectedValue`

**Key Mocks (Existing):**
- `supabaseMock` - Full Supabase client with query builder chain
- `anthropicMock` - Anthropic API for AI generation
- `cookieMock` - Auth cookie operations
- `cacheMock` - Redis cache operations
- `promptsMock` - Prompt file loading
- `rateLimitMock` - Rate limiter bypass

**New Mocks Needed:**

### PayPal Mock (for subscriptions tests)

```typescript
// Add to test/integration/setup.ts or create inline
const paypalMock = vi.hoisted(() => ({
  createSubscription: vi.fn().mockResolvedValue('https://paypal.com/approve/123'),
  cancelSubscription: vi.fn().mockResolvedValue(undefined),
  getPlanId: vi.fn().mockReturnValue('P-PLAN123'),
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

### Ceremony Prompt Mock (for lifecycle tests)

The existing `promptsMock` should be extended:

```typescript
// Already in setup.ts, ensure it handles ceremony prompts
promptsMock.loadPrompts.mockResolvedValue('Mocked ceremony prompt');
```

## Test Data Fixtures

**Decision:** Factory functions with TypeScript interfaces

**Rationale:**
- Existing pattern in `test/fixtures/` provides reusable test data
- Factory functions allow easy customization via overrides
- Type safety ensures test data matches production types

**Existing Fixtures:**
- `test/fixtures/users.ts` - User fixtures for all tiers
- `test/fixtures/dreams.ts` - Dream fixtures for all statuses
- `test/fixtures/reflections.ts` - Reflection fixtures
- `test/fixtures/evolution.ts` - Evolution report fixtures

**New Fixtures Required:**

1. `test/fixtures/lifecycle.ts` - Evolution events, ceremonies, rituals
2. `test/fixtures/subscriptions.ts` - Subscription status objects

## Test Caller Setup

**Decision:** Use `createTestCaller()` from setup.ts

**Rationale:**
- Provides consistent test caller with mocked dependencies
- Handles mock cleanup between tests
- Supports authenticated and unauthenticated scenarios

**Usage Pattern:**
```typescript
import { createTestCaller, supabaseMock, anthropicMock } from '../setup';
import { proTierUser } from '@/test/fixtures/users';

describe('router.procedure', () => {
  it('should do something', async () => {
    const { caller, mockQuery, mockQueries } = createTestCaller(proTierUser);

    mockQuery('dreams', { data: mockDream, error: null });

    const result = await caller.router.procedure(input);

    expect(result).toMatchObject({ ... });
  });
});
```

## Assertion Library

**Decision:** Vitest expect with matchers

**Rationale:**
- Native to Vitest, no additional dependencies
- Supports `toMatchObject`, `toHaveBeenCalled`, `rejects.toMatchObject`
- Async/await support built-in

**Key Patterns:**
```typescript
// Success assertions
expect(result).toMatchObject({ field: expect.any(String) });
expect(result.items).toHaveLength(3);

// Error assertions
await expect(caller.router.procedure(input)).rejects.toMatchObject({
  code: 'NOT_FOUND',
  message: 'Dream not found',
});

// Mock assertions
expect(supabaseMock.from).toHaveBeenCalledWith('dreams');
expect(anthropicMock.messages.create).toHaveBeenCalled();
```

## Test Organization

**Decision:** Describe blocks by scenario type

**Rationale:**
- Consistent with existing test files
- Clear separation of success/error/authorization cases
- Easy to locate specific test scenarios

**Structure Pattern:**
```typescript
describe('router.procedureName', () => {
  describe('success cases', () => {
    it('TC-XX-01: should handle normal case', async () => { ... });
    it('TC-XX-02: should handle edge case', async () => { ... });
  });

  describe('authorization', () => {
    it('TC-XX-10: should reject unauthenticated user', async () => { ... });
    it('TC-XX-11: should reject demo user', async () => { ... });
  });

  describe('validation', () => {
    it('TC-XX-20: should reject invalid input', async () => { ... });
  });

  describe('error handling', () => {
    it('TC-XX-30: should handle database error', async () => { ... });
  });
});
```

## Environment Variables

Tests require these env vars (mocked in setup):

| Variable | Purpose | Test Handling |
|----------|---------|---------------|
| `JWT_SECRET` | Auth token signing | Set in test env |
| `ANTHROPIC_API_KEY` | AI API calls | Set before tests, mocked |
| `PAYPAL_CLIENT_ID` | PayPal integration | Mocked via paypal mock |
| `PAYPAL_CLIENT_SECRET` | PayPal integration | Mocked via paypal mock |

**Setup in tests:**
```typescript
beforeEach(() => {
  process.env.ANTHROPIC_API_KEY = 'test-api-key';
});
```

## Code Coverage

**Decision:** Vitest coverage with v8 provider

**Target Coverage:**
| Module Type | Minimum | Target |
|-------------|---------|--------|
| tRPC Routers | 80% | 90% |
| Integration Tests | N/A | Full execution |

**Run Command:**
```bash
npm run test:coverage
```

## CI Integration

Tests run in GitHub Actions workflow:

```yaml
# Relevant section from CI
- name: Run Integration Tests
  run: npm run test:integration
  env:
    JWT_SECRET: ${{ secrets.JWT_SECRET }}
```

## Dependencies

All testing dependencies are already installed:

```json
{
  "devDependencies": {
    "vitest": "^1.x",
    "@vitest/coverage-v8": "^1.x"
  }
}
```

No new dependencies required for this iteration.
