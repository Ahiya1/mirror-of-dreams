# Integration Testing - Iteration 32 Overview

## Mission

Create integration tests for core tRPC routers (auth, dreams) with proper test setup infrastructure. This iteration focuses on establishing a solid testing foundation that can be extended in future iterations.

## Scope

### In Scope
1. **Test Setup Infrastructure** - createTestCaller helper, context mocking, rate limiter bypass
2. **Auth Router Integration Tests** - signup, signin, signout, verifyToken flows
3. **Dreams Router Integration Tests** - create, list, update, delete with tier limits
4. **Test Fixtures** - Dreams fixtures to complement existing user fixtures

### Out of Scope (Deferred)
- Full E2E testing with Playwright
- PayPal integration tests (complex external API)
- AI router tests (already have unit tests via anthropic mock)
- Clarify/Evolution router tests (complex AI dependencies)
- Reflections CRUD tests (depends on AI integration)

## Architecture

```
test/
  integration/
    setup.ts              # Test caller factory (NEW)
    auth/
      signup.test.ts      # Auth signup tests (NEW)
      signin.test.ts      # Auth signin tests (NEW)
      signout.test.ts     # Auth signout tests (NEW)
    dreams/
      create.test.ts      # Dreams creation with limits (NEW)
      list.test.ts        # Dreams listing with stats (NEW)
      crud.test.ts        # Update/delete operations (NEW)
  fixtures/
    users.ts              # EXISTING
    dreams.ts             # NEW
  mocks/
    supabase.ts           # EXISTING (enhanced)
    anthropic.ts          # EXISTING
    cookies.ts            # NEW
```

## Success Criteria

- [ ] Test setup infrastructure allows creating test callers with mocked context
- [ ] Auth router tests cover happy paths and error cases for core flows
- [ ] Dreams router tests validate tier limits and CRUD operations
- [ ] Dreams fixtures provide reusable test data
- [ ] All tests pass with `pnpm test`
- [ ] Rate limiting is bypassable in tests

## Builder Distribution

| Builder | Focus Area | Files |
|---------|------------|-------|
| Builder 1 | Test Setup + Auth Tests | `test/integration/setup.ts`, `test/mocks/cookies.ts`, `test/integration/auth/*.test.ts` |
| Builder 2 | Dreams Tests + Fixtures | `test/fixtures/dreams.ts`, `test/integration/dreams/*.test.ts` |
| Builder 3 | Additional Router Tests | `test/integration/users/me.test.ts`, `test/integration/reflections/list.test.ts` |

## Dependencies

- Existing: `vitest`, `@trpc/server`, user fixtures, supabase mock, anthropic mock
- New mocks: cookies mock (for auth flows)
- Enhanced: supabase mock (count support for pagination)

## Key Patterns

1. **createCaller Pattern** - Direct procedure calls without HTTP layer
2. **Module Mocking** - Use `vi.mock()` for external dependencies
3. **Rate Limiter Bypass** - Environment check in rate limiter for tests
4. **Fixture Factories** - `createMockDream()` similar to `createMockUser()`

## Risks

| Risk | Mitigation |
|------|------------|
| Context mocking complexity | Builder 1 focuses solely on this foundation |
| Rate limiter state pollution | Add TEST environment bypass |
| Cookie/JWT handling in tests | Create dedicated cookie mock |

## Timeline

All 3 builders work in parallel:
- Builder 1: Foundation (blocks others slightly for setup.ts)
- Builder 2: Dreams (uses setup.ts once available)
- Builder 3: Additional tests (uses setup.ts once available)

## Verification

After integration:
```bash
pnpm test -- --run test/integration/
```

Expected: All integration tests pass, no flaky tests, clear error messages.
