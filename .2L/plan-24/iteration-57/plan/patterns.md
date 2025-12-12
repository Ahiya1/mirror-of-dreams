# Code Patterns & Conventions - Component Testing

## File Structure

```
{project-root}/
├── components/
│   ├── subscription/
│   │   ├── CancelSubscriptionModal.tsx
│   │   ├── PayPalCheckoutModal.tsx
│   │   ├── SubscriptionStatusCard.tsx
│   │   └── __tests__/
│   │       ├── CancelSubscriptionModal.test.tsx
│   │       ├── PayPalCheckoutModal.test.tsx
│   │       └── SubscriptionStatusCard.test.tsx
│   ├── dashboard/
│   │   ├── cards/
│   │   │   ├── SubscriptionCard.tsx
│   │   │   └── __tests__/
│   │   │       └── SubscriptionCard.test.tsx
│   │   └── shared/
│   │       ├── DashboardGrid.tsx
│   │       ├── WelcomeSection.tsx
│   │       └── __tests__/
│   │           ├── DashboardGrid.test.tsx
│   │           └── WelcomeSection.test.tsx
│   ├── shared/
│   │   ├── AppNavigation.tsx
│   │   ├── UserDropdownMenu.tsx
│   │   ├── MobileNavigationMenu.tsx
│   │   ├── NavigationBase.tsx
│   │   ├── CosmicBackground.tsx
│   │   └── __tests__/
│   │       ├── AppNavigation.test.tsx
│   │       ├── UserDropdownMenu.test.tsx
│   │       ├── MobileNavigationMenu.test.tsx
│   │       ├── NavigationBase.test.tsx
│   │       └── CosmicBackground.test.tsx
│   ├── navigation/
│   │   ├── BottomNavigation.tsx
│   │   └── __tests__/
│   │       └── BottomNavigation.test.tsx
│   ├── clarify/
│   │   ├── ClarifyCard.tsx
│   │   └── __tests__/
│   │       └── ClarifyCard.test.tsx
│   ├── reflections/
│   │   ├── ReflectionFilters.tsx
│   │   └── __tests__/
│   │       └── ReflectionFilters.test.tsx
│   └── profile/
│       ├── AccountInfoSection.tsx
│       └── __tests__/
│           └── AccountInfoSection.test.tsx
└── test/
    ├── mocks/
    │   └── paypal-sdk.tsx  (NEW - Created by Builder-1)
    ├── helpers/
    │   ├── trpc.ts
    │   └── index.ts
    └── factories/
        └── user.factory.ts
```

## Naming Conventions

- Test files: `{ComponentName}.test.tsx`
- Test directories: `__tests__/` adjacent to component
- Describe blocks: Component name
- Test names: Start with "should" or describe behavior directly

## Test File Structure Pattern

```typescript
// components/example/__tests__/ExampleComponent.test.tsx
// Tests for ExampleComponent

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// =============================================================================
// Mocks - MUST be before component imports
// =============================================================================

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: vi.fn(),
  }),
}));

const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// =============================================================================
// Component Import - AFTER mocks
// =============================================================================

import { ExampleComponent } from '../ExampleComponent';

// =============================================================================
// Helpers and Factories
// =============================================================================

import type { User } from '@/types';
import { createMockUser, proTierUser, freeTierUser } from '@/test/factories';
import { createMockQueryResult, createMockLoadingResult } from '@/test/helpers';

// =============================================================================
// Test Suite
// =============================================================================

describe('ExampleComponent', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: createMockUser(),
      isAuthenticated: true,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('rendering', () => {
    it('renders when open', () => {
      render(<ExampleComponent {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<ExampleComponent {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onClose when close button clicked', () => {
      render(<ExampleComponent {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /close/i }));
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has accessible dialog role', () => {
      render(<ExampleComponent {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
```

## Mock Patterns

### Pattern 1: useAuth Hook Mock

```typescript
const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// In beforeEach or test:
mockUseAuth.mockReturnValue({
  user: createMockUser({ tier: 'pro' }),
  isAuthenticated: true,
  isLoading: false,
  error: null,
  logout: vi.fn(),
  refreshUser: vi.fn(),
  setUser: vi.fn(),
});

// For null user:
mockUseAuth.mockReturnValue({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  logout: vi.fn(),
  refreshUser: vi.fn(),
  setUser: vi.fn(),
});
```

### Pattern 2: tRPC Query Mock

```typescript
vi.mock('@/lib/trpc', () => ({
  trpc: {
    subscriptions: {
      getStatus: {
        useQuery: vi.fn(),
      },
    },
  },
}));

import { trpc } from '@/lib/trpc';
import { createMockQueryResult, createMockLoadingResult, createMockErrorResult } from '@/test/helpers';

// Success state
vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue(
  createMockQueryResult({
    tier: 'pro',
    status: 'active',
    nextBillingDate: '2025-02-01',
  })
);

// Loading state
vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue(
  createMockLoadingResult()
);

// Error state
vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue(
  createMockErrorResult(new Error('Failed to fetch status'))
);
```

### Pattern 3: tRPC Mutation Mock

```typescript
const mockMutate = vi.fn();
const mockMutateAsync = vi.fn();

vi.mock('@/lib/trpc', () => ({
  trpc: {
    subscriptions: {
      cancel: {
        useMutation: (options?: {
          onSuccess?: () => void;
          onError?: (err: Error) => void;
        }) => ({
          mutate: (data: unknown) => {
            mockMutate(data);
            // Simulate success
            options?.onSuccess?.();
          },
          mutateAsync: mockMutateAsync,
          isPending: false,
          isError: false,
          isSuccess: false,
        }),
      },
    },
  },
}));

// Test mutation was called
expect(mockMutate).toHaveBeenCalledWith({ subscriptionId: 'sub-123' });
```

### Pattern 4: Next.js Navigation Mock

```typescript
const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockPathname = vi.fn().mockReturnValue('/dashboard');

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => mockPathname(),
}));

// Test navigation
fireEvent.click(screen.getByText('Go to Profile'));
expect(mockPush).toHaveBeenCalledWith('/profile');
```

### Pattern 5: Next/Link Mock

```typescript
vi.mock('next/link', () => ({
  default: ({ children, href, className }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// Test link href
const link = screen.getByRole('link', { name: /profile/i });
expect(link).toHaveAttribute('href', '/profile');
```

### Pattern 6: Toast Context Mock

```typescript
const mockToast = {
  info: vi.fn(),
  error: vi.fn(),
  success: vi.fn(),
  warning: vi.fn(),
};

vi.mock('@/contexts/ToastContext', () => ({
  useToast: () => mockToast,
}));

// Test toast called
fireEvent.click(screen.getByText('Cancel Subscription'));
expect(mockToast.success).toHaveBeenCalledWith('Subscription cancelled');
```

### Pattern 7: Framer Motion Mock

```typescript
import React from 'react';

vi.mock('framer-motion', () => {
  const MotionDiv = React.forwardRef<HTMLDivElement, any>(
    ({ children, className, onClick, ...props }, ref) => (
      <div ref={ref} className={className} onClick={onClick} {...props}>
        {children}
      </div>
    )
  );
  MotionDiv.displayName = 'MotionDiv';

  const MotionNav = React.forwardRef<HTMLElement, any>(
    ({ children, className, ...props }, ref) => (
      <nav ref={ref} className={className} {...props}>
        {children}
      </nav>
    )
  );
  MotionNav.displayName = 'MotionNav';

  return {
    motion: {
      div: MotionDiv,
      nav: MotionNav,
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useMotionValue: () => ({ get: () => 0, set: vi.fn() }),
    animate: vi.fn(),
  };
});
```

### Pattern 8: PayPal SDK Mock (NEW - Builder-1 Creates This)

```typescript
// test/mocks/paypal-sdk.tsx
import React from 'react';
import { vi } from 'vitest';

export interface MockPayPalButtonsProps {
  style?: Record<string, unknown>;
  createSubscription?: (
    data: unknown,
    actions: { subscription: { create: (config: unknown) => Promise<string> } }
  ) => Promise<string>;
  onApprove?: (data: { subscriptionID?: string | null }) => Promise<void>;
  onError?: (err: Record<string, unknown>) => void;
  onCancel?: () => void;
}

export const mockPayPalActions = {
  subscription: {
    create: vi.fn().mockResolvedValue('SUB-123456789'),
  },
};

export const MockPayPalScriptProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const MockPayPalButtons = ({
  createSubscription,
  onApprove,
  onError,
  onCancel,
}: MockPayPalButtonsProps) => {
  const handleApprove = async () => {
    try {
      if (createSubscription) {
        await createSubscription({}, mockPayPalActions);
      }
      if (onApprove) {
        await onApprove({ subscriptionID: 'SUB-123456789' });
      }
    } catch {
      if (onError) {
        onError({ message: 'Test error' });
      }
    }
  };

  return (
    <div data-testid="paypal-buttons">
      <button
        onClick={handleApprove}
        data-testid="paypal-subscribe-button"
        type="button"
      >
        PayPal Subscribe
      </button>
      <button
        onClick={() => onError?.({ message: 'PayPal error' })}
        data-testid="paypal-error-trigger"
        type="button"
      >
        Trigger Error
      </button>
      <button
        onClick={onCancel}
        data-testid="paypal-cancel-button"
        type="button"
      >
        Cancel
      </button>
    </div>
  );
};

// Usage in test file:
// vi.mock('@paypal/react-paypal-js', () => ({
//   PayPalScriptProvider: MockPayPalScriptProvider,
//   PayPalButtons: MockPayPalButtons,
// }));
```

### Pattern 9: Glass UI Component Mocks

```typescript
vi.mock('@/components/ui/glass/GlassModal', () => ({
  GlassModal: ({
    isOpen,
    onClose,
    title,
    children,
  }: {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label={title} data-testid="glass-modal">
        <button onClick={onClose} aria-label="Close">
          Close
        </button>
        {title && <h2>{title}</h2>}
        {children}
      </div>
    ) : null,
}));

vi.mock('@/components/ui/glass/GlowButton', () => ({
  GlowButton: ({
    children,
    onClick,
    disabled,
    variant,
    className,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
    className?: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      className={className}
    >
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/glass/GlassCard', () => ({
  GlassCard: ({
    children,
    elevated,
    className,
  }: {
    children: React.ReactNode;
    elevated?: boolean;
    className?: string;
  }) => (
    <div
      data-testid="glass-card"
      data-elevated={elevated}
      className={className}
    >
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/glass/GlowBadge', () => ({
  GlowBadge: ({
    children,
    variant,
  }: {
    children: React.ReactNode;
    variant?: string;
  }) => (
    <span data-testid="glow-badge" data-variant={variant}>
      {children}
    </span>
  ),
}));

vi.mock('@/components/ui/glass/CosmicLoader', () => ({
  CosmicLoader: () => <div data-testid="cosmic-loader">Loading...</div>,
}));

vi.mock('@/components/ui/glass/GlassInput', () => ({
  GlassInput: ({
    value,
    onChange,
    placeholder,
    type,
    disabled,
  }: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
    disabled?: boolean;
  }) => (
    <input
      type={type || 'text'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      data-testid="glass-input"
    />
  ),
}));
```

### Pattern 10: DashboardCard Component Mocks

```typescript
vi.mock('@/components/dashboard/shared/DashboardCard', () => ({
  default: ({
    children,
    className,
    isLoading,
    animated,
  }: {
    children: React.ReactNode;
    className?: string;
    isLoading?: boolean;
    animated?: boolean;
  }) => (
    <div
      data-testid="dashboard-card"
      className={className}
      data-loading={isLoading}
      data-animated={animated}
    >
      {children}
    </div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <h3 data-testid="card-title">{children}</h3>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
  CardActions: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-actions">{children}</div>
  ),
}));

vi.mock('@/components/dashboard/shared/TierBadge', () => ({
  default: ({ tier, size }: { tier: string; size?: string }) => (
    <span data-testid="tier-badge" data-tier={tier} data-size={size}>
      {tier}
    </span>
  ),
}));
```

### Pattern 11: Navigation Context Mock

```typescript
const mockShowBottomNav = vi.fn().mockReturnValue(true);

vi.mock('@/contexts/NavigationContext', () => ({
  useNavigation: () => ({
    showBottomNav: mockShowBottomNav(),
    setShowBottomNav: vi.fn(),
  }),
}));
```

### Pattern 12: useScrollDirection Hook Mock

```typescript
vi.mock('@/hooks', () => ({
  useScrollDirection: () => 'up', // or 'down'
}));
```

### Pattern 13: Haptic Feedback Mock

```typescript
vi.mock('@/lib/utils/haptics', () => ({
  haptic: vi.fn(),
}));

// Verify haptic called
import { haptic } from '@/lib/utils/haptics';
expect(haptic).toHaveBeenCalled();
```

### Pattern 14: matchMedia Mock (for reduced motion)

```typescript
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false, // or true to simulate prefers-reduced-motion
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Test reduced motion preference
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn().mockImplementation(() => ({
    matches: true, // prefers-reduced-motion: reduce
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
});
```

### Pattern 15: Time-Based Testing

```typescript
describe('time-based greeting', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows morning greeting at 9am', () => {
    vi.setSystemTime(new Date('2025-01-10T09:00:00'));
    render(<WelcomeSection />);
    expect(screen.getByText(/good morning/i)).toBeInTheDocument();
  });

  it('shows afternoon greeting at 2pm', () => {
    vi.setSystemTime(new Date('2025-01-10T14:00:00'));
    render(<WelcomeSection />);
    expect(screen.getByText(/good afternoon/i)).toBeInTheDocument();
  });

  it('shows evening greeting at 7pm', () => {
    vi.setSystemTime(new Date('2025-01-10T19:00:00'));
    render(<WelcomeSection />);
    expect(screen.getByText(/good evening/i)).toBeInTheDocument();
  });
});
```

## Testing Patterns

### Testing Modal Visibility

```typescript
describe('visibility', () => {
  it('renders when isOpen is true', () => {
    render(<CancelSubscriptionModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<CancelSubscriptionModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
```

### Testing Conditional Rendering Based on User Tier

```typescript
describe('tier-based rendering', () => {
  it('shows upgrade button for free tier', () => {
    mockUseAuth.mockReturnValue({
      user: freeTierUser,
      isAuthenticated: true,
    });

    render(<SubscriptionCard />);
    expect(screen.getByRole('link', { name: /upgrade/i })).toBeInTheDocument();
  });

  it('shows manage button for pro tier', () => {
    mockUseAuth.mockReturnValue({
      user: proTierUser,
      isAuthenticated: true,
    });

    render(<SubscriptionCard />);
    expect(screen.getByRole('link', { name: /manage/i })).toBeInTheDocument();
  });

  it('shows clarify link for paid users only', () => {
    mockUseAuth.mockReturnValue({
      user: proTierUser,
      isAuthenticated: true,
    });

    render(<AppNavigation currentPage="dashboard" />);
    expect(screen.getByRole('link', { name: /clarify/i })).toBeInTheDocument();
  });

  it('hides clarify link for free users', () => {
    mockUseAuth.mockReturnValue({
      user: freeTierUser,
      isAuthenticated: true,
    });

    render(<AppNavigation currentPage="dashboard" />);
    expect(screen.queryByRole('link', { name: /clarify/i })).not.toBeInTheDocument();
  });
});
```

### Testing Loading States

```typescript
describe('loading states', () => {
  it('shows skeleton when loading', () => {
    vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue(
      createMockLoadingResult()
    );

    render(<SubscriptionStatusCard />);
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('shows content when loaded', () => {
    vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue(
      createMockQueryResult({ tier: 'pro', status: 'active' })
    );

    render(<SubscriptionStatusCard />);
    expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
  });
});
```

### Testing Form Interactions

```typescript
describe('form interactions', () => {
  it('enables save button when input changes', () => {
    render(<AccountInfoSection user={createMockUser()} />);

    const editButton = screen.getByRole('button', { name: /edit name/i });
    fireEvent.click(editButton);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'New Name' } });

    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).not.toBeDisabled();
  });

  it('calls onSave with new value', async () => {
    const mockOnSave = vi.fn();
    render(<AccountInfoSection user={createMockUser()} onSaveName={mockOnSave} />);

    fireEvent.click(screen.getByRole('button', { name: /edit name/i }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'New Name' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(mockOnSave).toHaveBeenCalledWith('New Name');
  });
});
```

### Testing Filter Components

```typescript
describe('ReflectionFilters', () => {
  const defaultProps = {
    searchQuery: '',
    onSearchChange: vi.fn(),
    sortBy: 'newest' as const,
    onSortChange: vi.fn(),
    sortOrder: 'desc' as const,
    onSortOrderChange: vi.fn(),
    dateRange: 'all' as const,
    onDateRangeChange: vi.fn(),
    tone: null,
    onToneChange: vi.fn(),
    premiumOnly: false,
    onPremiumOnlyChange: vi.fn(),
    onClearAll: vi.fn(),
    hasActiveFilters: false,
  };

  it('calls onSearchChange when typing', () => {
    render(<ReflectionFilters {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'dream' } });

    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('dream');
  });

  it('shows clear button when filters active', () => {
    render(<ReflectionFilters {...defaultProps} hasActiveFilters={true} />);
    expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument();
  });
});
```

### Testing Navigation Active State

```typescript
describe('active state', () => {
  it('highlights dashboard link when on dashboard page', () => {
    render(<AppNavigation currentPage="dashboard" />);

    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink).toHaveClass('active');
  });

  it('highlights dreams link when on dreams page', () => {
    render(<AppNavigation currentPage="dreams" />);

    const dreamsLink = screen.getByRole('link', { name: /dreams/i });
    expect(dreamsLink).toHaveClass('active');
  });
});
```

### Testing Mutation Error Handling

```typescript
describe('error handling', () => {
  it('shows error toast when cancel fails', async () => {
    vi.mock('@/lib/trpc', () => ({
      trpc: {
        subscriptions: {
          cancel: {
            useMutation: (options: { onError: (err: Error) => void }) => ({
              mutate: () => {
                options.onError(new Error('Failed to cancel'));
              },
              isPending: false,
            }),
          },
        },
      },
    }));

    render(<CancelSubscriptionModal isOpen={true} onClose={vi.fn()} />);

    // Check confirmation checkbox
    fireEvent.click(screen.getByRole('checkbox'));
    // Click cancel button
    fireEvent.click(screen.getByRole('button', { name: /cancel subscription/i }));

    expect(mockToast.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed')
    );
  });
});
```

## Error Handling Patterns

### Component Error Boundary Testing

```typescript
describe('error states', () => {
  it('displays error message when query fails', () => {
    vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue(
      createMockErrorResult(new Error('Network error'))
    );

    render(<SubscriptionStatusCard />);
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });

  it('shows retry button on error', () => {
    const mockRefetch = vi.fn();
    vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue({
      ...createMockErrorResult(new Error('Failed')),
      refetch: mockRefetch,
    });

    render(<SubscriptionStatusCard />);
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(mockRefetch).toHaveBeenCalled();
  });
});
```

## Accessibility Patterns

### Testing ARIA Attributes

```typescript
describe('accessibility', () => {
  it('has accessible modal role', () => {
    render(<CancelSubscriptionModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('has accessible button labels', () => {
    render(<AppNavigation currentPage="dashboard" />);
    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();
  });

  it('has accessible link names', () => {
    render(<BottomNavigation />);
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /dreams/i })).toBeInTheDocument();
  });
});
```

## Import Order Convention

```typescript
// 1. React Testing Library
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// 2. Vitest
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// 3. React (if needed for mocks)
import React from 'react';

// 4. vi.mock calls (BEFORE component)
vi.mock('next/navigation', () => ({ ... }));
vi.mock('@/hooks/useAuth', () => ({ ... }));
vi.mock('@/lib/trpc', () => ({ ... }));

// 5. Component under test
import { ComponentName } from '../ComponentName';

// 6. Types
import type { User } from '@/types';

// 7. Test utilities/factories
import { createMockUser, proTierUser } from '@/test/factories';
import { createMockQueryResult } from '@/test/helpers';
```

## Security Patterns (Production Mode)

### Input Validation in Tests

```typescript
describe('input validation', () => {
  it('prevents XSS in search input', () => {
    render(<ReflectionFilters {...defaultProps} />);

    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, {
      target: { value: '<script>alert("xss")</script>' },
    });

    // Component should escape or sanitize
    expect(screen.queryByText('alert')).not.toBeInTheDocument();
  });

  it('enforces maximum input length', () => {
    render(<AccountInfoSection user={createMockUser()} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, {
      target: { value: 'a'.repeat(1000) },
    });

    // Should be truncated or rejected
    expect(input).toHaveValue(expect.stringMatching(/^.{0,255}$/));
  });
});
```

## Performance Patterns

### Avoiding Unnecessary Rerenders

```typescript
describe('performance', () => {
  it('does not rerender on unrelated prop changes', () => {
    const renderCount = vi.fn();

    // If component uses React.memo or useMemo
    const { rerender } = render(
      <MemoizedComponent onClick={vi.fn()} onRender={renderCount} />
    );

    rerender(<MemoizedComponent onClick={vi.fn()} onRender={renderCount} />);

    // Should only render once if properly memoized
    expect(renderCount).toHaveBeenCalledTimes(1);
  });
});
```
