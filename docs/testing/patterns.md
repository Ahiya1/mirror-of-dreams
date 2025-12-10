# Testing Patterns

This guide covers the testing patterns used throughout Mirror of Dreams, including component testing, hook testing, and tRPC router testing.

## Table of Contents

- [Component Testing Patterns](#component-testing-patterns)
- [Hook Testing Patterns](#hook-testing-patterns)
- [tRPC Router Testing](#trpc-router-testing)
- [Mock Patterns](#mock-patterns)
- [Test Organization](#test-organization)

## Component Testing Patterns

### Basic Component Test

Use `renderWithProviders` from `@/test/helpers` for all component tests:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/helpers';

import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    renderWithProviders(<MyComponent title="Hello" />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Testing with User Context

```typescript
import { renderWithProviders, screen } from '@/test/helpers';
import { freeTierUser, proTierUser } from '@/test/factories';

describe('Dashboard', () => {
  it('should show upgrade prompt for free tier', () => {
    renderWithProviders(<Dashboard />, { user: freeTierUser });

    expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();
  });

  it('should hide upgrade prompt for pro tier', () => {
    renderWithProviders(<Dashboard />, { user: proTierUser });

    expect(screen.queryByText('Upgrade to Pro')).not.toBeInTheDocument();
  });
});
```

### Testing with Custom QueryClient

For tests that need pre-populated cache:

```typescript
import { renderWithProviders, createTestQueryClient, screen } from '@/test/helpers';
import { activeDream } from '@/test/factories';

describe('DreamDetail', () => {
  it('should display cached dream immediately', () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(['dreams', 'dream-123'], activeDream);

    renderWithProviders(<DreamDetail id="dream-123" />, { queryClient });

    expect(screen.getByText(activeDream.title)).toBeInTheDocument();
  });
});
```

### Testing Loading States

```typescript
import { vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/helpers';
import { createMockLoadingResult } from '@/test/helpers';
import { trpc } from '@/lib/trpc';

vi.mock('@/lib/trpc');

describe('DreamsCard', () => {
  it('should show loading skeleton', () => {
    vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
      createMockLoadingResult()
    );

    renderWithProviders(<DreamsCard />);

    expect(screen.getByTestId('cosmic-loader')).toBeInTheDocument();
  });
});
```

### Testing Error States

```typescript
import { createMockErrorResult } from '@/test/helpers';

describe('DreamsCard', () => {
  it('should show error message on failure', () => {
    vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
      createMockErrorResult(new Error('Network error'))
    );

    renderWithProviders(<DreamsCard />);

    expect(screen.getByText('Unable to load data')).toBeInTheDocument();
  });
});
```

### Testing User Interactions

```typescript
import { renderWithProviders, screen, fireEvent, waitFor } from '@/test/helpers';

describe('CreateDreamForm', () => {
  it('should submit form with entered data', async () => {
    const mockMutation = createMockMutation();
    vi.mocked(trpc.dreams.create.useMutation).mockReturnValue(mockMutation);

    renderWithProviders(<CreateDreamForm />);

    // Fill form
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'My Dream' }
    });
    fireEvent.change(screen.getByLabelText('Category'), {
      target: { value: 'career' }
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(mockMutation.mutate).toHaveBeenCalledWith({
        title: 'My Dream',
        category: 'career',
      });
    });
  });
});
```

### Testing Async Behavior

```typescript
import { waitFor, waitForElementToBeRemoved } from '@/test/helpers';

describe('AsyncComponent', () => {
  it('should show content after loading', async () => {
    // Start with loading state
    vi.mocked(trpc.data.useQuery).mockReturnValue(createMockLoadingResult());

    const { rerender } = renderWithProviders(<AsyncComponent />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Simulate data arrival
    vi.mocked(trpc.data.useQuery).mockReturnValue(
      createMockQueryResult({ items: ['a', 'b'] })
    );

    rerender(<AsyncComponent />);

    await waitFor(() => {
      expect(screen.getByText('a')).toBeInTheDocument();
    });
  });
});
```

## Hook Testing Patterns

### Testing Custom Hooks with renderHook

For hooks that don't require React context:

```typescript
import { renderHook, act } from '@testing-library/react';
import { useCounter } from '../useCounter';

describe('useCounter', () => {
  it('should increment count', () => {
    const { result } = renderHook(() => useCounter());

    expect(result.current.count).toBe(0);

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });
});
```

### Testing Hooks with Providers

For hooks that need QueryClient or other context:

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test/helpers';

function createWrapper() {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('useDreams', () => {
  it('should fetch dreams', async () => {
    const { result } = renderHook(() => useDreams(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(2);
  });
});
```

### Testing Hook State Changes

```typescript
describe('useToggle', () => {
  it('should toggle between states', () => {
    const { result } = renderHook(() => useToggle(false));

    expect(result.current[0]).toBe(false);

    act(() => {
      result.current[1](); // toggle
    });

    expect(result.current[0]).toBe(true);

    act(() => {
      result.current[1](); // toggle again
    });

    expect(result.current[0]).toBe(false);
  });
});
```

## tRPC Router Testing

### Using createMockContext

For testing tRPC procedures directly:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockContext } from '@/test/helpers';
import { freeTierUser, proTierUser } from '@/test/factories';
import { appRouter } from '@/server/trpc/routers/_app';

// Mock database client
vi.mock('@/server/lib/supabase');

describe('dreams router', () => {
  describe('list', () => {
    it('should return dreams for authenticated user', async () => {
      const ctx = createMockContext(freeTierUser);
      const caller = appRouter.createCaller(ctx);

      // Mock the database response
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [activeDream, achievedDream],
            error: null,
          }),
        }),
      } as any);

      const result = await caller.dreams.list();

      expect(result).toHaveLength(2);
    });

    it('should throw for unauthenticated user', async () => {
      const ctx = createMockContext(null);
      const caller = appRouter.createCaller(ctx);

      await expect(caller.dreams.list()).rejects.toThrow('Unauthorized');
    });
  });
});
```

### Testing Protected Procedures

```typescript
describe('protected procedure', () => {
  it('should reject unauthenticated requests', async () => {
    const ctx = createMockContext(null);
    const caller = appRouter.createCaller(ctx);

    await expect(caller.reflection.create({ dreamId: '123', content: 'test' })).rejects.toThrow();
  });

  it('should allow authenticated requests', async () => {
    const ctx = createMockContext(proTierUser);
    const caller = appRouter.createCaller(ctx);

    // Setup mocks for successful creation
    // ...

    const result = await caller.reflection.create({
      dreamId: '123',
      content: 'test',
    });

    expect(result.success).toBe(true);
  });
});
```

### Testing Mutations

```typescript
describe('dreams.create', () => {
  it('should create dream and return it', async () => {
    const ctx = createMockContext(freeTierUser);
    const caller = appRouter.createCaller(ctx);

    // Mock database insert
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [{ id: 'new-dream', title: 'Test' }],
          error: null,
        }),
      }),
    } as any);

    const result = await caller.dreams.create({
      title: 'Test Dream',
      category: 'career',
    });

    expect(result.id).toBe('new-dream');
  });

  it('should enforce dream limits for free tier', async () => {
    const ctx = createMockContext(freeTierUser);
    const caller = appRouter.createCaller(ctx);

    // Mock user already at limit (2 dreams for free tier)
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [{ count: 2 }],
          error: null,
        }),
      }),
    } as any);

    await expect(
      caller.dreams.create({ title: 'Third Dream', category: 'health' })
    ).rejects.toThrow('Dream limit reached');
  });
});
```

## Mock Patterns

### Mocking Next.js Router

```typescript
const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));
```

### Mocking Framer Motion

```typescript
import React from 'react';

vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: any, ref: any) => (
      <div ref={ref} {...props}>{children}</div>
    )),
    button: React.forwardRef(({ children, ...props }: any, ref: any) => (
      <button ref={ref} {...props}>{children}</button>
    )),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useReducedMotion: () => false,
}));
```

### Mocking UI Components

```typescript
vi.mock('@/components/ui/glass', () => ({
  GlassCard: ({ children, className }: any) => (
    <div className={className} data-testid="glass-card">
      {children}
    </div>
  ),
  GlowButton: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  CosmicLoader: ({ label }: any) => (
    <div data-testid="cosmic-loader">{label}</div>
  ),
}));
```

## Test Organization

### Describe Block Structure

```typescript
describe('ComponentName', () => {
  // Setup
  beforeEach(() => {
    vi.clearAllMocks();
    // Common setup
  });

  // Group related tests
  describe('rendering', () => {
    it('should render title', () => {});
    it('should render description', () => {});
  });

  describe('loading state', () => {
    it('should show loader', () => {});
    it('should hide content', () => {});
  });

  describe('error state', () => {
    it('should show error message', () => {});
    it('should allow retry', () => {});
  });

  describe('with data', () => {
    it('should display items', () => {});
    it('should handle empty state', () => {});
  });

  describe('interactions', () => {
    it('should handle click', () => {});
    it('should navigate on submit', () => {});
  });

  describe('accessibility', () => {
    it('should have correct roles', () => {});
    it('should be keyboard navigable', () => {});
  });

  describe('edge cases', () => {
    it('should handle null values', () => {});
    it('should handle long text', () => {});
  });
});
```

### Test Naming Conventions

```typescript
// Good: Describes behavior
it('should display loading skeleton while fetching dreams', () => {});
it('should navigate to dream detail when card is clicked', () => {});
it('should show error message when API call fails', () => {});

// Bad: Describes implementation
it('calls useQuery hook', () => {});
it('renders div with class loading', () => {});
it('sets state to error', () => {});
```

### Using Data-TestId Sparingly

Use semantic queries first, fall back to testId:

```typescript
// Preferred: Semantic queries
screen.getByRole('button', { name: 'Submit' });
screen.getByLabelText('Email');
screen.getByText('Welcome');

// Acceptable: When semantic queries don't work
screen.getByTestId('cosmic-loader');
screen.getByTestId('dream-card-dream-123');

// Bad: Using testId when semantic queries would work
screen.getByTestId('submit-button'); // Use getByRole instead
```

## Best Practices Summary

1. **Always use `renderWithProviders`** for component tests
2. **Mock at the boundary** - mock tRPC hooks, not internal implementations
3. **Use factories** for test data consistency
4. **Test user behavior** - focus on what users see and do
5. **Keep tests focused** - one logical assertion per test
6. **Clean up mocks** in `beforeEach` with `vi.clearAllMocks()`
7. **Use async utilities** properly (`waitFor`, `waitForElementToBeRemoved`)
8. **Prefer integration** over unit tests for React components

## Related Documentation

- [Mocking Guide](./mocking.md) - Detailed mocking patterns
- [Test Factories](./factories.md) - Creating test data
- [E2E Testing](./e2e.md) - Playwright patterns
