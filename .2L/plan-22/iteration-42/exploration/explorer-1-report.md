# Explorer 1 Report: Reflection Router Analysis for Testing

## Executive Summary

The Mirror of Dreams application has TWO reflection-related routers that need testing:
1. **`reflectionRouter`** (singular, `reflection.ts`) - Contains the AI generation `create` mutation that calls Anthropic API
2. **`reflectionsRouter`** (plural, `reflections.ts`) - Contains CRUD operations (`list`, `getById`, `update`, `delete`, `submitFeedback`, `checkUsage`)

Current test coverage is at 5.95% for `reflection.ts`. Existing tests in `reflections.test.ts` cover `list`, `getById`, and `checkUsage` from the CRUD router, but the **AI generation `create` mutation is completely untested**. This is the highest priority gap since it contains the most complex logic including Anthropic API calls, tier limits, premium features, and database operations.

## Router Analysis

### File Structure

| File | Purpose | Procedures | Current Tests |
|------|---------|------------|---------------|
| `server/trpc/routers/reflection.ts` | AI generation | `create` mutation | **NONE** |
| `server/trpc/routers/reflections.ts` | CRUD operations | `list`, `getById`, `update`, `delete`, `submitFeedback`, `checkUsage` | Partial (list, getById, checkUsage) |

### Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        appRouter (_app.ts)                       │
├────────────────────────┬─────────────────────────────────────────┤
│  reflection (singular) │           reflections (plural)          │
│  - create mutation     │  - list query                           │
│                        │  - getById query                        │
│                        │  - update mutation                      │
│                        │  - delete mutation                      │
│                        │  - submitFeedback mutation              │
│                        │  - checkUsage query                     │
└────────────────────────┴─────────────────────────────────────────┘
```

## Procedures Inventory

### 1. reflectionRouter.create (CRITICAL - UNTESTED)

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/reflection.ts`

**Middleware Chain:**
- `usageLimitedProcedure` = `publicProcedure.use(isAuthed).use(notDemo).use(checkUsageLimit)`

**Input Schema:** `createReflectionSchema`
```typescript
{
  dreamId: z.string().uuid(),           // REQUIRED
  dream: z.string().min(1).max(3200),   // User's dream description
  plan: z.string().min(1).max(4000),    // Action plan
  relationship: z.string().min(1).max(4000), // Relationship with dream
  offering: z.string().min(1).max(2400), // What they'll give
  tone: z.enum(['gentle', 'intense', 'fusion']).default('fusion'),
  isPremium: z.boolean().default(false)
}
```

**Authorization:**
- Must be authenticated (`isAuthed`)
- Must NOT be demo user (`notDemo`)
- Must pass usage limits (`checkUsageLimit`)

**Business Logic Flow:**
1. Extract dream title from linked dream if `dreamId` provided
2. Determine premium status based on `requestedPremium`, tier, or creator status
3. Generate current date string for date awareness
4. Load system prompts based on tone, premium status, and creator flag
5. Build user prompt with 4-question format
6. **Call Anthropic Claude API** with retry logic (`withAIRetry`)
7. Parse AI response (find text block)
8. Calculate word count and estimated read time
9. **Insert reflection record** into Supabase
10. **Update user usage counters** (monthly, daily, total)
11. **Invalidate cache** (`cacheDelete`)
12. Check evolution report eligibility
13. Return reflection response

**External Dependencies:**
- Anthropic Claude API (claude-sonnet-4-5-20250929)
- Supabase database (reflections, users, dreams, evolution_reports tables)
- Redis cache (optional)
- Prompt files (filesystem)

**Error Handling Paths:**
1. Missing `ANTHROPIC_API_KEY` - throws Error
2. Anthropic API error - throws TRPCError (INTERNAL_SERVER_ERROR)
3. No text block in Claude response - throws Error
4. Database insert error - throws TRPCError (INTERNAL_SERVER_ERROR)
5. User update error - logged but not thrown (silent)

### 2. reflectionsRouter.list (TESTED)

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/reflections.ts`

**Middleware:** `protectedProcedure` (requires auth)

**Input Schema:** `reflectionListSchema`
```typescript
{
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  tone: z.enum(['gentle', 'intense', 'fusion']).optional(),
  isPremium: z.boolean().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['created_at', 'word_count', 'rating']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
}
```

**Test Status:** COVERED (7 test cases)

### 3. reflectionsRouter.getById (TESTED)

**Middleware:** `protectedProcedure`

**Input Schema:** `reflectionIdSchema`
```typescript
{ id: z.string().uuid() }
```

**Business Logic:**
1. Query reflection by ID with user ownership check
2. Increment view count (async, fire-and-forget)
3. Transform row to Reflection object

**Test Status:** COVERED (5 test cases)

### 4. reflectionsRouter.update (UNTESTED)

**Middleware:** `protectedProcedure`

**Input Schema:** `updateReflectionSchema`
```typescript
{
  id: z.string().uuid(),
  title: z.string().optional(),
  tags: z.array(z.string()).optional()
}
```

**Business Logic:**
1. Update reflection with ownership check
2. Set `updated_at` timestamp
3. Return updated reflection

**Test Status:** NOT COVERED

### 5. reflectionsRouter.delete (UNTESTED)

**Middleware:** `protectedProcedure`

**Input Schema:** `reflectionIdSchema`

**Business Logic:**
1. Verify ownership before delete
2. Delete reflection record
3. **Decrement user usage counters** (important for limit enforcement)

**Test Status:** NOT COVERED

### 6. reflectionsRouter.submitFeedback (UNTESTED)

**Middleware:** `protectedProcedure`

**Input Schema:** `submitFeedbackSchema`
```typescript
{
  id: z.string().uuid(),
  rating: z.number().min(1).max(10),
  feedback: z.string().optional()
}
```

**Test Status:** NOT COVERED

### 7. reflectionsRouter.checkUsage (TESTED)

**Middleware:** `protectedProcedure`

**Business Logic:**
1. Calculate limit based on tier or creator/admin status
2. Calculate remaining reflections
3. Determine if user can create new reflection

**Test Status:** COVERED (3 test cases)

### Helper Function: checkEvolutionEligibility

**Location:** `reflection.ts` (lines 208-236)

**Purpose:** Determine if user should receive an evolution report

**Logic:**
1. Free tier users are never eligible (return false)
2. Get threshold based on tier (pro: 4, unlimited: 6)
3. Query last evolution report
4. Count reflections since last report
5. Return true if count >= threshold

**Test Status:** NOT COVERED (internal function, test via `create` mutation)

## Test Cases Required

### Priority 1: reflection.create Mutation (Currently 0 tests)

#### Success Cases

| Test Case | Description | Inputs | Expected Outcome |
|-----------|-------------|--------|------------------|
| TC-RC-01 | Basic reflection creation | Valid dreamId, standard inputs | Returns reflection object with AI response |
| TC-RC-02 | Creation with linked dream | Valid dreamId that exists | Title from dream used |
| TC-RC-03 | Creation without linked dream | dreamId but dream not found | Uses first 100 chars of dream as title |
| TC-RC-04 | Premium reflection (unlimited tier) | User is unlimited tier | Uses extended thinking (5000 budget tokens) |
| TC-RC-05 | Premium reflection (creator) | User is creator | Uses extended thinking |
| TC-RC-06 | Premium reflection (explicit request) | isPremium: true on pro+ | Uses extended thinking |
| TC-RC-07 | Gentle tone reflection | tone: 'gentle' | Gentle tone prompt loaded |
| TC-RC-08 | Intense tone reflection | tone: 'intense' | Intense tone prompt loaded |
| TC-RC-09 | Fusion tone reflection | tone: 'fusion' (default) | Fusion tone prompt loaded |
| TC-RC-10 | Word count calculation | Standard AI response | Correct wordCount returned |
| TC-RC-11 | Read time calculation | 350 word response | estimatedReadTime = 2 |
| TC-RC-12 | User counters updated | Successful creation | Monthly, daily, total counts incremented |
| TC-RC-13 | Cache invalidation | Successful creation | cacheDelete called with correct key |
| TC-RC-14 | Evolution eligibility - pro user | Pro user with 4+ reflections since last report | shouldTriggerEvolution: true |
| TC-RC-15 | Evolution eligibility - unlimited user | Unlimited user with 6+ reflections | shouldTriggerEvolution: true |
| TC-RC-16 | Daily counter reset | New day | reflectionsToday reset to 1 |

#### Authorization/Limit Cases

| Test Case | Description | Inputs | Expected Outcome |
|-----------|-------------|--------|------------------|
| TC-RC-17 | Unauthenticated user | No user in context | UNAUTHORIZED error |
| TC-RC-18 | Demo user blocked | Demo user | FORBIDDEN error |
| TC-RC-19 | Free tier at monthly limit | reflectionCountThisMonth >= 2 | FORBIDDEN error |
| TC-RC-20 | Pro tier at monthly limit | reflectionCountThisMonth >= 30 | FORBIDDEN error |
| TC-RC-21 | Pro tier at daily limit | reflectionsToday >= 1, same day | FORBIDDEN error |
| TC-RC-22 | Unlimited tier at daily limit | reflectionsToday >= 2, same day | FORBIDDEN error |
| TC-RC-23 | Creator bypasses limits | Creator user | No limit enforcement |
| TC-RC-24 | Admin bypasses limits | Admin user | No limit enforcement |

#### Error Cases

| Test Case | Description | Mocked Error | Expected Outcome |
|-----------|-------------|--------------|------------------|
| TC-RC-25 | Anthropic API error | API throws error | INTERNAL_SERVER_ERROR with message |
| TC-RC-26 | Anthropic API returns no text | Response has no text block | INTERNAL_SERVER_ERROR |
| TC-RC-27 | Database insert error | Supabase insert fails | INTERNAL_SERVER_ERROR |
| TC-RC-28 | Missing API key | ANTHROPIC_API_KEY not set | Error thrown |
| TC-RC-29 | Invalid dreamId format | Non-UUID dreamId | Validation error |
| TC-RC-30 | Empty dream text | dream: '' | Validation error |
| TC-RC-31 | Dream text too long | dream: 3201+ chars | Validation error |
| TC-RC-32 | Invalid tone | tone: 'invalid' | Validation error |

#### Edge Cases

| Test Case | Description | Scenario | Expected Outcome |
|-----------|-------------|----------|------------------|
| TC-RC-33 | Retry on transient error | API fails first, succeeds second | Reflection created after retry |
| TC-RC-34 | User with null name | User.name is null | 'Friend' used in prompt |
| TC-RC-35 | All optional fields default | Minimal input | Defaults applied correctly |
| TC-RC-36 | No evolution reports yet | First-time user | Still calculates eligibility |

### Priority 2: reflectionsRouter.update (Currently 0 tests)

| Test Case | Description | Expected Outcome |
|-----------|-------------|------------------|
| TC-RU-01 | Update title successfully | Title updated, updated_at changed |
| TC-RU-02 | Update tags successfully | Tags array updated |
| TC-RU-03 | Update both title and tags | Both fields updated |
| TC-RU-04 | Update non-existent reflection | NOT_FOUND or INTERNAL_SERVER_ERROR |
| TC-RU-05 | Update other user's reflection | NOT_FOUND (ownership check) |
| TC-RU-06 | Unauthenticated user | UNAUTHORIZED |
| TC-RU-07 | Invalid ID format | Validation error |

### Priority 3: reflectionsRouter.delete (Currently 0 tests)

| Test Case | Description | Expected Outcome |
|-----------|-------------|------------------|
| TC-RD-01 | Delete own reflection | Reflection deleted, counters decremented |
| TC-RD-02 | Delete non-existent reflection | NOT_FOUND |
| TC-RD-03 | Delete other user's reflection | NOT_FOUND |
| TC-RD-04 | Counter decrement edge case | Counters don't go negative |
| TC-RD-05 | Unauthenticated user | UNAUTHORIZED |

### Priority 4: reflectionsRouter.submitFeedback (Currently 0 tests)

| Test Case | Description | Expected Outcome |
|-----------|-------------|------------------|
| TC-RF-01 | Submit rating only | Rating saved |
| TC-RF-02 | Submit rating and feedback | Both saved |
| TC-RF-03 | Rating at min boundary | rating: 1 accepted |
| TC-RF-04 | Rating at max boundary | rating: 10 accepted |
| TC-RF-05 | Rating below min | rating: 0 rejected |
| TC-RF-06 | Rating above max | rating: 11 rejected |
| TC-RF-07 | Non-existent reflection | Error |
| TC-RF-08 | Other user's reflection | Error |

## Mocking Requirements

### 1. Anthropic SDK Mock (Already in setup.ts)

Current mock provides basic structure but needs enhancement:

```typescript
// Current mock - basic
const mockCreate = vi.fn().mockResolvedValue({
  id: 'msg_test_12345',
  type: 'message',
  role: 'assistant',
  content: [{ type: 'text', text: 'Test response from Claude.' }],
  model: 'claude-sonnet-4-20250514',
  stop_reason: 'end_turn',
  usage: { input_tokens: 100, output_tokens: 50 },
});

// Enhanced mock needed for:
// 1. Extended thinking responses (premium)
// 2. Error scenarios (rate limit, overload)
// 3. Empty/invalid responses
// 4. Retry testing
```

**Enhancements Needed:**

```typescript
// Factory for creating different response scenarios
export function createAnthropicMock(scenario: 'success' | 'premium' | 'error' | 'empty') {
  switch (scenario) {
    case 'premium':
      return {
        content: [
          { type: 'thinking', thinking: 'Extended thinking content...' },
          { type: 'text', text: 'Premium AI response...' }
        ]
      };
    case 'error':
      return Promise.reject({ status: 529, message: 'Overloaded' });
    case 'empty':
      return { content: [] };
    default:
      return { content: [{ type: 'text', text: 'Standard response' }] };
  }
}
```

### 2. Supabase Mock (Already in setup.ts)

Current mock is comprehensive. Use `mockQueries` helper:

```typescript
mockQueries({
  dreams: { data: { title: 'Dream Title' }, error: null },
  reflections: { data: reflectionRecord, error: null },
  users: { data: updatedUser, error: null },
  evolution_reports: { data: lastReport, error: null }
});
```

**Table interactions to mock:**
- `dreams` - SELECT for title lookup
- `reflections` - INSERT for creation, SELECT for read
- `users` - UPDATE for counter increment
- `evolution_reports` - SELECT for eligibility check

### 3. Cache Mock (Not currently mocked)

Add mock for cache operations:

```typescript
vi.mock('@/server/lib/cache', () => ({
  cacheDelete: vi.fn().mockResolvedValue(undefined),
  cacheKeys: {
    reflections: (userId: string) => `ctx:reflections:${userId}`
  }
}));
```

### 4. Prompts Mock (Not currently mocked)

Mock the prompt loading since it reads from filesystem:

```typescript
vi.mock('@/server/lib/prompts', () => ({
  loadPrompts: vi.fn().mockResolvedValue('Mocked system prompt'),
  buildReflectionUserPrompt: vi.fn().mockReturnValue('Mocked user prompt')
}));
```

### 5. Logger Mocks (Already in setup.ts)

Current implementation is sufficient:
```typescript
vi.mock('@/server/lib/logger', () => ({
  aiLogger: createMockLogger(),
  dbLogger: createMockLogger(),
  // ...
}));
```

## Risk Assessment

### High Risk Areas

1. **Anthropic API Integration (reflection.create)**
   - Risk: Complex mocking needed for extended thinking, errors, retries
   - Impact: Most critical business logic untested
   - Mitigation: Create comprehensive mock factory with scenarios

2. **Tier Limit Enforcement (middleware)**
   - Risk: Logic split across middleware and create mutation
   - Impact: Users could exceed limits
   - Mitigation: Test middleware independently AND in integration

3. **Usage Counter Updates**
   - Risk: Race conditions, incorrect counting
   - Impact: Billing/fairness issues
   - Mitigation: Test counter updates with edge cases

### Medium Risk Areas

1. **Cache Invalidation**
   - Risk: Stale data if cache not invalidated
   - Impact: User sees outdated reflection list
   - Mitigation: Verify cacheDelete called with correct key

2. **Evolution Eligibility**
   - Risk: Complex query logic with multiple conditions
   - Impact: Users miss evolution reports
   - Mitigation: Test all tier/count combinations

3. **Premium Feature Determination**
   - Risk: Three-way OR logic (requestedPremium, tier, creator)
   - Impact: Wrong token budget used
   - Mitigation: Test truth table for premium flag

### Low Risk Areas

1. **CRUD Operations (update, delete, submitFeedback)**
   - Risk: Standard patterns, less complex
   - Impact: Data integrity
   - Mitigation: Standard test patterns

## Recommendations for Builder

1. **Start with reflection.create mutation** - This is the critical gap with 0 coverage
2. **Create mock factories** for Anthropic responses (success, premium, errors)
3. **Mock the prompts module** to avoid filesystem dependencies
4. **Test middleware separately** before full integration tests
5. **Use existing fixtures** (users, reflections) from `/test/fixtures/`
6. **Follow existing test patterns** from `reflections.test.ts`

## Test File Organization

```
test/integration/
├── setup.ts                          # Existing - enhance with new mocks
├── reflections/
│   └── reflections.test.ts           # Existing - add update/delete/feedback tests
└── reflection/
    └── reflection-create.test.ts     # NEW - AI generation tests (Priority 1)
```

## Coverage Target Calculation

| Procedure | Lines | Tests Needed | Coverage Impact |
|-----------|-------|--------------|-----------------|
| reflection.create | ~150 | 36 | +60% |
| reflections.update | ~25 | 7 | +10% |
| reflections.delete | ~30 | 5 | +12% |
| reflections.submitFeedback | ~25 | 8 | +10% |
| **Total** | ~230 | 56 | **85%+ achievable** |

## Resource Map

### Critical Files
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/reflection.ts` - AI generation
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/reflections.ts` - CRUD
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/middleware.ts` - Auth/limits
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/retry.ts` - Retry logic

### Test Infrastructure
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/integration/setup.ts` - Test caller setup
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/fixtures/users.ts` - User fixtures
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/fixtures/reflections.ts` - Reflection fixtures

### Key Dependencies
- `@anthropic-ai/sdk` - Anthropic Claude API client
- `@trpc/server` - tRPC framework
- `zod` - Input validation
- `@upstash/redis` - Cache client

### Type Definitions
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/reflection.ts`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/schemas.ts`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/constants.ts`

---

**Report Generated:** 2025-12-10
**Explorer:** 1
**Focus Area:** Reflection Router Analysis for Testing
**Status:** COMPLETE
