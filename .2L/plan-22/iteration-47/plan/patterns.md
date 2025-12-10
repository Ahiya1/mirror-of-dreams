# Code Patterns & Conventions - Dashboard Component Tests

## File Structure

```
components/dashboard/
  cards/
    __tests__/
      DreamsCard.test.tsx        (Builder-1)
      EvolutionCard.test.tsx     (Builder-1)
      ReflectionsCard.test.tsx   (Builder-1)
      VisualizationCard.test.tsx (Builder-1)
  shared/
    __tests__/
      TierBadge.test.tsx         (EXISTS)
      DashboardCard.test.tsx     (Builder-2)
      ReflectionItem.test.tsx    (Builder-2)
  __tests__/
    DashboardHero.test.tsx       (Builder-2)
```

## Naming Conventions

- Test files: `{ComponentName}.test.tsx`
- Test suites: `describe('ComponentName', ...)`
- Test cases: `it('should {expected behavior}', ...)`
- Mock factories: `createMock{DataType}`

## Import Order Convention

```typescript
// 1. Testing utilities
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// 2. Test helpers
import { createMockQueryResult, createMockLoadingResult, createMockErrorResult } from '@/test/helpers';

// 3. Component under test
import ComponentName from '../ComponentName';

// 4. Mocked modules (declare mocks after imports)
vi.mock('@/lib/trpc', () => ({ ... }));
```

---

## Test Setup Pattern

### Standard Test File Structure

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  createMockQueryResult,
  createMockLoadingResult,
  createMockErrorResult,
} from '@/test/helpers';

// Component under test
import ComponentName from '../ComponentName';

// Mock tRPC
vi.mock('@/lib/trpc', () => ({
  trpc: {
    // Add needed queries here
  },
}));

// Mock Next.js router (if component uses navigation)
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock UI components to simplify testing
vi.mock('@/components/ui/glass', () => ({
  GlowButton: ({ children, onClick, disabled, className }: any) => (
    <button onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  ),
  CosmicLoader: ({ label }: any) => <div data-testid="loader">{label}</div>,
}));

describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test cases here
});
```

---

## tRPC Mock Patterns

### Mock tRPC Module for Card Components

```typescript
import { vi } from 'vitest';
import { trpc } from '@/lib/trpc';

vi.mock('@/lib/trpc', () => ({
  trpc: {
    dreams: {
      list: { useQuery: vi.fn() },
      getLimits: { useQuery: vi.fn() },
    },
    reflections: {
      list: { useQuery: vi.fn() },
    },
    evolution: {
      list: { useQuery: vi.fn() },
      checkEligibility: { useQuery: vi.fn() },
    },
    visualizations: {
      list: { useQuery: vi.fn() },
    },
  },
}));
```

### Success State Mock

```typescript
import { createMockQueryResult } from '@/test/helpers';
import { trpc } from '@/lib/trpc';

// Mock dreams.list with data
vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
  createMockQueryResult([
    {
      id: 'dream-1',
      title: 'Test Dream',
      category: 'creative',
      daysLeft: 30,
      reflectionCount: 5,
    },
    {
      id: 'dream-2',
      title: 'Another Dream',
      category: 'health',
      daysLeft: 0,
      reflectionCount: 2,
    },
  ])
);
```

### Loading State Mock

```typescript
import { createMockLoadingResult } from '@/test/helpers';
import { trpc } from '@/lib/trpc';

vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
  createMockLoadingResult()
);
```

### Error State Mock

```typescript
import { createMockErrorResult } from '@/test/helpers';
import { trpc } from '@/lib/trpc';

vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
  createMockErrorResult(new Error('Failed to fetch dreams'))
);
```

---

## Next.js Router Mock Pattern

```typescript
const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// In tests, verify navigation:
it('should navigate to dream details on click', () => {
  render(<DreamsCard />);

  const dreamLink = screen.getByRole('link', { name: /test dream/i });
  fireEvent.click(dreamLink);

  expect(mockPush).toHaveBeenCalledWith('/dreams/dream-1');
});
```

---

## useAuth Hook Mock Pattern

```typescript
import { vi } from 'vitest';
import { useAuth } from '@/hooks/useAuth';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Default mock (authenticated user)
beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({
    user: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      tier: 'free',
      subscriptionStatus: 'active',
    },
    isLoading: false,
    isAuthenticated: true,
    signOut: vi.fn(),
  });
});

// Mock pro tier user
vi.mocked(useAuth).mockReturnValue({
  user: {
    id: 'user-1',
    name: 'Pro User',
    tier: 'pro',
    subscriptionStatus: 'active',
  },
  isLoading: false,
  isAuthenticated: true,
  signOut: vi.fn(),
});

// Mock loading state
vi.mocked(useAuth).mockReturnValue({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  signOut: vi.fn(),
});
```

---

## Framer Motion Mock Pattern

```typescript
import React from 'react';

vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, className, onClick, onMouseEnter, onMouseLeave, ...props }: any, ref: any) => (
      <div
        ref={ref}
        className={className}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        {...props}
      >
        {children}
      </div>
    )),
  },
  useReducedMotion: vi.fn(() => false),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
```

---

## Glass UI Components Mock Pattern

```typescript
vi.mock('@/components/ui/glass', () => ({
  GlowButton: ({
    children,
    onClick,
    disabled,
    className,
    variant,
    size,
  }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-variant={variant}
      data-size={size}
    >
      {children}
    </button>
  ),
  CosmicLoader: ({ label, size }: any) => (
    <div data-testid="cosmic-loader" data-size={size}>
      {label}
    </div>
  ),
  GlassCard: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
}));
```

---

## MarkdownPreview Mock Pattern

```typescript
vi.mock('@/components/shared/MarkdownPreview', () => ({
  MarkdownPreview: ({ content, maxLength }: any) => (
    <span data-testid="markdown-preview">
      {maxLength ? content.slice(0, maxLength) : content}
    </span>
  ),
}));
```

---

## Test Data Factories

### Dream Factory

```typescript
interface MockDream {
  id: string;
  title: string;
  description?: string;
  category: string;
  daysLeft: number | null;
  targetDate?: string;
  reflectionCount: number;
}

const createMockDream = (overrides: Partial<MockDream> = {}): MockDream => ({
  id: 'dream-1',
  title: 'Test Dream',
  description: 'A test dream description',
  category: 'creative',
  daysLeft: 30,
  targetDate: '2025-02-01',
  reflectionCount: 5,
  ...overrides,
});

// Usage:
const dreams = [
  createMockDream(),
  createMockDream({ id: 'dream-2', title: 'Second Dream', daysLeft: 0 }),
  createMockDream({ id: 'dream-3', title: 'Overdue Dream', daysLeft: -5 }),
];
```

### Reflection Factory

```typescript
interface MockReflection {
  id: string;
  title?: string;
  content?: string;
  created_at: string;
  tone: string;
  is_premium: boolean;
  dreams?: { title: string };
}

const createMockReflection = (overrides: Partial<MockReflection> = {}): MockReflection => ({
  id: 'reflection-1',
  title: 'Test Reflection',
  content: 'Reflection content preview text that shows what the user reflected on...',
  created_at: new Date().toISOString(),
  tone: 'fusion',
  is_premium: false,
  dreams: { title: 'Test Dream' },
  ...overrides,
});
```

### Evolution Report Factory

```typescript
interface MockEvolutionReport {
  id: string;
  evolution: string;
  reflection_count: number;
  created_at: string;
  dreams?: { title: string };
}

const createMockEvolutionReport = (overrides: Partial<MockEvolutionReport> = {}): MockEvolutionReport => ({
  id: 'report-1',
  evolution: 'Your growth insights and evolution analysis...',
  reflection_count: 4,
  created_at: new Date().toISOString(),
  dreams: { title: 'Test Dream' },
  ...overrides,
});
```

### Visualization Factory

```typescript
interface MockVisualization {
  id: string;
  narrative: string;
  style: 'achievement' | 'spiral' | 'synthesis';
  reflection_count: number;
  created_at: string;
  dreams?: { title: string };
}

const createMockVisualization = (overrides: Partial<MockVisualization> = {}): MockVisualization => ({
  id: 'viz-1',
  narrative: 'Your visualization narrative describing your dream as achieved...',
  style: 'synthesis',
  reflection_count: 3,
  created_at: new Date().toISOString(),
  dreams: { title: 'Test Dream' },
  ...overrides,
});
```

---

## Testing Loading States

```typescript
describe('loading state', () => {
  it('should show loading indicator when data is loading', () => {
    vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
      createMockLoadingResult()
    );

    render(<DreamsCard />);

    expect(screen.getByTestId('cosmic-loader')).toBeInTheDocument();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should apply loading class to card', () => {
    vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
      createMockLoadingResult()
    );

    render(<DreamsCard />);

    const card = document.querySelector('.dashboard-card');
    expect(card).toHaveClass('dashboard-card--loading');
  });
});
```

---

## Testing Error States

```typescript
describe('error state', () => {
  it('should show error overlay when query fails', () => {
    vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
      createMockErrorResult(new Error('Network error'))
    );

    render(<DreamsCard />);

    expect(screen.getByText('Unable to load data')).toBeInTheDocument();
  });

  it('should apply error class to card', () => {
    vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
      createMockErrorResult()
    );

    render(<DreamsCard />);

    const card = document.querySelector('.dashboard-card');
    expect(card).toHaveClass('dashboard-card--error');
  });
});
```

---

## Testing Empty States

```typescript
describe('empty state', () => {
  it('should show empty state when no data', () => {
    vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
      createMockQueryResult([])
    );

    render(<DreamsCard />);

    expect(screen.getByText(/no.*yet|create.*first/i)).toBeInTheDocument();
  });

  it('should show CTA button in empty state', () => {
    vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
      createMockQueryResult([])
    );

    render(<DreamsCard />);

    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
  });
});
```

---

## Testing Data Rendering

```typescript
describe('with data', () => {
  beforeEach(() => {
    vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
      createMockQueryResult([
        createMockDream({ id: 'dream-1', title: 'Dream One' }),
        createMockDream({ id: 'dream-2', title: 'Dream Two' }),
      ])
    );
  });

  it('should render all dreams', () => {
    render(<DreamsCard />);

    expect(screen.getByText('Dream One')).toBeInTheDocument();
    expect(screen.getByText('Dream Two')).toBeInTheDocument();
  });

  it('should display correct category emoji', () => {
    vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
      createMockQueryResult([
        createMockDream({ category: 'creative' }),
      ])
    );

    render(<DreamsCard />);

    // Category 'creative' maps to emoji in component
    expect(document.querySelector('.dream-item__icon')).toBeInTheDocument();
  });
});
```

---

## Testing Interactions

```typescript
describe('interactions', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
      createMockQueryResult([
        createMockDream({ id: 'dream-1', title: 'Test Dream' }),
      ])
    );
  });

  it('should navigate to dream details on link click', () => {
    render(<DreamsCard />);

    const dreamLink = screen.getByRole('link', { name: /test dream/i });
    expect(dreamLink).toHaveAttribute('href', '/dreams/dream-1');
  });

  it('should call onClick handler on button click', () => {
    render(<DreamsCard />);

    const reflectButton = screen.getByRole('button', { name: /reflect/i });
    fireEvent.click(reflectButton);

    expect(mockPush).toHaveBeenCalledWith('/reflection?dreamId=dream-1');
  });
});
```

---

## Testing DashboardCard Sub-components

```typescript
import DashboardCard, {
  CardHeader,
  CardTitle,
  CardContent,
  CardActions,
  HeaderAction,
} from '../DashboardCard';

describe('CardHeader', () => {
  it('should render children', () => {
    render(<CardHeader>Header Content</CardHeader>);
    expect(screen.getByText('Header Content')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<CardHeader className="custom-class">Content</CardHeader>);
    const header = screen.getByText('Content').closest('.dashboard-card__header');
    expect(header).toHaveClass('custom-class');
  });
});

describe('CardTitle', () => {
  it('should render title text', () => {
    render(<CardTitle>My Title</CardTitle>);
    expect(screen.getByText('My Title')).toBeInTheDocument();
  });

  it('should render with icon', () => {
    render(<CardTitle icon={<span data-testid="icon">*</span>}>Title</CardTitle>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });
});

describe('HeaderAction', () => {
  it('should render as button when onClick provided', () => {
    const onClick = vi.fn();
    render(<HeaderAction onClick={onClick}>Click Me</HeaderAction>);

    const button = screen.getByRole('button', { name: 'Click Me' });
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalled();
  });

  it('should render as link when href provided', () => {
    render(<HeaderAction href="/path">Go There</HeaderAction>);

    const link = screen.getByRole('link', { name: 'Go There' });
    expect(link).toHaveAttribute('href', '/path');
  });
});
```

---

## Testing Time-Based Logic (DashboardHero)

```typescript
describe('DashboardHero', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should show "Good morning" greeting in morning hours', () => {
    vi.setSystemTime(new Date('2025-01-10T09:00:00'));

    render(<DashboardHero />);

    expect(screen.getByText(/good morning/i)).toBeInTheDocument();
  });

  it('should show "Good afternoon" greeting in afternoon hours', () => {
    vi.setSystemTime(new Date('2025-01-10T14:00:00'));

    render(<DashboardHero />);

    expect(screen.getByText(/good afternoon/i)).toBeInTheDocument();
  });

  it('should show "Good evening" greeting in evening hours', () => {
    vi.setSystemTime(new Date('2025-01-10T20:00:00'));

    render(<DashboardHero />);

    expect(screen.getByText(/good evening/i)).toBeInTheDocument();
  });
});
```

---

## Testing ReflectionItem Time Formatting

```typescript
describe('ReflectionItem time formatting', () => {
  it('should show "just now" for very recent reflections', () => {
    const reflection = createMockReflection({
      created_at: new Date().toISOString(),
    });

    render(<ReflectionItem reflection={reflection} />);

    expect(screen.getByText('just now')).toBeInTheDocument();
  });

  it('should show minutes ago for recent reflections', () => {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const reflection = createMockReflection({
      created_at: thirtyMinsAgo,
    });

    render(<ReflectionItem reflection={reflection} />);

    expect(screen.getByText('30m ago')).toBeInTheDocument();
  });

  it('should show hours ago for same-day reflections', () => {
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
    const reflection = createMockReflection({
      created_at: fiveHoursAgo,
    });

    render(<ReflectionItem reflection={reflection} />);

    expect(screen.getByText('5h ago')).toBeInTheDocument();
  });

  it('should show days ago for recent past reflections', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const reflection = createMockReflection({
      created_at: threeDaysAgo,
    });

    render(<ReflectionItem reflection={reflection} />);

    expect(screen.getByText('3d ago')).toBeInTheDocument();
  });
});
```

---

## Testing DaysLeft Display (DreamsCard)

```typescript
describe('days left display', () => {
  it('should show "Xd left" for positive days', () => {
    vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
      createMockQueryResult([createMockDream({ daysLeft: 30 })])
    );

    render(<DreamsCard />);

    expect(screen.getByText('30d left')).toBeInTheDocument();
  });

  it('should show "Today!" for daysLeft === 0', () => {
    vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
      createMockQueryResult([createMockDream({ daysLeft: 0 })])
    );

    render(<DreamsCard />);

    expect(screen.getByText('Today!')).toBeInTheDocument();
  });

  it('should show "Xd overdue" for negative days', () => {
    vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
      createMockQueryResult([createMockDream({ daysLeft: -5 })])
    );

    render(<DreamsCard />);

    expect(screen.getByText('5d overdue')).toBeInTheDocument();
  });

  it('should apply urgency classes correctly', () => {
    vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
      createMockQueryResult([
        createMockDream({ id: '1', daysLeft: -1 }),  // overdue
        createMockDream({ id: '2', daysLeft: 3 }),   // soon
        createMockDream({ id: '3', daysLeft: 30 }), // normal
      ])
    );

    render(<DreamsCard />);

    expect(document.querySelector('.dream-item__days--overdue')).toBeInTheDocument();
    expect(document.querySelector('.dream-item__days--soon')).toBeInTheDocument();
    expect(document.querySelector('.dream-item__days--normal')).toBeInTheDocument();
  });
});
```

---

## Testing Tone Badge (ReflectionItem)

```typescript
describe('tone badge', () => {
  it('should display Gentle tone', () => {
    const reflection = createMockReflection({ tone: 'gentle' });
    render(<ReflectionItem reflection={reflection} />);
    expect(screen.getByText('Gentle')).toBeInTheDocument();
  });

  it('should display Intense tone', () => {
    const reflection = createMockReflection({ tone: 'intense' });
    render(<ReflectionItem reflection={reflection} />);
    expect(screen.getByText('Intense')).toBeInTheDocument();
  });

  it('should display Fusion tone', () => {
    const reflection = createMockReflection({ tone: 'fusion' });
    render(<ReflectionItem reflection={reflection} />);
    expect(screen.getByText('Fusion')).toBeInTheDocument();
  });

  it('should fallback to Fusion for unknown tones', () => {
    const reflection = createMockReflection({ tone: 'unknown' });
    render(<ReflectionItem reflection={reflection} />);
    expect(screen.getByText('Fusion')).toBeInTheDocument();
  });
});
```

---

## Testing Premium Badge (ReflectionItem)

```typescript
describe('premium badge', () => {
  it('should show Premium badge when is_premium is true', () => {
    const reflection = createMockReflection({ is_premium: true });
    render(<ReflectionItem reflection={reflection} />);
    expect(screen.getByText('Premium')).toBeInTheDocument();
  });

  it('should not show Premium badge when is_premium is false', () => {
    const reflection = createMockReflection({ is_premium: false });
    render(<ReflectionItem reflection={reflection} />);
    expect(screen.queryByText('Premium')).not.toBeInTheDocument();
  });
});
```

---

## Testing Eligibility States (EvolutionCard)

```typescript
describe('eligibility states', () => {
  it('should show "Ready to Generate" when eligible and no reports', () => {
    vi.mocked(trpc.evolution.list.useQuery).mockReturnValue(
      createMockQueryResult({ reports: [], total: 0 })
    );
    vi.mocked(trpc.evolution.checkEligibility.useQuery).mockReturnValue(
      createMockQueryResult({ eligible: true })
    );

    render(<EvolutionCard />);

    expect(screen.getByText('Ready to Generate')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate report/i })).toBeInTheDocument();
  });

  it('should show "Keep Reflecting" when not eligible', () => {
    vi.mocked(trpc.evolution.list.useQuery).mockReturnValue(
      createMockQueryResult({ reports: [], total: 0 })
    );
    vi.mocked(trpc.evolution.checkEligibility.useQuery).mockReturnValue(
      createMockQueryResult({
        eligible: false,
        reason: 'Need 4 reflections on a dream'
      })
    );

    render(<EvolutionCard />);

    expect(screen.getByText('Keep Reflecting')).toBeInTheDocument();
    expect(screen.getByText('Need 4 reflections on a dream')).toBeInTheDocument();
  });
});
```

---

## Security Patterns

### Input Validation in Tests

```typescript
// Test that component handles malicious input safely
it('should sanitize HTML in preview text', () => {
  const reflection = createMockReflection({
    content: '<script>alert("xss")</script>Safe text',
  });

  render(<ReflectionItem reflection={reflection} />);

  // Script tags should be stripped
  expect(screen.queryByText('alert')).not.toBeInTheDocument();
  expect(screen.getByText(/safe text/i)).toBeInTheDocument();
});
```

### Test Authentication States

```typescript
describe('authentication handling', () => {
  it('should handle unauthenticated state gracefully', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      signOut: vi.fn(),
    });

    render(<DashboardHero />);

    // Should show fallback name
    expect(screen.getByText(/dreamer/i)).toBeInTheDocument();
  });
});
```

---

## Error Handling Patterns

### Test Network Errors

```typescript
it('should display error state on network failure', () => {
  vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
    createMockErrorResult(new Error('Network error'))
  );

  render(<DreamsCard />);

  expect(screen.getByText('Unable to load data')).toBeInTheDocument();
});
```

### Test Undefined Data Handling

```typescript
it('should handle undefined response data', () => {
  vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
    createMockQueryResult(undefined as any)
  );

  render(<DreamsCard />);

  // Should render empty state or not crash
  expect(document.querySelector('.dreams-card')).toBeInTheDocument();
});
```

---

## Code Quality Standards

1. **Each test should have a single assertion focus** - Test one behavior per test case
2. **Use descriptive test names** - Names should describe the expected behavior
3. **Avoid testing implementation details** - Test what users see, not internal state
4. **Reset mocks between tests** - Use `beforeEach(() => vi.clearAllMocks())`
5. **Keep test data minimal** - Only include data needed for the specific test

---

## Performance Patterns

### Avoid Unnecessary Renders in Tests

```typescript
// BAD: Re-renders component for each assertion
it('should render correctly', () => {
  const { rerender } = render(<Component />);
  expect(screen.getByText('A')).toBeInTheDocument();
  rerender(<Component />);
  expect(screen.getByText('B')).toBeInTheDocument();
});

// GOOD: Single render, multiple assertions
it('should render correctly', () => {
  render(<Component />);
  expect(screen.getByText('A')).toBeInTheDocument();
  expect(screen.getByText('B')).toBeInTheDocument();
});
```

### Use Query Selectors Efficiently

```typescript
// Prefer specific queries
screen.getByRole('button', { name: /submit/i });  // Good
screen.getByTestId('submit-button');               // Acceptable
document.querySelector('.submit-btn');              // Last resort
```
