# Mocking Guide

This guide covers how to mock external dependencies in Mirror of Dreams tests, including Anthropic SDK, Supabase, tRPC, cookies, and authentication.

## Table of Contents

- [Anthropic SDK Mocking](#anthropic-sdk-mocking)
- [Supabase Client Mocking](#supabase-client-mocking)
- [tRPC Context Mocking](#trpc-context-mocking)
- [Cookie and Auth Mocking](#cookie-and-auth-mocking)
- [Common Mock Patterns](#common-mock-patterns)

## Anthropic SDK Mocking

### Basic Anthropic Mock

Mock the Anthropic client for tests that call AI APIs:

```typescript
import { vi } from 'vitest';

// Mock the Anthropic module
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        id: 'msg_test123',
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: 'This is a mock AI response.',
          },
        ],
        model: 'claude-sonnet-4-20250514',
        stop_reason: 'end_turn',
        usage: {
          input_tokens: 100,
          output_tokens: 50,
        },
      }),
    },
  })),
}));
```

### Mocking Streaming Responses

For tests involving streaming AI responses:

```typescript
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      stream: vi.fn().mockImplementation(async function* () {
        // Simulate streaming chunks
        yield {
          type: 'content_block_start',
          index: 0,
          content_block: { type: 'text', text: '' },
        };
        yield {
          type: 'content_block_delta',
          index: 0,
          delta: { type: 'text_delta', text: 'Hello ' },
        };
        yield {
          type: 'content_block_delta',
          index: 0,
          delta: { type: 'text_delta', text: 'World!' },
        };
        yield {
          type: 'message_stop',
        };
      }),
    },
  })),
}));
```

### Mocking with Stream Helper

Using the SDK's stream helper pattern:

```typescript
const mockStream = {
  async *[Symbol.asyncIterator]() {
    yield {
      type: 'content_block_delta',
      delta: { type: 'text_delta', text: 'Streaming ' },
    };
    yield {
      type: 'content_block_delta',
      delta: { type: 'text_delta', text: 'response' },
    };
  },
  finalMessage: vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'Streaming response' }],
    usage: { input_tokens: 50, output_tokens: 25 },
  }),
};

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      stream: vi.fn().mockReturnValue(mockStream),
    },
  })),
}));
```

### Mocking Tool Use

For testing tool use (function calling) with Claude:

```typescript
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        id: 'msg_tool_use',
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'toolu_01ABC123',
            name: 'createDream',
            input: {
              title: 'New Dream',
              description: 'AI-generated dream',
              category: 'personal_growth',
            },
          },
        ],
        stop_reason: 'tool_use',
        usage: {
          input_tokens: 150,
          output_tokens: 75,
        },
      }),
    },
  })),
}));
```

### Mocking Extended Thinking

For testing Claude's extended thinking capability:

```typescript
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        id: 'msg_thinking',
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'thinking',
            thinking: 'Let me analyze this carefully...',
          },
          {
            type: 'text',
            text: 'Based on my analysis, here is my response.',
          },
        ],
        stop_reason: 'end_turn',
        usage: {
          input_tokens: 200,
          output_tokens: 300,
        },
      }),
    },
  })),
}));
```

### Mocking Error Responses

```typescript
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockRejectedValue(new Error('API rate limit exceeded')),
    },
  })),
}));

// Or with specific error types
vi.mock('@anthropic-ai/sdk', () => {
  class APIError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
      this.name = 'APIError';
    }
  }

  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn().mockRejectedValue(new APIError('Rate limit exceeded', 429)),
      },
    })),
    APIError,
  };
});
```

## Supabase Client Mocking

### Basic Supabase Mock

```typescript
import { vi } from 'vitest';

vi.mock('@/server/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

import { supabase } from '@/server/lib/supabase';
```

### Mocking Select Queries

```typescript
describe('fetch dreams', () => {
  it('should return dreams for user', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [
              { id: 'dream-1', title: 'Dream 1' },
              { id: 'dream-2', title: 'Dream 2' },
            ],
            error: null,
          }),
        }),
      }),
    } as any);

    const result = await fetchDreams('user-123');

    expect(result).toHaveLength(2);
  });
});
```

### Mocking Insert Operations

```typescript
describe('create dream', () => {
  it('should insert and return new dream', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'new-dream-id',
              title: 'New Dream',
              created_at: new Date().toISOString(),
            },
            error: null,
          }),
        }),
      }),
    } as any);

    const result = await createDream({ title: 'New Dream' });

    expect(result.id).toBe('new-dream-id');
  });
});
```

### Mocking Update Operations

```typescript
describe('update dream', () => {
  it('should update and return dream', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'dream-1',
                title: 'Updated Title',
                updated_at: new Date().toISOString(),
              },
              error: null,
            }),
          }),
        }),
      }),
    } as any);

    const result = await updateDream('dream-1', { title: 'Updated Title' });

    expect(result.title).toBe('Updated Title');
  });
});
```

### Mocking Delete Operations

```typescript
describe('delete dream', () => {
  it('should soft delete dream', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    } as any);

    await expect(deleteDream('dream-1')).resolves.not.toThrow();
  });
});
```

### Mocking Database Errors

```typescript
describe('error handling', () => {
  it('should throw on database error', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: {
            code: 'PGRST116',
            message: 'The result contains 0 rows',
            details: null,
            hint: null,
          },
        }),
      }),
    } as any);

    await expect(fetchDream('nonexistent')).rejects.toThrow('Not found');
  });
});
```

### Mocking RPC Calls

```typescript
describe('rpc calls', () => {
  it('should call custom function', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: { count: 5 },
      error: null,
    } as any);

    const result = await supabase.rpc('get_reflection_count', {
      user_id: 'user-123',
    });

    expect(result.data.count).toBe(5);
  });
});
```

## tRPC Context Mocking

### Using createMockContext

The `createMockContext` helper creates a tRPC context for testing routers directly:

```typescript
import { createMockContext } from '@/test/helpers';
import { freeTierUser, proTierUser } from '@/test/factories';
import { appRouter } from '@/server/trpc/routers/_app';

describe('dreams router', () => {
  it('should require authentication', async () => {
    const ctx = createMockContext(null); // No user = unauthenticated
    const caller = appRouter.createCaller(ctx);

    await expect(caller.dreams.list()).rejects.toThrow('UNAUTHORIZED');
  });

  it('should allow authenticated access', async () => {
    const ctx = createMockContext(freeTierUser);
    const caller = appRouter.createCaller(ctx);

    // Setup database mock
    // ...

    const result = await caller.dreams.list();

    expect(Array.isArray(result)).toBe(true);
  });
});
```

### Mocking tRPC Hooks in Components

```typescript
import { vi } from 'vitest';
import { trpc } from '@/lib/trpc';
import {
  createMockQueryResult,
  createMockLoadingResult,
  createMockErrorResult,
  createMockMutation,
} from '@/test/helpers';

vi.mock('@/lib/trpc', () => ({
  trpc: {
    dreams: {
      list: { useQuery: vi.fn() },
      create: { useMutation: vi.fn() },
      getLimits: { useQuery: vi.fn() },
    },
    auth: {
      me: { useQuery: vi.fn() },
    },
  },
}));

describe('DreamsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful state
    vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
      createMockQueryResult([activeDream, achievedDream])
    );

    vi.mocked(trpc.dreams.getLimits.useQuery).mockReturnValue(
      createMockQueryResult({ dreamsUsed: 2, dreamsLimit: 5 })
    );
  });

  it('should display dreams', () => {
    renderWithProviders(<DreamsPage />);

    expect(screen.getByText(activeDream.title)).toBeInTheDocument();
  });
});
```

### Mocking Mutations with Callbacks

```typescript
describe('CreateDreamForm', () => {
  it('should call onSuccess after creating dream', async () => {
    const onSuccess = vi.fn();

    const mockMutation = createMockMutation({
      implementation: async (input) => ({
        id: 'new-dream',
        ...input,
      }),
    });

    // Simulate onSuccess callback
    mockMutation.mutate.mockImplementation((input, options) => {
      mockMutation.mutateAsync(input).then(() => {
        options?.onSuccess?.();
      });
    });

    vi.mocked(trpc.dreams.create.useMutation).mockReturnValue(mockMutation);

    renderWithProviders(<CreateDreamForm onSuccess={onSuccess} />);

    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
```

## Cookie and Auth Mocking

### Mocking next/headers cookies

```typescript
const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
  has: vi.fn(),
  getAll: vi.fn(),
};

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

describe('auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should set auth cookie on signin', async () => {
    await signin({ email: 'test@example.com', password: 'password' });

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'auth_token',
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
      })
    );
  });

  it('should clear cookie on logout', async () => {
    await logout();

    expect(mockCookieStore.delete).toHaveBeenCalledWith('auth_token');
  });
});
```

### Mocking JWT Verification

```typescript
vi.mock('@/server/lib/jwt', () => ({
  verifyToken: vi.fn(),
  signToken: vi.fn(),
}));

import { verifyToken, signToken } from '@/server/lib/jwt';

describe('token verification', () => {
  it('should return user for valid token', async () => {
    vi.mocked(verifyToken).mockResolvedValue({
      userId: 'user-123',
      email: 'test@example.com',
    });

    const result = await verifyToken('valid-token');

    expect(result.userId).toBe('user-123');
  });

  it('should throw for expired token', async () => {
    vi.mocked(verifyToken).mockRejectedValue(new Error('Token expired'));

    await expect(verifyToken('expired-token')).rejects.toThrow('Token expired');
  });
});
```

### Mocking Rate Limiting

```typescript
vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: vi.fn().mockImplementation(() => ({
    limit: vi.fn().mockResolvedValue({
      success: true,
      remaining: 4,
      reset: Date.now() + 60000,
    }),
  })),
}));

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn().mockImplementation(() => ({})),
}));

describe('rate limiting', () => {
  it('should allow requests under limit', async () => {
    const rateLimiter = new Ratelimit({
      redis: new Redis(),
      limiter: Ratelimit.slidingWindow(5, '60 s'),
    });

    const result = await rateLimiter.limit('user-ip');

    expect(result.success).toBe(true);
    expect(result.remaining).toBeGreaterThan(0);
  });
});
```

## Common Mock Patterns

### Reset Mocks Between Tests

Always reset mocks in `beforeEach`:

```typescript
describe('Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Clear call history
    // OR
    vi.resetAllMocks(); // Clear calls and reset implementation
    // OR
    vi.restoreAllMocks(); // Restore original implementation
  });
});
```

### Conditional Mock Implementation

```typescript
describe('conditional behavior', () => {
  it('should handle different inputs', async () => {
    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'dreams') {
        return {
          select: vi.fn().mockResolvedValue({
            data: [{ id: 'dream-1' }],
            error: null,
          }),
        } as any;
      }
      if (table === 'reflections') {
        return {
          select: vi.fn().mockResolvedValue({
            data: [{ id: 'reflection-1' }],
            error: null,
          }),
        } as any;
      }
      return {} as any;
    });

    // Test code that queries multiple tables
  });
});
```

### Spying on Methods

When you want to verify calls without changing behavior:

```typescript
import { vi, type SpyInstance } from 'vitest';

describe('analytics', () => {
  let consoleSpy: SpyInstance;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should log analytics events', () => {
    trackEvent('dream_created', { dreamId: '123' });

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('dream_created'));
  });
});
```

### Mock Timers

```typescript
describe('time-based features', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should debounce search', async () => {
    const onSearch = vi.fn();
    renderWithProviders(<SearchInput onSearch={onSearch} debounce={300} />);

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'test' },
    });

    expect(onSearch).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);

    expect(onSearch).toHaveBeenCalledWith('test');
  });
});
```

## Related Documentation

- [Testing Patterns](./patterns.md) - Component and hook testing patterns
- [Test Factories](./factories.md) - Creating test data
- [E2E Testing](./e2e.md) - Playwright mocking patterns
