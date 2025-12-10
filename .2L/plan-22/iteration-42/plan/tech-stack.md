# Technology Stack - Reflection Router Tests

## Testing Framework

**Decision:** Vitest 2.x

**Rationale:**
- Already in use throughout the codebase
- Native ESM support matches project configuration
- Built-in mocking with `vi.mock()` and `vi.fn()`
- Compatible with tRPC testing patterns

## Test Architecture

**Decision:** Integration tests using tRPC createCaller pattern

**Rationale:**
- Tests the full procedure chain including middleware
- Uses existing `createTestCaller` helper from `test/integration/setup.ts`
- Allows testing authorization (isAuthed, notDemo, checkUsageLimit) in context
- Consistent with existing `reflections.test.ts` patterns

## Mocking Strategy

### Anthropic SDK Mock

**Decision:** Enhanced factory-based mock with multiple scenarios

**Implementation:**
- Factory function `createAnthropicResponseMock(scenario)` for different response types
- Support for: success, premium (extended thinking), error, empty, no-text-block
- Configurable via `vi.mocked()` for per-test customization

### Supabase Mock

**Decision:** Use existing `mockQueries` helper with enhanced table support

**Implementation:**
- Already comprehensive in setup.ts
- Add mock responses for: dreams, reflections, users, evolution_reports
- Support for chained operations (insert().select().single())

### Cache Module Mock

**Decision:** Complete module mock for `@/server/lib/cache`

**Implementation:**
- Mock `cacheDelete` to verify invalidation calls
- Mock `cacheKeys` to return predictable key patterns
- Non-blocking (returns Promise.resolve())

### Prompts Module Mock

**Decision:** Complete module mock for `@/server/lib/prompts`

**Implementation:**
- Mock `loadPrompts` to return static string (avoids filesystem reads)
- Mock `buildReflectionUserPrompt` to return predictable prompt

## Test File Structure

```
test/integration/
├── setup.ts                          # Enhanced with new mocks
├── reflections/
│   └── reflections.test.ts           # Add update/delete/feedback tests
└── reflection/
    └── reflection-create.test.ts     # NEW: AI generation tests
```

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| vitest | ^2.x | Test runner |
| @trpc/server | ^10.x | tRPC testing utilities |
| zod | ^3.x | Schema validation (tested via tRPC) |

## Coverage Configuration

**Target:** 85%+ for both router files

**Vitest Coverage Settings:**
```typescript
coverage: {
  include: [
    'server/trpc/routers/reflection.ts',
    'server/trpc/routers/reflections.ts'
  ],
  thresholds: {
    statements: 85,
    branches: 80,
    functions: 85,
    lines: 85
  }
}
```

## Test Data

### User Fixtures (from test/fixtures/users.ts)
| Fixture | Purpose |
|---------|---------|
| `freeTierUser` | Basic free tier, no limit reached |
| `freeTierAtLimit` | Free tier at monthly limit (2) |
| `proTierUser` | Pro tier with active subscription |
| `proTierAtDailyLimit` | Pro tier at daily limit (1) |
| `unlimitedTierUser` | Unlimited tier user |
| `unlimitedTierAtDailyLimit` | Unlimited at daily limit (2) |
| `creatorUser` | Creator with bypass privileges |
| `adminUser` | Admin with bypass privileges |
| `demoUser` | Demo user (blocked from creation) |

### Reflection Fixtures (from test/fixtures/reflections.ts)
| Fixture | Purpose |
|---------|---------|
| `createReflectionForUser()` | Creates reflection owned by specific user |
| `createMockReflectionRow()` | Full reflection row with all fields |
| `basicReflection` | Standard reflection for testing |
| `ratedReflection` | Reflection with rating/feedback |

## Environment Variables (Test)

Mock environment in tests:
```typescript
// Set before tests run
process.env.ANTHROPIC_API_KEY = 'test-key-mock';
```

No real API calls are made - all external dependencies are mocked.

## Error Handling Patterns

### Expected Errors
- `TRPCError` with code `UNAUTHORIZED` (no user)
- `TRPCError` with code `FORBIDDEN` (demo user, limit reached)
- `TRPCError` with code `INTERNAL_SERVER_ERROR` (API/DB errors)
- `TRPCError` with code `NOT_FOUND` (reflection not found)
- Zod validation errors (invalid input)

### Error Verification
```typescript
await expect(caller.reflection.create(input)).rejects.toMatchObject({
  code: 'FORBIDDEN',
  message: expect.stringContaining('limit'),
});
```

## Performance Considerations

- Tests run in isolation (mocks reset between tests)
- No actual API calls (all mocked)
- No filesystem access (prompts mocked)
- No database connections (Supabase mocked)
- Target: <5s for full test suite
