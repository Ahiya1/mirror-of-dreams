# 2L Iteration Plan - Server-Side Remaining Gaps

## Plan Details
- **Plan ID:** plan-24
- **Iteration:** 56 (Iteration 1 of plan-24)
- **Name:** Server-Side Remaining Gaps
- **Mode:** PRODUCTION (Test writing only)

## Project Vision

Close all server-side coverage gaps to achieve 90%+ router/lib coverage. This iteration focuses exclusively on writing tests for existing production code - no feature changes, no refactoring, pure test coverage expansion.

## Success Criteria

Specific, measurable criteria for iteration completion:

- [ ] Clarify Router coverage: 45% -> 90%+ lines
- [ ] Auth Router coverage: 70% -> 90%+ lines
- [ ] Cookies Module coverage: 33% -> 90%+ lines
- [ ] Supabase Client coverage: 0% -> 90%+ lines
- [ ] tRPC Core coverage: 57% -> 90%+ lines
- [ ] All new tests pass on first CI run
- [ ] No flaky tests introduced
- [ ] Approximately 110 new tests added

## MVP Scope

**In Scope:**

1. **Clarify Router Tests** (`server/trpc/routers/clarify.ts`)
   - createSession with initial message and AI response
   - sendMessage with tool_use blocks
   - Tool execution flow (createDream)
   - Error handling in AI calls
   - Database error handling in CRUD operations

2. **Auth Router Tests** (`server/trpc/routers/auth.ts`)
   - verifyToken procedure (both success and unauthorized paths)
   - me procedure (authenticated user retrieval)
   - updateProfile error handling
   - deleteAccount complete flow

3. **Cookies Module Tests** (`server/lib/cookies.ts`)
   - setAuthCookie() function
   - getAuthCookie() function
   - clearAuthCookie() function
   - Demo vs regular cookie options

4. **Supabase Client Tests** (`server/lib/supabase.ts`)
   - Client initialization
   - Environment variable handling
   - Placeholder fallback behavior

5. **tRPC Core Tests** (`server/trpc/trpc.ts`)
   - Error formatter function
   - Sentry capture logic (non-auth errors)
   - Zod error flattening

**Out of Scope (Post-MVP):**

- Component tests (Iteration 2)
- E2E tests (Iteration 3)
- Performance optimizations
- Feature changes
- Refactoring existing code

## Development Phases

1. **Exploration** - Complete
2. **Planning** - Current
3. **Building** - Estimated 2-3 hours (parallel builders)
4. **Integration** - Estimated 15 minutes
5. **Validation** - Estimated 20 minutes
6. **Deployment** - Final (merge to main)

## Timeline Estimate

| Phase | Duration | Notes |
|-------|----------|-------|
| Exploration | Complete | 2 explorer reports generated |
| Planning | Complete | This document |
| Building | 2-3 hours | 4 parallel builders |
| Integration | 15 min | Merge builder outputs |
| Validation | 20 min | Run full test suite |
| **Total** | ~3-4 hours | |

## Risk Assessment

### High Risks

1. **Anthropic Mock Complexity for tool_use**
   - Risk: Tool use flow requires mocking two sequential API calls with different response types
   - Mitigation: Create dedicated `mockAnthropicToolUse()` helper function before writing tests

2. **Context Builder Dependencies**
   - Risk: `buildClarifyContext` has its own cache/db dependencies that may interfere
   - Mitigation: Mock the entire `buildClarifyContext` function to isolate clarify router tests

### Medium Risks

1. **Sequential Supabase Mock State**
   - Risk: Testing "ownership check succeeds, then operation fails" requires stateful mocks
   - Mitigation: Use call-count tracking in mock implementation

2. **Next.js Headers API in Cookies Module**
   - Risk: `cookies()` from `next/headers` requires special handling in tests
   - Mitigation: Use `vi.mock('next/headers')` at module level before imports

### Low Risks

1. **Sentry Mock Integration**
   - Risk: Error formatter tests need to verify Sentry calls
   - Mitigation: Simple `vi.mock('@sentry/nextjs')` with captureException spy

## Integration Strategy

1. **Builder Isolation:** Each builder works on a separate test file or module
2. **No Shared State:** All tests use `createTestCaller()` which resets mocks
3. **Merge Strategy:**
   - Builder 1 (Clarify) creates/extends `test/integration/clarify/clarify.test.ts`
   - Builder 2 (Auth) creates new files in `test/integration/auth/`
   - Builder 3 (Cookies/Supabase) creates files in `test/unit/server/lib/`
   - Builder 4 (tRPC) creates `test/unit/server/trpc/trpc.test.ts`
4. **Mock Helpers:** Builder 1 adds `mockAnthropicToolUse()` to `test/mocks/anthropic.ts` first

## Deployment Plan

1. Run `npm run test:coverage -- --run` to verify all tests pass
2. Verify coverage thresholds are met for each module
3. Create PR with all new test files
4. Merge to main after CI passes

## Estimated Test Breakdown

| Module | Current Coverage | New Tests | Target Coverage |
|--------|------------------|-----------|-----------------|
| Clarify Router | 45.62% | ~46 tests | 90%+ |
| Auth Router | 70.21% | ~15 tests | 90%+ |
| Cookies Module | 33.33% | ~6 tests | 90%+ |
| Supabase Client | 0% | ~3 tests | 90%+ |
| tRPC Core | 57.14% | ~6 tests | 90%+ |
| Mock Helpers | N/A | +2 helpers | N/A |
| **Total** | | **~76+ tests** | |

Note: Explorer estimates (~110 tests) may be high. Actual count depends on how thoroughly edge cases are covered. The 76+ is a conservative estimate of distinct test cases.
