# Technology Stack

## Test Framework

**Decision:** Vitest 2.x with v8 coverage provider

**Rationale:**
- Already configured in project (`vitest.config.ts`)
- Fast execution with native ESM support
- v8 provider gives accurate coverage without instrumentation overhead
- Excellent TypeScript integration
- Compatible with existing `@testing-library/react` setup

**Alternatives Considered:**
- Jest: Slower, requires more configuration for ESM
- c8: Standalone coverage tool, but Vitest's built-in is sufficient

## Component Testing

**Decision:** @testing-library/react with happy-dom

**Rationale:**
- Already configured (`vitest.setup.ts`)
- User-centric testing approach
- happy-dom is faster than jsdom for most use cases
- `@testing-library/jest-dom/vitest` provides DOM matchers

**Implementation Notes:**
- Custom render wrapper will be in `test/helpers/render.tsx`
- Provider composition for Auth and tRPC contexts

## Coverage Reporters

**Decision:** text, json, html, lcov, json-summary

**Rationale:**
- `text`: Console output for quick feedback
- `json`: Machine-readable for tooling
- `html`: Interactive browser-based reports
- `lcov`: Required for Codecov/badge tools (NEW)
- `json-summary`: Quick stats extraction (NEW)

**Implementation:**
```typescript
reporter: ['text', 'json', 'html', 'lcov', 'json-summary'],
```

## Coverage Thresholds

**Decision:** Conservative starting thresholds

**Rationale:**
- Current actual coverage is 29.53% lines, 44.49% functions
- Must start ABOVE current to prevent regression
- But not so high that CI blocks development
- Progressive increase planned over iterations

**Iteration 41 Thresholds:**
```typescript
thresholds: {
  statements: 30,  // Above current 29.53%
  branches: 55,    // Keep current (already passing)
  functions: 45,   // Below current 44.49% to give buffer
  lines: 30,       // Above current 29.53%
}
```

**Progressive Roadmap:**
| Iteration | Lines | Functions | Branches | Statements |
|-----------|-------|-----------|----------|------------|
| 41 (Now)  | 30%   | 45%       | 55%      | 30%        |
| 43-44     | 40%   | 55%       | 60%      | 40%        |
| 46-47     | 50%   | 65%       | 65%      | 50%        |
| 48-49     | 60%   | 70%       | 70%      | 60%        |
| 50+       | 80%   | 80%       | 75%      | 80%        |

## Factory Pattern

**Decision:** Factory functions with overrides pattern

**Rationale:**
- Matches existing fixture patterns in `test/fixtures/`
- Simple and TypeScript-friendly
- No external dependencies (no `faker`, `fishery`, etc.)
- Consistent with project conventions

**Example:**
```typescript
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  ...defaults,
  ...overrides,
});
```

**Why not external libraries:**
- `faker` adds bundle size and complexity
- Project is small enough that manual factories are sufficient
- Existing fixtures work well; factories extend the pattern

## tRPC Testing

**Decision:** Build on existing `createTestCaller` pattern

**Rationale:**
- `test/integration/setup.ts` already has comprehensive tRPC caller mocking
- New helpers will provide component-level tRPC client mocking
- Avoids reinventing working patterns

**Implementation Notes:**
- Integration tests: Use existing `createTestCaller()`
- Component tests: New `createMockTRPCClient()` for frontend context

## Type Imports

**Decision:** Use `@/types/*` for all type definitions

**Rationale:**
- Centralized type definitions in `types/` directory
- Path alias already configured (`@/types`)
- Consistent with rest of codebase

**Key Types:**
- `@/types/user` - User, UserRow, SubscriptionTier
- `@/types/clarify` - ClarifySession, ClarifyMessage, ClarifyPattern
- `@/types/reflection` - ReflectionRow, ReflectionTone

## File Organization

**Decision:** Separate `factories/` and `helpers/` directories

**Rationale:**
- Clear separation of concerns
- Factories: Data creation
- Helpers: Test utilities and wrappers
- Matches vision document structure

**Structure:**
```
test/
  factories/           # NEW: Data factories
    user.factory.ts
    dream.factory.ts
    reflection.factory.ts
    clarify.factory.ts
    index.ts
  helpers/             # NEW: Test utilities
    render.tsx
    trpc.ts
    index.ts
  fixtures/            # EXISTING: Keep for backward compatibility
    users.ts
    dreams.ts
    reflections.ts
    form-data.ts
  mocks/               # EXISTING: Module mocks
    anthropic.ts
    supabase.ts
    cookies.ts
  integration/         # EXISTING: Integration test setup
    setup.ts
```

## Dependencies

**Existing (no changes):**
- `vitest` - Test runner
- `@testing-library/react` - Component testing
- `@testing-library/jest-dom` - DOM matchers
- `happy-dom` - DOM environment
- `@vitejs/plugin-react` - React support

**No new dependencies required.**

## Environment Variables

All test env vars already configured in `vitest.setup.ts`:
- `NEXT_PUBLIC_SUPABASE_URL` - Test Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Test anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Test service key
- `ANTHROPIC_API_KEY` - Test Anthropic key
- `JWT_SECRET` - Test JWT secret
- PayPal sandbox credentials

## Performance Targets

- Test suite execution: < 30 seconds
- Coverage report generation: < 5 seconds
- Individual test file: < 1 second

## Security Considerations

- All API keys in tests are mock/test values
- No real credentials in test files
- Factory data uses obvious test values (e.g., `test@example.com`)
- Mocks prevent actual API calls
