# Master Exploration Report

## Explorer ID
master-explorer-3

## Focus Area
Test Patterns & Coverage Analysis

## Vision Summary
Transform Mirror of Dreams from ~21% line coverage to 80%+ comprehensive test coverage through systematic testing of tRPC routers, hooks, components, and libraries across 13 iterations.

---

## Executive Summary

The codebase has a **solid test infrastructure foundation** but significant **coverage gaps in critical files**. The existing patterns are well-established and provide excellent templates for expansion. Key findings:

1. **Test Infrastructure: STRONG** - Comprehensive mocks (Supabase, Anthropic), fixtures (users, dreams, reflections), and a robust integration test setup with `createTestCaller`
2. **tRPC Router Testing: PARTIAL** - Dreams and reflections have good patterns, but reflection.ts (5.95%), clarify.ts (15.97%), and evolution.ts (~10%) need extensive coverage
3. **Component Testing: GOOD PATTERNS, LIMITED SCOPE** - Excellent patterns in ToneBadge.test.tsx and GlowButton.test.tsx, but most components lack tests
4. **Hook Testing: ABSENT** - Zero tests for hooks despite 11 hooks totaling 1,061 lines
5. **E2E Testing: NASCENT** - Only 39 tests focused on auth flows; needs expansion to dreams, reflections, clarify, dashboard

---

## Test Pattern Analysis

### Current Test File Organization

```
mirror-of-dreams/
|-- test/
|   |-- fixtures/
|   |   |-- dreams.ts (300 lines) - Excellent factory pattern
|   |   |-- reflections.ts (197 lines) - Good scenarios
|   |   |-- users.ts (342 lines) - Comprehensive tier scenarios
|   |-- mocks/
|   |   |-- anthropic.ts (252 lines) - Streaming and non-streaming mocks
|   |   |-- supabase.ts (160 lines) - Chainable query mock
|   |   |-- cookies.ts (26 lines) - Basic auth cookie mock
|   |-- integration/
|       |-- setup.ts (318 lines) - createTestCaller with full mocking
|       |-- auth/ (3 test files)
|       |-- dreams/ (3 test files)
|       |-- reflections/ (1 test file)
|       |-- users/ (1 test file)
|-- components/**/__tests__/ - Co-located component tests
|-- lib/**/__tests__/ - Co-located lib tests
|-- server/**/__tests__/ - Co-located server tests
|-- e2e/auth/ - Playwright E2E tests
```

### Established Testing Patterns

#### 1. tRPC Integration Test Pattern (EXCELLENT)
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/integration/setup.ts`

```typescript
// Pattern: createTestCaller with mocked dependencies
export function createTestCaller(user: User | null = null) {
  vi.clearAllMocks();

  const caller = appRouter.createCaller({
    user,
    req: new Request('http://localhost:3000'),
  });

  return {
    caller,
    supabase: supabaseMock,
    mockQuery: <T>(table: string, response: SupabaseQueryResponse<T>) => { ... },
    mockQueries: (tableResponses: Record<string, SupabaseQueryResponse<any>>) => { ... },
  };
}
```

**Strengths:**
- Clean caller creation with user injection
- Flexible `mockQuery` and `mockQueries` helpers
- Rate limiting bypass built-in
- Logger mocking to suppress output

**Usage Example from `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/integration/dreams/crud.test.ts`:**
```typescript
it('should get a single dream by ID', async () => {
  const { caller, supabase } = createTestCaller(freeTierUser);
  supabase.from.mockImplementation((table: string) => { ... });
  const result = await caller.dreams.get({ id: activeDream.id });
  expect(result.id).toBe(activeDream.id);
});
```

#### 2. Component Test Pattern (GOOD)
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/ui/glass/__tests__/GlowButton.test.tsx`

```typescript
// Pattern: Comprehensive prop and interaction testing
describe('GlowButton', () => {
  describe('rendering', () => { ... });
  describe('variants', () => { ... });
  describe('sizes', () => { ... });
  describe('interactions', () => { ... });
  describe('disabled state', () => { ... });
  describe('accessibility', () => { ... });
  describe('custom className', () => { ... });
});
```

**Strengths:**
- Logical grouping by concern
- Tests all variants and sizes
- Interaction testing with `fireEvent`
- Accessibility tests (focus, ARIA, touch targets)
- Custom className merging tests

#### 3. Fixture Factory Pattern (EXCELLENT)
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/fixtures/users.ts`

```typescript
// Base factory with defaults
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'test-user-uuid-1234',
  email: 'test@example.com',
  tier: 'free',
  ...overrides,
});

// Pre-configured scenarios
export const freeTierUser = createMockUser({ tier: 'free' });
export const proTierUser = createMockUser({ tier: 'pro' });
export const proTierAtDailyLimit = createMockUser({
  tier: 'pro',
  reflectionsToday: 1,
  lastReflectionDate: new Date().toISOString().split('T')[0],
});

// Dynamic factories
export const createUserWithTier = (tier: SubscriptionTier, status = 'active'): User => ...
```

**Strengths:**
- Base factory + overrides pattern
- Pre-built common scenarios
- Dynamic factory helpers for edge cases
- Type-safe with proper TypeScript interfaces

#### 4. Supabase Mock Pattern (COMPREHENSIVE)
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/mocks/supabase.ts`

```typescript
// Chainable query mock supporting all Supabase methods
export const createSupabaseQueryMock = <T>(response: SupabaseQueryResponse<T>) => {
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    // ... all filter methods
    single: vi.fn().mockResolvedValue(response),
    then: vi.fn((resolve) => resolve(response)),
  };
  return mockChain;
};
```

**Strengths:**
- Full chainable API coverage
- Supports async/await via `then`
- Pre-built error scenarios (`supabaseErrors`)
- Auth and storage mocks included

#### 5. Anthropic Mock Pattern (GOOD)
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/mocks/anthropic.ts`

```typescript
// Non-streaming response mock
export const createMockMessageResponse = (overrides = {}): AnthropicMessageResponse => ({
  id: 'msg_test_12345',
  content: [{ type: 'text', text: 'Test response' }],
  usage: { input_tokens: 100, output_tokens: 50 },
  ...overrides,
});

// Streaming mock with async iterator
export const createMessagesStreamMock = () => {
  const mockStream = {
    [Symbol.asyncIterator]: async function* () {
      yield { type: 'content_block_start', ... };
      yield { type: 'content_block_delta', delta: { text: 'Test' } };
      yield { type: 'message_stop' };
    },
    finalMessage: vi.fn().mockResolvedValue(createMockMessageResponse()),
  };
  return vi.fn().mockReturnValue(mockStream);
};

// Pre-built response scenarios
export const mockResponses = {
  reflection: createMockMessageResponse({ ... }),
  clarify: createMockMessageResponse({ ... }),
  withThinking: createMockThinkingResponse('thinking...', 'response'),
};
```

**Strengths:**
- Extended thinking support
- Streaming iterator mock
- Pre-built scenario responses
- Error scenario helpers

#### 6. E2E Page Object Pattern (GOOD)
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/e2e/auth/signin.spec.ts`

```typescript
test.describe('Sign In Flow', () => {
  let signinPage: SignInPage;

  test.beforeEach(async ({ page }) => {
    signinPage = new SignInPage(page);
    await signinPage.goto();
  });

  test('displays signin form elements', async () => {
    await signinPage.expectFormElementsVisible();
  });
});
```

**Strengths:**
- Page object pattern for reusability
- Clean test structure
- Accessibility tests included
- Keyboard navigation tested

---

## Coverage Gap Analysis

### Critical Files (Priority 1)

| File | Lines | Current | Target | Test Status |
|------|-------|---------|--------|-------------|
| `server/trpc/routers/reflection.ts` | 238 | ~6% | 85% | **MISSING** - No test file exists |
| `server/trpc/routers/clarify.ts` | 731 | ~16% | 85% | **MISSING** - No test file exists |
| `server/trpc/routers/evolution.ts` | 621 | ~10% | 85% | **MISSING** - No test file exists |
| `server/trpc/routers/visualizations.ts` | 413 | ~10% | 85% | **MISSING** - No test file exists |
| `components/reflection/mobile/MobileReflectionFlow.tsx` | 812 | 0% | 80% | **UNTESTABLE** - Mega-component needs refactoring |

### Medium Priority Files (Priority 2)

| File | Lines | Current | Target | Test Status |
|------|-------|---------|--------|-------------|
| `server/trpc/routers/dreams.ts` | 451 | ~30% | 85% | **PARTIAL** - CRUD tested, limits partially tested |
| `server/trpc/routers/users.ts` | 364 | ~25% | 85% | **PARTIAL** - Basic getProfile tested |
| `hooks/useReflectionForm.ts` | 168 | 0% | 90% | **MISSING** - No test file |
| `hooks/useReflectionViewMode.ts` | 62 | 0% | 90% | **MISSING** - No test file |
| `hooks/useAuth.ts` | 177 | 0% | 85% | **MISSING** - No test file |
| `lib/clarify/context-builder.ts` | 415 | ~20% | 90% | **PARTIAL** - 1,057 line test file exists |
| `lib/clarify/consolidation.ts` | 276 | ~15% | 90% | **MISSING** - No test file |

### Component Test Gaps (Priority 2-3)

| Component Area | Files | Total Lines | Tests Exist | Status |
|----------------|-------|-------------|-------------|--------|
| Reflection Views | 3 | 290 | No | **MISSING** |
| Reflection Mobile | 6 | 1,780 | No | **MISSING** (includes mega-component) |
| Dashboard Cards | 7 | 2,589 | 1 (TierBadge) | **MOSTLY MISSING** |
| Dashboard Shared | 6 | 799 | 1 (TierBadge) | **MOSTLY MISSING** |
| Auth Components | 4 | ~600 | No | **MISSING** |
| UI Glass | 3 | ~400 | 3 | **COVERED** |

### Hook Test Gaps (Priority 2)

| Hook | Lines | Tests | Key Functionality |
|------|-------|-------|-------------------|
| `useReflectionForm.ts` | 168 | **NONE** | Form state, localStorage, validation |
| `useReflectionViewMode.ts` | 62 | **NONE** | View mode switching |
| `useAuth.ts` | 177 | **NONE** | Auth state, signin/signup/signout |
| `usePortalState.ts` | 114 | **NONE** | Portal state management |
| `useAnimatedCounter.ts` | 82 | **NONE** | Animation logic |
| `useBreathingEffect.ts` | 87 | **NONE** | Animation timing |
| `useDashboard.ts` | 50 | **NONE** | Dashboard data fetching |
| `useScrollDirection.ts` | 75 | **NONE** | Scroll event handling |
| `useStaggerAnimation.ts` | 106 | **NONE** | Stagger animation timing |
| `useIsMobile.ts` | 33 | **NONE** | Media query hook |
| `useReducedMotion.ts` | 36 | **NONE** | Accessibility preference |
| `useKeyboardHeight.ts` | 48 | **NONE** | Virtual keyboard handling |

---

## tRPC Router Testing Strategy

### Existing Pattern Strengths (from dreams/reflections tests)

1. **Test Structure:**
   - Group by operation (get, update, delete, etc.)
   - Within each: success cases, error cases, authentication
   - Clear separation of concerns

2. **Mock Strategy:**
   - Use `mockImplementation` for table-specific responses
   - Handle call counting for multi-query operations
   - Reset mocks in `beforeEach`

### Recommended Test Structure for Missing Routers

#### reflection.ts (238 lines, 1 procedure: `create`)

```typescript
// test/integration/reflection/reflection.test.ts
describe('reflection.create', () => {
  describe('success cases', () => {
    it('should create reflection with valid input');
    it('should use premium features for unlimited tier');
    it('should use premium features for creator');
    it('should link to dream when dreamId provided');
    it('should use dream answer as title when no dreamId');
    it('should update user usage counters');
    it('should invalidate reflections cache');
    it('should trigger evolution check for pro/unlimited');
  });

  describe('Anthropic integration', () => {
    it('should call Anthropic with extended thinking for premium');
    it('should handle Anthropic API errors gracefully');
    it('should extract text from response correctly');
  });

  describe('error cases', () => {
    it('should throw on missing Anthropic API key');
    it('should throw on database save failure');
    it('should respect rate limits');
  });

  describe('tier limits', () => {
    it('should allow free tier within monthly limit');
    it('should block free tier at monthly limit');
    it('should respect daily limit for pro tier');
    it('should respect daily limit for unlimited tier');
  });
});
```

**Key Mock Requirements:**
- Anthropic client mock with extended thinking response
- Dreams table mock for title lookup
- Reflections table mock for insert
- Users table mock for counter update
- Cache mock for invalidation
- Evolution reports table mock for eligibility check

#### clarify.ts (731 lines, 6+ procedures)

```typescript
// test/integration/clarify/clarify.test.ts
describe('clarify.startSession', () => {
  it('should create session with context');
  it('should build context from user data');
  it('should handle missing user patterns gracefully');
  it('should enforce session limits per tier');
});

describe('clarify.sendMessage', () => {
  describe('basic messaging', () => {
    it('should send message and get response');
    it('should handle extended thinking');
    it('should save message history');
  });

  describe('tool use', () => {
    it('should handle createDream tool');
    it('should link session to created dream');
    it('should return tool use result in response');
  });

  describe('error handling', () => {
    it('should handle Anthropic errors');
    it('should handle rate limiting');
  });
});

describe('clarify.getSession', () => { ... });
describe('clarify.getSessions', () => { ... });
describe('clarify.endSession', () => { ... });
```

**Key Mock Requirements:**
- Context builder module mock
- Clarify sessions table mock
- Clarify messages table mock
- Dreams table mock (for tool use)
- File system mock (for prompt loading)

#### evolution.ts (621 lines)

```typescript
// test/integration/evolution/evolution.test.ts
describe('evolution.generate', () => {
  it('should generate evolution report');
  it('should gather reflections since last report');
  it('should call Anthropic with extended thinking');
  it('should save report to database');
  it('should enforce tier requirements');
});

describe('evolution.getReport', () => {
  it('should return report by ID');
  it('should verify ownership');
  it('should return NOT_FOUND for non-existent');
});

describe('evolution.getReports', () => {
  it('should list user reports');
  it('should support pagination');
});
```

#### visualizations.ts (413 lines)

```typescript
// test/integration/visualizations/visualizations.test.ts
describe('visualizations.generate', () => {
  it('should generate visualization for dream');
  it('should handle different visualization types');
  it('should save visualization to database');
});

describe('visualizations.getByDream', () => { ... });
describe('visualizations.list', () => { ... });
```

---

## Component Testing Strategy

### Pattern to Follow (from GlowButton.test.tsx)

```typescript
describe('ComponentName', () => {
  describe('rendering', () => {
    // Basic render tests
    test('renders correctly with required props');
    test('renders children/content');
  });

  describe('variants/states', () => {
    // Test all visual variants
    test('applies correct variant classes');
    test('applies correct size classes');
  });

  describe('interactions', () => {
    // User interaction tests
    test('calls onClick when clicked');
    test('does not call onClick when disabled');
    test('triggers haptic feedback');
  });

  describe('accessibility', () => {
    // WCAG compliance
    test('has proper ARIA attributes');
    test('supports keyboard navigation');
    test('meets minimum touch target size');
  });
});
```

### Priority Component Tests

#### MobileReflectionFlow Refactoring (PRE-REQUISITE)

Before testing, split into:
- `useMobileReflectionForm.ts` - Form state hook
- `useMobileReflectionFlow.ts` - Flow/step management hook
- `MobileDreamSelectionView.tsx` - Dream selection step
- `MobileQuestionnaireView.tsx` - Questions step
- `MobileReflectionOutputView.tsx` - Output display

Each can then be tested independently.

#### Dashboard Cards Testing

```typescript
// components/dashboard/cards/__tests__/DreamsCard.test.tsx
describe('DreamsCard', () => {
  it('renders loading skeleton when loading');
  it('renders dream list when loaded');
  it('shows empty state when no dreams');
  it('navigates to dream detail on click');
  it('shows correct status indicators');
});
```

**Common Test Utilities Needed:**
- `renderWithProviders` - Custom render with tRPC, auth context
- `createMockDream` - Dream fixture factory
- `mockTRPCQuery` - tRPC query result mock

---

## Hook Testing Strategy

### Pattern: renderHook with act()

```typescript
import { renderHook, act } from '@testing-library/react';
import { useReflectionForm } from '../useReflectionForm';

describe('useReflectionForm', () => {
  describe('initial state', () => {
    it('should have empty form data initially', () => {
      const { result } = renderHook(() => useReflectionForm({ dreams: [] }));
      expect(result.current.formData.dream).toBe('');
    });

    it('should load from localStorage if valid', () => {
      localStorage.setItem('reflection-form', JSON.stringify({ ... }));
      const { result } = renderHook(() => useReflectionForm({ dreams: [] }));
      expect(result.current.formData.dream).toBe('saved value');
    });
  });

  describe('state updates', () => {
    it('should update field on handleFieldChange', () => {
      const { result } = renderHook(() => useReflectionForm({ dreams: [] }));
      act(() => {
        result.current.handleFieldChange('dream', 'My dream');
      });
      expect(result.current.formData.dream).toBe('My dream');
    });
  });

  describe('validation', () => {
    it('should return false when dreamId is empty', () => {
      const { result } = renderHook(() => useReflectionForm({ dreams: [] }));
      expect(result.current.validateForm()).toBe(false);
    });
  });

  describe('persistence', () => {
    it('should save to localStorage on change', () => {
      const { result } = renderHook(() => useReflectionForm({ dreams: [] }));
      act(() => {
        result.current.handleFieldChange('dream', 'Test');
      });
      const saved = JSON.parse(localStorage.getItem('reflection-form')!);
      expect(saved.data.dream).toBe('Test');
    });
  });
});
```

### Hook Test Priority List

1. **useReflectionForm** (168 lines) - Complex state + localStorage + validation
2. **useAuth** (177 lines) - Critical auth flow, needs tRPC mock
3. **useReflectionViewMode** (62 lines) - URL sync logic
4. **usePortalState** (114 lines) - Complex state machine
5. **useDashboard** (50 lines) - tRPC data fetching
6. **useAnimatedCounter** (82 lines) - Animation timing
7. **useBreathingEffect** (87 lines) - Animation timing
8. **useStaggerAnimation** (106 lines) - Animation timing

---

## Recommendations for Each Phase

### Phase 1: Foundation & Refactoring (Iterations 1-2)

**Iteration 1: MobileReflectionFlow Refactoring**
- Extract hooks: `useMobileReflectionForm.ts`, `useMobileReflectionFlow.ts`
- Extract views: `MobileDreamSelectionView.tsx`, `MobileQuestionnaireView.tsx`, `MobileReflectionOutputView.tsx`
- Goal: Reduce MobileReflectionFlow.tsx from 812 to <300 lines
- **Test Pattern:** Each extracted hook/component gets co-located test file

**Iteration 2: Test Infrastructure Hardening**
- Create `test/factories/` directory with:
  - `user.factory.ts` (extend existing fixtures)
  - `dream.factory.ts` (extend existing fixtures)
  - `reflection.factory.ts` (extend existing fixtures)
  - `clarify-session.factory.ts` (new)
- Create `test/helpers/`:
  - `render.tsx` - Custom render with providers
  - `trpc.ts` - tRPC mock helpers
  - `supabase.ts` - Extend existing mocks
- Update `vitest.config.ts` coverage thresholds to 80%
- Add coverage blocking in CI

### Phase 2: tRPC Router Tests (Iterations 3-5)

**Iteration 3: Reflection Router**
- Create `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/integration/reflection/reflection.test.ts`
- Follow existing pattern from `dreams/crud.test.ts`
- Key focus: Anthropic mock with extended thinking, tier limits
- Target: 85%+ coverage

**Iteration 4: Clarify Router**
- Create `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/integration/clarify/clarify.test.ts`
- Test all 6+ procedures
- Key focus: Tool use (createDream), context building, streaming
- Target: 85%+ coverage

**Iteration 5: Evolution + Visualizations Routers**
- Create test files for both
- Key focus: Extended thinking responses, database saves
- Target: 85%+ coverage each

### Phase 3: Hook Tests (Iteration 6)

- Create test files in `hooks/__tests__/`
- Use `@testing-library/react` with `renderHook`
- Priority: useReflectionForm, useAuth, useReflectionViewMode
- Test localStorage, URL sync, state transitions
- Target: 90%+ coverage for reflection hooks, 85%+ for others

### Phase 4: Component Tests (Iterations 7-9)

**Iteration 7: Reflection Components**
- Mobile views (from refactoring)
- Desktop views
- Tone selection, question cards
- Target: 80%+ coverage

**Iteration 8: Dashboard Components**
- All card components
- Shared components
- Target: 75%+ coverage

**Iteration 9: UI + Auth Components**
- Glass components (enhance existing)
- Form components
- Auth forms
- Target: 80%+ coverage

### Phase 5: Library Tests (Iteration 10)

- `lib/clarify/consolidation.ts` (new tests)
- `lib/clarify/context-builder.ts` (enhance existing)
- `server/lib/` utilities (enhance existing)
- Target: 90%+ coverage

### Phase 6: Integration Tests (Iteration 11)

- End-to-end tRPC flows
- Full dream lifecycle test
- Full reflection flow test
- Clarify conversation with tool use
- Target: Critical paths covered

### Phase 7: E2E Expansion (Iteration 12)

- Expand from 39 to 100+ tests
- Add: Dreams flow, Reflection flow, Clarify flow, Dashboard flow
- Mobile viewport tests
- Target: All critical user journeys covered

### Phase 8: Documentation & Polish (Iteration 13)

- Create `docs/testing/` documentation
- Add coverage badges
- CI/CD enhancements
- Final polish and gap filling

---

## Security Integration Points

**Authentication Tests Required:**
- JWT token expiry handling (`server/trpc/__tests__/jwt-expiry.test.ts` - exists)
- Auth middleware tests (`server/trpc/__tests__/auth-security.test.ts` - exists)
- CSRF protection (if applicable)

**Rate Limiting Tests Required:**
- Per-operation rate limits (`server/lib/__tests__/rate-limiter.test.ts` - exists)
- Tier-specific limits
- Bypass for tests (configured in setup.ts)

**Data Access Tests Required:**
- User can only access own dreams/reflections (tested in CRUD tests)
- Admin-only routes protection
- Demo user restrictions

---

## Performance Test Requirements

**Areas Needing Load Testing (Out of Scope but Flagged):**
- Clarify conversation with long message history
- Evolution report generation (processes many reflections)
- Dashboard data aggregation queries

**Current Test Suite Performance:**
- Estimated runtime: ~30s currently
- Expected growth: 2-3 minutes at 2000+ tests
- Recommendation: Parallelize in CI

---

## Complex Flows Needing E2E Tests

1. **Full Reflection Flow:**
   - Login -> Select dream -> Answer questions -> Generate reflection -> View output
   - Both desktop and mobile paths

2. **Clarify Conversation with Tool Use:**
   - Start session -> Send messages -> AI suggests createDream -> Dream created -> Session links to dream

3. **Dream Lifecycle:**
   - Create dream -> Multiple reflections -> Evolution report -> Complete/Archive/Release

4. **Subscription Flow:**
   - Free user -> Upgrade attempt -> Payment -> Tier change -> Feature unlock

---

## Test Infrastructure Enhancements Needed

### Missing Test Utilities

1. **Custom Render with Providers:**
```typescript
// test/helpers/render.tsx
export function renderWithProviders(
  ui: React.ReactElement,
  { user = freeTierUser, ...options } = {}
) {
  const Wrapper = ({ children }) => (
    <AuthProvider initialUser={user}>
      <ToastProvider>
        {children}
      </ToastProvider>
    </AuthProvider>
  );
  return render(ui, { wrapper: Wrapper, ...options });
}
```

2. **tRPC Query Mock Helper:**
```typescript
// test/helpers/trpc.ts
export function mockTRPCQuery<T>(
  queryName: string,
  data: T,
  options: { isLoading?: boolean; error?: Error } = {}
) {
  return {
    data,
    isLoading: options.isLoading ?? false,
    error: options.error ?? null,
    refetch: vi.fn(),
  };
}
```

3. **Clarify Session Factory:**
```typescript
// test/fixtures/clarify.ts
export const createMockClarifySession = (overrides = {}): ClarifySession => ({
  id: 'session-123',
  userId: 'user-123',
  dreamId: null,
  status: 'active',
  messages: [],
  createdAt: new Date().toISOString(),
  ...overrides,
});
```

---

## Notes & Observations

1. **MobileReflectionFlow is the biggest blocker** - At 812 lines, it's untestable in its current form. Refactoring must happen first.

2. **Excellent existing patterns** - The dreams CRUD tests and GlowButton tests provide great templates. Copy and adapt.

3. **Fixture system is well-designed** - The factory + pre-configured scenarios pattern is excellent. Extend it to clarify sessions.

4. **Mock system is comprehensive** - Supabase and Anthropic mocks cover most cases. May need streaming enhancements for clarify.

5. **E2E infrastructure exists but underutilized** - Playwright with page objects is set up. Just needs more test coverage.

6. **Hook testing is the biggest gap category** - 11 hooks, 0 tests. This is a significant risk area.

---

*Exploration completed: 2025-12-10*
*This report informs master planning decisions for plan-22*
