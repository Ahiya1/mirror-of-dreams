# Explorer 2 Report: Mock Infrastructure for Component Coverage

## Executive Summary

The project has a well-structured mock infrastructure with existing mocks for cookies, Supabase, and Anthropic. Component tests consistently follow inline mocking patterns for hooks (useAuth, useRouter, trpc). The critical PayPal SDK mock is not yet created and is required for PayPalCheckoutModal component testing. This report provides a comprehensive strategy for creating the required mocks.

## Mock Infrastructure Report

### Existing Mocks

| Mock | Path | Purpose |
|------|------|---------|
| Cookies Mock | `test/mocks/cookies.ts` | Mocks next/headers cookies for server-side tests |
| Supabase Mock | `test/mocks/supabase.ts` | Mocks Supabase client and auth operations |
| Anthropic Mock | `test/mocks/anthropic.ts` | Mocks Anthropic AI API for dream reflection tests |
| Haptic Utils | `vitest.setup.ts` (global) | Global mock for haptic feedback utilities |
| Global Fetch | `vitest.setup.ts` (global) | Global fetch mock for HTTP requests |

### Test Helpers Available

| Helper | Path | Purpose |
|--------|------|---------|
| tRPC Helpers | `test/helpers/trpc.ts` | createMockQueryResult, createMockLoadingResult, createMockErrorResult, createMockMutationResult |
| Render Helpers | `test/helpers/render.tsx` | Custom render with providers if needed |
| Index Barrel | `test/helpers/index.ts` | Re-exports all helpers |

### Test Factories Available

| Factory | Path | Purpose |
|---------|------|---------|
| User Factory | `test/factories/user.factory.ts` | createMockUser, pre-configured user scenarios (freeTierUser, proTierUser, etc.) |
| Dream Factory | `test/factories/dream.factory.ts` | createMockDream, dream scenarios |
| Reflection Factory | `test/factories/reflection.factory.ts` | createMockReflection, reflection scenarios |
| Clarify Factory | `test/factories/clarify.factory.ts` | Clarify session/message/pattern factories |

---

### New Mocks Required

#### 1. PayPal SDK Mock (CRITICAL)

- **Target:** `test/mocks/paypal-sdk.tsx`
- **Usage:** PayPalCheckoutModal tests
- **Dependencies to mock:**
  - `@paypal/react-paypal-js` package
  - `PayPalScriptProvider` component
  - `PayPalButtons` component

**Implementation approach:**

```tsx
// test/mocks/paypal-sdk.tsx
import { vi } from 'vitest';
import type { ReactNode } from 'react';

// Mock PayPalScriptProvider - just renders children
export const MockPayPalScriptProvider = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

// Mock PayPalButtons - renders a controllable button
interface MockPayPalButtonsProps {
  style?: Record<string, unknown>;
  createSubscription?: (data: unknown, actions: { subscription: { create: (config: unknown) => Promise<string> } }) => Promise<string>;
  onApprove?: (data: { subscriptionID?: string | null }) => Promise<void>;
  onError?: (err: Record<string, unknown>) => void;
  onCancel?: () => void;
}

export const mockPayPalActions = {
  subscription: {
    create: vi.fn().mockResolvedValue('SUB-123456789'),
  },
};

export const MockPayPalButtons = ({
  createSubscription,
  onApprove,
  onError,
  onCancel,
}: MockPayPalButtonsProps) => {
  const handleClick = async () => {
    try {
      if (createSubscription) {
        await createSubscription({}, mockPayPalActions);
      }
      if (onApprove) {
        await onApprove({ subscriptionID: 'SUB-123456789' });
      }
    } catch (error) {
      if (onError) {
        onError({ message: 'Test error' });
      }
    }
  };

  return (
    <div data-testid="paypal-buttons">
      <button onClick={handleClick} data-testid="paypal-subscribe-button">
        PayPal Subscribe
      </button>
      <button onClick={onCancel} data-testid="paypal-cancel-button">
        Cancel
      </button>
      <button
        onClick={() => onError?.({ message: 'PayPal error' })}
        data-testid="paypal-error-trigger"
      >
        Trigger Error
      </button>
    </div>
  );
};

// Module mock setup function
export const setupPayPalMock = () => {
  vi.mock('@paypal/react-paypal-js', () => ({
    PayPalScriptProvider: MockPayPalScriptProvider,
    PayPalButtons: MockPayPalButtons,
  }));
};
```

**Test usage pattern:**

```tsx
// In PayPalCheckoutModal.test.tsx
import { vi } from 'vitest';
import { mockPayPalActions } from '@/test/mocks/paypal-sdk';

vi.mock('@paypal/react-paypal-js', () => ({
  PayPalScriptProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PayPalButtons: (props: { onApprove?: (data: { subscriptionID: string }) => void }) => (
    <button
      data-testid="paypal-subscribe"
      onClick={() => props.onApprove?.({ subscriptionID: 'SUB-TEST-123' })}
    >
      Subscribe with PayPal
    </button>
  ),
}));
```

---

#### 2. tRPC Hook Mocking (Pattern Documentation)

The project already has a solid pattern for mocking tRPC hooks inline. Document and standardize this approach:

**Existing Pattern (from CheckoutButton.test.tsx):**

```tsx
vi.mock('@/lib/trpc', () => ({
  trpc: {
    subscriptions: {
      createCheckout: {
        useMutation: (options: {
          onSuccess: (data: { approvalUrl: string }) => void;
          onError: (err: Error) => void;
        }) => {
          return {
            mutate: (data: { tier: string; period: string }) => {
              mockMutate(data);
              options.onSuccess({ approvalUrl: 'https://paypal.com/checkout' });
            },
          };
        },
      },
    },
  },
}));
```

**Recommended reusable mock creator (optional enhancement):**

```tsx
// test/mocks/trpc.ts
import { vi } from 'vitest';

export const createTrpcMock = (config: {
  procedure: string;
  type: 'query' | 'mutation';
  defaultData?: unknown;
}) => {
  // Factory for creating consistent tRPC mocks
  // ... implementation details
};
```

---

#### 3. Router/Navigation Mocking (Pattern Documentation)

**Existing Pattern (from CheckoutButton.test.tsx):**

```tsx
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));
```

**Recommended reusable mock (optional enhancement):**

```tsx
// test/mocks/next-navigation.ts
import { vi } from 'vitest';

export const mockRouter = {
  push: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
};

export const mockSearchParams = new URLSearchParams();

export const mockPathname = '/';

export const setupNavigationMock = () => {
  vi.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
    useSearchParams: () => mockSearchParams,
    usePathname: () => mockPathname,
  }));
};
```

---

#### 4. User Context / useAuth Mocking (Pattern Documentation)

**Existing Pattern (from DashboardHero.test.tsx):**

```tsx
// Mock useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// In setup/beforeEach:
const setupAuth = (user: User | null = defaultUser) => {
  const defaultAuth = {
    user,
    isAuthenticated: !!user,
    isLoading: false,
    error: null,
    logout: vi.fn(),
    refreshUser: vi.fn(),
    setUser: vi.fn(),
  };
  vi.mocked(useAuth).mockReturnValue(defaultAuth);
  return defaultAuth;
};
```

**Recommended reusable mock:**

```tsx
// test/mocks/auth.ts
import { vi } from 'vitest';
import type { User } from '@/types';
import { createMockUser } from '@/test/factories';

export interface MockAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  logout: ReturnType<typeof vi.fn>;
  refreshUser: ReturnType<typeof vi.fn>;
  setUser: ReturnType<typeof vi.fn>;
}

export const createMockAuthReturn = (user: User | null = createMockUser()): MockAuthReturn => ({
  user,
  isAuthenticated: !!user,
  isLoading: false,
  error: null,
  logout: vi.fn(),
  refreshUser: vi.fn().mockResolvedValue(undefined),
  setUser: vi.fn(),
});

export const mockUseAuth = vi.fn<[], MockAuthReturn>();

export const setupAuthMock = (defaultUser: User | null = createMockUser()) => {
  mockUseAuth.mockReturnValue(createMockAuthReturn(defaultUser));
  
  vi.mock('@/hooks/useAuth', () => ({
    useAuth: () => mockUseAuth(),
  }));
};
```

---

#### 5. Toast Context Mocking (Pattern Documentation)

**Existing Pattern:**

```tsx
const mockToast = {
  info: vi.fn(),
  error: vi.fn(),
  success: vi.fn(),
};
vi.mock('@/contexts/ToastContext', () => ({
  useToast: () => mockToast,
}));
```

**Recommended reusable mock:**

```tsx
// test/mocks/toast.ts
import { vi } from 'vitest';

export const mockToast = {
  info: vi.fn(),
  error: vi.fn(),
  success: vi.fn(),
  warning: vi.fn(),
  dismiss: vi.fn(),
};

export const setupToastMock = () => {
  vi.mock('@/contexts/ToastContext', () => ({
    useToast: () => mockToast,
  }));
};

export const resetToastMocks = () => {
  Object.values(mockToast).forEach(fn => fn.mockReset());
};
```

---

### PayPalCheckoutModal Test Requirements

The `PayPalCheckoutModal` component has these dependencies that need mocking:

| Dependency | Mock Approach |
|------------|---------------|
| `@paypal/react-paypal-js` | PayPal SDK mock (new - CRITICAL) |
| `useAuth` from `@/hooks/useAuth` | Auth mock pattern |
| `useToast` from `@/contexts/ToastContext` | Toast mock pattern |
| `trpc.subscriptions.getPlanId.useQuery` | tRPC query mock |
| `trpc.subscriptions.activateSubscription.useMutation` | tRPC mutation mock |
| `process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID` | Already set in vitest.setup.ts |

**Test scenarios for PayPalCheckoutModal:**

1. **Rendering states:**
   - Not open (returns null)
   - Loading state (shows CosmicLoader)
   - Error state (shows error message)
   - Ready state (shows PayPal buttons)
   - Missing client ID (shows not configured message)

2. **User interactions:**
   - Close button click
   - Backdrop click
   - PayPal approval success flow
   - PayPal error handling
   - PayPal cancel handling

3. **Tier variations:**
   - Seeker tier monthly/yearly
   - Devoted tier monthly/yearly
   - Price display accuracy

---

### Recommendations

#### Priority Order for Mock Creation

1. **P0 (Blocker):** PayPal SDK Mock (`test/mocks/paypal-sdk.tsx`)
   - Required for PayPalCheckoutModal tests
   - Must be created before builder iteration starts

2. **P1 (High):** Auth Mock Enhancement (`test/mocks/auth.ts`)
   - Standardizes auth mocking across all component tests
   - Reduces code duplication

3. **P2 (Medium):** Toast Mock (`test/mocks/toast.ts`)
   - Common utility for many components
   - Simple to implement

4. **P2 (Medium):** Navigation Mock (`test/mocks/next-navigation.ts`)
   - Standardizes router mocking
   - Useful for navigation-heavy components

5. **P3 (Low):** tRPC Mock Factory
   - Current inline pattern works well
   - Factory would reduce boilerplate but not critical

#### Implementation Notes

1. **Mock Location:** All new mocks should go in `test/mocks/` directory
2. **Export Pattern:** Use named exports and provide setup functions
3. **Type Safety:** Include TypeScript types for all mock configurations
4. **Vitest Compatibility:** Use `vi.fn()` and `vi.mock()` patterns
5. **Reset Strategy:** Provide reset functions for use in `beforeEach`

#### PayPal SDK Mock Technical Details

The `@paypal/react-paypal-js` library provides:
- `PayPalScriptProvider`: Context provider that loads PayPal SDK
- `PayPalButtons`: Button component with callbacks

The mock must:
1. Skip actual SDK loading (no network calls)
2. Render controllable buttons for testing
3. Allow triggering onApprove, onError, onCancel callbacks
4. Support createSubscription callback testing

---

### Files to Create

| File | Priority | Description |
|------|----------|-------------|
| `test/mocks/paypal-sdk.tsx` | P0 | PayPal SDK mock components |
| `test/mocks/auth.ts` | P1 | Reusable useAuth mock |
| `test/mocks/toast.ts` | P2 | Reusable useToast mock |
| `test/mocks/next-navigation.ts` | P2 | Next.js navigation mocks |

### Test Files Expected

| Component | Test File | Primary Mocks Needed |
|-----------|-----------|---------------------|
| PayPalCheckoutModal | `components/subscription/__tests__/PayPalCheckoutModal.test.tsx` | PayPal SDK, tRPC, Auth, Toast |

---

## Questions for Planner

- Should we create a global mock setup file that imports all common mocks, or keep the current inline pattern for flexibility?
- Should the PayPal mock support testing the full subscription flow (createSubscription -> onApprove), or just simulate already-created subscriptions?
- Are there other subscription components that will need PayPal mocking beyond PayPalCheckoutModal?
