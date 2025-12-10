# Code Patterns & Conventions

## File Structure

```
test/
├── factories/              # Data factories (NEW)
│   ├── user.factory.ts     # User/UserRow factories
│   ├── dream.factory.ts    # Dream/DreamRow factories
│   ├── reflection.factory.ts # Reflection factories
│   ├── clarify.factory.ts  # ClarifySession/Message factories
│   └── index.ts            # Barrel export
├── helpers/                # Test utilities (NEW)
│   ├── render.tsx          # Custom render with providers
│   ├── trpc.ts             # tRPC client mocking
│   └── index.ts            # Barrel export
├── fixtures/               # Existing fixtures (keep)
│   ├── users.ts
│   ├── dreams.ts
│   ├── reflections.ts
│   └── form-data.ts
├── mocks/                  # Module mocks (keep)
│   ├── anthropic.ts
│   ├── supabase.ts
│   └── cookies.ts
└── integration/            # Integration tests (keep)
    └── setup.ts
```

## Naming Conventions

- Factory files: `{entity}.factory.ts` (e.g., `user.factory.ts`)
- Factory functions: `createMock{Entity}` (e.g., `createMockUser`)
- Row factories: `createMock{Entity}Row` (e.g., `createMockUserRow`)
- Scenario exports: `{descriptor}{Entity}` (e.g., `freeTierUser`, `activeSession`)
- Test files: `{module}.test.ts` or `{module}.test.tsx`
- Helper files: descriptive name (e.g., `render.tsx`, `trpc.ts`)

## Factory Patterns

### Basic Factory Pattern

**When to use:** Creating test data with sensible defaults that can be overridden.

```typescript
// test/factories/user.factory.ts
import type { User, UserRow } from '@/types/user';

/**
 * Creates a mock User object with sensible defaults
 * @param overrides - Partial user data to merge with defaults
 * @returns Complete User object
 */
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'test-user-uuid-1234',
  email: 'test@example.com',
  name: 'Test User',
  tier: 'free',
  subscriptionStatus: 'active',
  subscriptionPeriod: null,
  reflectionCountThisMonth: 0,
  reflectionsToday: 0,
  lastReflectionDate: null,
  totalReflections: 0,
  clarifySessionsThisMonth: 0,
  totalClarifySessions: 0,
  currentMonthYear: new Date().toISOString().slice(0, 7),
  cancelAtPeriodEnd: false,
  isCreator: false,
  isAdmin: false,
  isDemo: false,
  language: 'en',
  emailVerified: true,
  preferences: { ...defaultTestPreferences },
  createdAt: new Date().toISOString(),
  lastSignInAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});
```

**Key points:**
- Use `Partial<T>` for overrides to allow any subset of fields
- Spread overrides LAST to ensure they take precedence
- Return type must be the full type (not Partial)
- Document the factory with JSDoc

### Database Row Factory Pattern

**When to use:** Creating test data that matches database schema (snake_case).

```typescript
// test/factories/user.factory.ts
import type { UserRow } from '@/types/user';

/**
 * Creates a mock UserRow (database representation)
 * @param overrides - Partial row data to merge with defaults
 * @returns Complete UserRow object
 */
export const createMockUserRow = (overrides: Partial<UserRow> = {}): UserRow => ({
  id: 'test-user-uuid-1234',
  email: 'test@example.com',
  password_hash: '$2b$10$test-hash',
  name: 'Test User',
  tier: 'free',
  subscription_status: 'active',
  subscription_period: null,
  reflection_count_this_month: 0,
  reflections_today: 0,
  last_reflection_date: null,
  total_reflections: 0,
  clarify_sessions_this_month: 0,
  total_clarify_sessions: 0,
  current_month_year: new Date().toISOString().slice(0, 7),
  cancel_at_period_end: false,
  is_creator: false,
  is_admin: false,
  is_demo: false,
  language: 'en',
  email_verified: true,
  preferences: { ...defaultTestPreferences },
  created_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});
```

**Key points:**
- Use snake_case field names to match database
- Include all database fields (including password_hash, etc.)
- Pair with camelCase factory for full coverage

### Pre-configured Scenario Pattern

**When to use:** Common test scenarios that are used repeatedly.

```typescript
// test/factories/user.factory.ts

/**
 * Free tier user - fresh account, no reflections
 */
export const freeTierUser = createMockUser({
  id: 'free-user-001',
  email: 'free@example.com',
  name: 'Free User',
  tier: 'free',
  reflectionCountThisMonth: 0,
  totalReflections: 0,
});

/**
 * Pro tier user - active subscription
 */
export const proTierUser = createMockUser({
  id: 'pro-user-001',
  email: 'pro@example.com',
  name: 'Pro User',
  tier: 'pro',
  subscriptionStatus: 'active',
  subscriptionPeriod: 'monthly',
  reflectionCountThisMonth: 5,
  totalReflections: 25,
});

/**
 * User at tier limit
 */
export const freeTierAtLimit = createMockUser({
  id: 'free-user-at-limit',
  email: 'free-limit@example.com',
  name: 'Free User At Limit',
  tier: 'free',
  reflectionCountThisMonth: 2, // Free tier monthly limit
  totalReflections: 2,
});
```

**Key points:**
- Export as named constants (not functions)
- Use descriptive names that explain the scenario
- Document what makes the scenario special
- Keep IDs unique and recognizable

### ClarifySession Factory Pattern

**When to use:** Testing Clarify agent features.

```typescript
// test/factories/clarify.factory.ts
import type {
  ClarifySession,
  ClarifySessionRow,
  ClarifyMessage,
  ClarifyMessageRow,
  ClarifyPattern,
  ClarifyPatternRow,
  ClarifySessionStatus,
  ClarifyMessageRole,
  PatternType,
  ClarifyToolUse,
} from '@/types/clarify';

/**
 * Creates a mock ClarifySession with sensible defaults
 */
export const createMockClarifySession = (
  overrides: Partial<ClarifySession> = {}
): ClarifySession => ({
  id: 'session-uuid-1234',
  userId: 'test-user-uuid-1234',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  title: 'Test Clarify Session',
  lastMessageAt: new Date().toISOString(),
  messageCount: 0,
  status: 'active',
  dreamId: null,
  ...overrides,
});

/**
 * Creates a mock ClarifySessionRow (database representation)
 */
export const createMockClarifySessionRow = (
  overrides: Partial<ClarifySessionRow> = {}
): ClarifySessionRow => ({
  id: 'session-uuid-1234',
  user_id: 'test-user-uuid-1234',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  title: 'Test Clarify Session',
  last_message_at: new Date().toISOString(),
  message_count: 0,
  status: 'active',
  dream_id: null,
  ...overrides,
});

/**
 * Creates a mock ClarifyMessage
 */
export const createMockClarifyMessage = (
  overrides: Partial<ClarifyMessage> = {}
): ClarifyMessage => ({
  id: 'message-uuid-1234',
  sessionId: 'session-uuid-1234',
  createdAt: new Date().toISOString(),
  role: 'user',
  content: 'Test message content',
  tokenCount: 50,
  toolUse: null,
  ...overrides,
});

/**
 * Creates a mock ClarifyMessageRow (database representation)
 */
export const createMockClarifyMessageRow = (
  overrides: Partial<ClarifyMessageRow> = {}
): ClarifyMessageRow => ({
  id: 'message-uuid-1234',
  session_id: 'session-uuid-1234',
  created_at: new Date().toISOString(),
  role: 'user',
  content: 'Test message content',
  token_count: 50,
  tool_use: null,
  ...overrides,
});

/**
 * Creates a mock ClarifyPattern
 */
export const createMockClarifyPattern = (
  overrides: Partial<ClarifyPattern> = {}
): ClarifyPattern => ({
  id: 'pattern-uuid-1234',
  userId: 'test-user-uuid-1234',
  sessionId: 'session-uuid-1234',
  patternType: 'recurring_theme',
  content: 'Test pattern content about recurring themes',
  strength: 0.75,
  extractedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});
```

### Batch Factory Pattern

**When to use:** Creating multiple related entities.

```typescript
// test/factories/dream.factory.ts

/**
 * Creates multiple dreams for a user
 * @param count - Number of dreams to create
 * @param userId - User ID to associate dreams with
 * @returns Array of DreamRow objects
 */
export const createMockDreams = (
  count: number,
  userId: string = 'test-user-uuid-1234'
): DreamRow[] =>
  Array.from({ length: count }, (_, index) =>
    createMockDream({
      id: `dream-${String(index + 1).padStart(3, '0')}`,
      user_id: userId,
      title: `Dream ${index + 1}`,
      priority: (index % 10) + 1,
    })
  );

/**
 * Creates a session with pre-populated messages
 */
export const createSessionWithMessages = (
  messageCount: number,
  overrides: Partial<ClarifySession> = {}
): { session: ClarifySession; messages: ClarifyMessage[] } => {
  const session = createMockClarifySession({
    messageCount,
    ...overrides,
  });

  const messages = Array.from({ length: messageCount }, (_, index) =>
    createMockClarifyMessage({
      id: `message-${index + 1}`,
      sessionId: session.id,
      role: index % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${index + 1} content`,
      createdAt: new Date(Date.now() - (messageCount - index) * 60000).toISOString(),
    })
  );

  return { session, messages };
};
```

## Test Helper Patterns

### Custom Render with Providers

**When to use:** Component tests that need context providers.

```typescript
// test/helpers/render.tsx
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';

import type { User } from '@/types/user';

/**
 * Props for test provider wrapper
 */
interface TestProviderProps {
  children: ReactNode;
  user?: User | null;
  initialTRPCData?: Record<string, unknown>;
}

/**
 * Extended render options with custom fields
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  user?: User | null;
  initialTRPCData?: Record<string, unknown>;
}

/**
 * Wrapper component that provides all necessary contexts
 */
function TestProviders({
  children,
  user = null,
  initialTRPCData = {},
}: TestProviderProps): ReactElement {
  return (
    // Add providers here as needed
    // For now, just wrap children
    <>{children}</>
  );
}

/**
 * Custom render function that wraps components with test providers
 *
 * @param ui - React element to render
 * @param options - Render options including user context
 * @returns Render result with all testing-library queries
 *
 * @example
 * ```typescript
 * import { renderWithProviders } from '@/test/helpers';
 * import { freeTierUser } from '@/test/factories';
 *
 * const { getByText } = renderWithProviders(<MyComponent />, {
 *   user: freeTierUser
 * });
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult {
  const { user, initialTRPCData, ...renderOptions } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <TestProviders user={user} initialTRPCData={initialTRPCData}>
        {children}
      </TestProviders>
    ),
    ...renderOptions,
  });
}

/**
 * Re-export everything from @testing-library/react for convenience
 */
export * from '@testing-library/react';
```

**Key points:**
- Export `renderWithProviders` as main function
- Re-export all testing-library utilities
- Support passing user context
- Extensible for future providers (tRPC, etc.)

### tRPC Client Mock Helper

**When to use:** Component tests that make tRPC calls.

```typescript
// test/helpers/trpc.ts
import { vi } from 'vitest';

/**
 * Mock procedure result type
 */
type MockProcedureResult<T> = {
  data: T;
  isLoading: false;
  isError: false;
  error: null;
} | {
  data: undefined;
  isLoading: true;
  isError: false;
  error: null;
} | {
  data: undefined;
  isLoading: false;
  isError: true;
  error: Error;
};

/**
 * Creates a mock tRPC query result
 *
 * @param data - Data to return from the query
 * @returns Mock query result object
 *
 * @example
 * ```typescript
 * vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
 *   createMockQueryResult([activeDream, achievedDream])
 * );
 * ```
 */
export function createMockQueryResult<T>(data: T): MockProcedureResult<T> {
  return {
    data,
    isLoading: false,
    isError: false,
    error: null,
  };
}

/**
 * Creates a mock tRPC loading state
 */
export function createMockLoadingResult<T>(): MockProcedureResult<T> {
  return {
    data: undefined,
    isLoading: true,
    isError: false,
    error: null,
  };
}

/**
 * Creates a mock tRPC error state
 */
export function createMockErrorResult<T>(error: Error): MockProcedureResult<T> {
  return {
    data: undefined,
    isLoading: false,
    isError: true,
    error,
  };
}

/**
 * Creates a mock tRPC mutation
 *
 * @param implementation - Optional async function for mutation logic
 * @returns Mock mutation object with mutate and mutateAsync
 *
 * @example
 * ```typescript
 * vi.mocked(trpc.dreams.create.useMutation).mockReturnValue(
 *   createMockMutation(async (input) => ({ id: 'new-dream-id', ...input }))
 * );
 * ```
 */
export function createMockMutation<TInput, TOutput>(
  implementation?: (input: TInput) => Promise<TOutput>
) {
  const mutateAsync = implementation
    ? vi.fn(implementation)
    : vi.fn().mockResolvedValue(undefined);

  return {
    mutate: vi.fn((input: TInput) => {
      mutateAsync(input);
    }),
    mutateAsync,
    isLoading: false,
    isError: false,
    isSuccess: false,
    error: null,
    data: undefined,
    reset: vi.fn(),
  };
}

/**
 * Creates a mock tRPC infinite query result
 */
export function createMockInfiniteQueryResult<T>(pages: T[]) {
  return {
    data: {
      pages,
      pageParams: pages.map((_, i) => i),
    },
    isLoading: false,
    isError: false,
    error: null,
    hasNextPage: false,
    hasPreviousPage: false,
    fetchNextPage: vi.fn(),
    fetchPreviousPage: vi.fn(),
    isFetchingNextPage: false,
    isFetchingPreviousPage: false,
  };
}
```

## Testing Patterns

### Test File Structure

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Import helpers and factories
import { renderWithProviders, screen, waitFor } from '@/test/helpers';
import { createMockUser, freeTierUser, proTierUser } from '@/test/factories';

// Import component under test
import { ComponentUnderTest } from '../ComponentUnderTest';

describe('ComponentUnderTest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('rendering', () => {
    it('should render with default props', () => {
      // Arrange
      const props = { title: 'Test' };

      // Act
      renderWithProviders(<ComponentUnderTest {...props} />);

      // Assert
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });

  describe('user interactions', () => {
    it('should handle click events', async () => {
      // Arrange
      const onClick = vi.fn();

      // Act
      renderWithProviders(
        <ComponentUnderTest onClick={onClick} />,
        { user: freeTierUser }
      );

      // Assert
      await userEvent.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledOnce();
    });
  });

  describe('edge cases', () => {
    it('should handle null user', () => {
      renderWithProviders(<ComponentUnderTest />, { user: null });
      expect(screen.getByText('Please sign in')).toBeInTheDocument();
    });
  });
});
```

**Key points:**
- Use AAA (Arrange-Act-Assert) pattern
- Group tests by behavior/feature
- Clear mock state between tests
- Use descriptive test names

### Mocking Strategies

```typescript
// Mock external dependencies
vi.mock('@/lib/external', () => ({
  externalFunction: vi.fn().mockResolvedValue('mocked'),
}));

// Mock Supabase (already done in setup)
// Use the existing mockQuery helper from test/integration/setup.ts
import { createTestCaller } from '@/test/integration/setup';

describe('Integration Test', () => {
  it('should query database', async () => {
    const { caller, mockQuery } = createTestCaller(freeTierUser);

    mockQuery('dreams', {
      data: [activeDream],
      error: null
    });

    const result = await caller.dreams.list();
    expect(result).toHaveLength(1);
  });
});

// Mock fetch
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ data: 'mocked' }),
}));

// Spy on existing methods
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
```

### Coverage Expectations by Module Type

| Module Type | Minimum Coverage | Target Coverage |
|-------------|------------------|-----------------|
| Utils/Helpers | 90% | 95% |
| API Routes | 80% | 90% |
| tRPC Routers | 80% | 90% |
| Services | 85% | 90% |
| Components | 70% | 80% |
| Hooks | 75% | 85% |
| Factories | N/A (excluded) | N/A |

### Test Data Factories

```typescript
// test/factories/index.ts - Barrel export
export * from './user.factory';
export * from './dream.factory';
export * from './reflection.factory';
export * from './clarify.factory';

// Usage in tests
import {
  createMockUser,
  freeTierUser,
  createMockDream,
  activeDream,
  createMockClarifySession,
  activeSession,
} from '@/test/factories';
```

## Security Patterns

### Input Validation (Zod Schemas)

```typescript
import { z } from 'zod';

// Define schemas for all user input
export const createDreamSchema = z.object({
  title: z.string().min(1, 'Title required').max(200, 'Title too long'),
  description: z.string().max(2000).optional(),
  category: z.enum([
    'health', 'career', 'relationships', 'financial',
    'personal_growth', 'creative', 'spiritual',
    'entrepreneurial', 'educational', 'other'
  ]).default('other'),
  targetDate: z.string().datetime().optional(),
});

export type CreateDreamInput = z.infer<typeof createDreamSchema>;
```

### Test Assertions for Security

```typescript
describe('Security', () => {
  it('should reject invalid input', async () => {
    const { caller } = createTestCaller(freeTierUser);

    await expect(caller.dreams.create({
      title: '', // Empty title
    })).rejects.toThrow();
  });

  it('should not expose sensitive data in errors', async () => {
    const { caller } = createTestCaller(null); // Unauthenticated

    const error = await caller.auth.me().catch(e => e);
    expect(error.message).not.toContain('password');
    expect(error.message).not.toContain('hash');
  });
});
```

## Error Handling Patterns

### Error Boundary Testing

```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

describe('ErrorBoundary', () => {
  it('should catch and display errors', () => {
    const ThrowingComponent = () => {
      throw new Error('Test error');
    };

    renderWithProviders(
      <ErrorBoundary fallback={<div>Error occurred</div>}>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error occurred')).toBeInTheDocument();
  });
});
```

### Async Error Handling

```typescript
describe('Async Operations', () => {
  it('should handle API errors gracefully', async () => {
    const { caller, mockQuery } = createTestCaller(freeTierUser);

    mockQuery('dreams', {
      data: null,
      error: new Error('Database error')
    });

    await expect(caller.dreams.list()).rejects.toThrow('Database error');
  });
});
```

## Import Order Convention

```typescript
// 1. External libraries
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// 2. Test utilities (from test directory)
import { renderWithProviders } from '@/test/helpers';
import { createMockUser, freeTierUser } from '@/test/factories';

// 3. Application imports (types, then components, then utilities)
import type { User } from '@/types/user';
import { MyComponent } from '@/components/MyComponent';
import { formatDate } from '@/lib/utils';
```

## Barrel Export Pattern

```typescript
// test/factories/index.ts
// Export all factories from one place

// User factories
export {
  createMockUser,
  createMockUserRow,
  defaultTestPreferences,
  freeTierUser,
  proTierUser,
  unlimitedTierUser,
  freeTierAtLimit,
  proTierAtDailyLimit,
  unlimitedTierAtDailyLimit,
  canceledSubscriptionUser,
  expiredSubscriptionUser,
  creatorUser,
  adminUser,
  demoUser,
  hebrewUser,
  customPreferencesUser,
  newUser,
  createUserWithTier,
  createUserWithReflections,
  createUserWithLanguage,
  createMockUsers,
} from './user.factory';

// Dream factories
export {
  createMockDream,
  activeDream,
  achievedDream,
  archivedDream,
  releasedDream,
  openEndedDream,
  highPriorityDream,
  lowPriorityDream,
  overdueDream,
  futureDream,
  createMockDreams,
  createDreamForUser,
  createFreeTierDreams,
  createProTierDreams,
  createDreamWithCategory,
  createDreamWithStatus,
  createMockDreamWithStats,
  DREAM_TIER_LIMITS,
} from './dream.factory';

// Continue for other factories...
```

```typescript
// test/helpers/index.ts
// Export all helpers from one place

export {
  renderWithProviders,
  // Re-export testing-library utilities
  screen,
  waitFor,
  within,
  fireEvent,
} from './render';

export {
  createMockQueryResult,
  createMockLoadingResult,
  createMockErrorResult,
  createMockMutation,
  createMockInfiniteQueryResult,
} from './trpc';
```

## Code Quality Standards

- All factories must have JSDoc documentation
- All exported functions must have return type annotations
- Use `Partial<T>` for override parameters
- Never use `any` type (use `unknown` if type is truly unknown)
- All mock data should use obvious test values
- Keep factory defaults consistent with type definitions

## Performance Patterns

- Use `vi.clearAllMocks()` in `beforeEach` (not `vi.resetAllMocks()`)
- Avoid creating expensive mocks in describe blocks
- Use lazy initialization for heavy fixtures
- Keep test files focused (one component/module per file)
