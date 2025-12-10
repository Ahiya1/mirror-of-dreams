# Technology Stack

## Testing Framework

**Decision:** Vitest 2.x

**Rationale:**
- Already established in the project (see existing integration tests)
- Native TypeScript support without additional configuration
- Compatible with existing mock patterns in `test/integration/setup.ts`
- Fast execution with parallel test running

## Test Infrastructure

**Decision:** Use existing `test/integration/setup.ts` infrastructure

**Rationale:**
- Provides `createTestCaller()` with mocked Supabase, Anthropic, cache, and logger
- Exports `anthropicMock` for AI response configuration
- Handles mock cleanup between tests via `vi.clearAllMocks()`
- Established patterns from reflection-create.test.ts

## Mock Libraries

### Supabase Mock
**Decision:** Use hoisted `supabaseMock` from setup.ts

**Implementation Notes:**
- `supabase.from()` returns chainable mock with `.select()`, `.eq()`, `.single()`, etc.
- `supabase.rpc()` needs special handling for evolution/visualization limit checks
- Use `mockQueries()` helper for table-specific responses

### Anthropic Mock
**Decision:** Use hoisted `anthropicMock` from setup.ts

**Implementation Notes:**
- `anthropicMock.messages.create` for AI response mocking
- Must handle extended thinking blocks for unlimited tier tests
- Return structure must match Anthropic SDK response format

## Fixture Dependencies

### Existing Fixtures (reuse)
- `test/fixtures/users.ts` - User scenarios (freeTierUser, proTierUser, unlimitedTierUser, etc.)
- `test/fixtures/reflections.ts` - Reflection factories (createMockReflections, createMockReflectionRow)

### New Fixtures (create)
- `test/fixtures/evolution.ts` - Evolution report factories
- `test/fixtures/visualizations.ts` - Visualization factories

## Environment Variables

Required for tests:
- `ANTHROPIC_API_KEY`: Set to `'test-api-key'` in `beforeEach` (mocked, not real API calls)

## Dependencies Overview

Key test dependencies (already installed):
- `vitest`: ^2.x - Test runner and assertions
- `@trpc/server`: Router testing via createCaller
- `zod`: Input validation (tested via invalid input cases)

## Coverage Targets

| Module | Minimum Coverage | Target Coverage |
|--------|-----------------|-----------------|
| evolution.ts | 80% | 85%+ |
| visualizations.ts | 80% | 85%+ |

## Test Organization

```
test/
├── fixtures/
│   ├── users.ts           # Existing - reuse
│   ├── reflections.ts     # Existing - reuse
│   ├── evolution.ts       # NEW - Builder-1 creates
│   └── visualizations.ts  # NEW - Builder-1 creates
└── integration/
    ├── evolution/
    │   └── evolution.test.ts      # NEW - Builder-1
    └── visualizations/
        └── visualizations.test.ts # NEW - Builder-2
```

## Performance Considerations

- Tests run with mocked dependencies (no network calls)
- Parallel test execution enabled by default in Vitest
- Each test file runs in isolation

## Security Considerations

- Tests use mock API keys, never real credentials
- All external API calls are intercepted by mocks
- No sensitive data in test fixtures
