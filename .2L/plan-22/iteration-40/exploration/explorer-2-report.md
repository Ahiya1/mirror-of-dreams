# Explorer 2 Report: Testing Patterns & Component Test Strategy

## Executive Summary

The Mirror of Dreams codebase has a solid testing foundation with established patterns for component testing (React Testing Library), server-side unit testing (Vitest), and comprehensive mock factories for Supabase, Anthropic, and cookies. However, **hook testing is currently absent** - no existing hook tests were found despite 13 custom hooks in the codebase. The MobileReflectionFlow.tsx component at 812 lines is a prime candidate for refactoring, with clear patterns from existing view components (DreamSelectionView, ReflectionFormView) that can guide the extraction process.

## Existing Test Patterns

### 1. Component Testing Patterns (Established)

**Location:** `components/**/__tests__/*.test.tsx`

**Pattern discovered in GlowButton.test.tsx:**
```typescript
// Imports
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

// Component import
import { GlowButton } from '../GlowButton';

// Test structure: describe blocks organized by feature
describe('GlowButton', () => {
  describe('rendering', () => { /* ... */ });
  describe('variants', () => { /* ... */ });
  describe('sizes', () => { /* ... */ });
  describe('interactions', () => { /* ... */ });
  describe('disabled state', () => { /* ... */ });
  describe('accessibility', () => { /* ... */ });
  describe('custom className', () => { /* ... */ });
  describe('styling', () => { /* ... */ });
});
```

**Key patterns observed:**
- Direct RTL imports (no custom render wrapper)
- Test data-testid for complex children lookup
- Class assertion using `toHaveClass()`
- User interaction testing with `fireEvent`
- Mock verification with `vi.fn()` and `toHaveBeenCalled()`
- Accessibility tests (focus states, ARIA)

### 2. Server-Side Unit Testing Patterns

**Location:** `server/lib/__tests__/*.test.ts`

**Pattern discovered in rate-limiter.test.ts:**
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies BEFORE imports
vi.mock('@upstash/redis', () => ({ /* ... */ }));
vi.mock('../logger', () => ({ /* ... */ }));

// Import after mocks
import { checkRateLimit, getCircuitBreakerStatus } from '../rate-limiter';

describe('Rate Limiter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetCircuitBreaker();
  });

  afterEach(() => {
    vi.resetModules();
    vi.useRealTimers();
  });
  
  // Tests...
});
```

### 3. Library Testing Patterns

**Location:** `lib/**/__tests__/*.test.ts`

**Pattern discovered in context-builder.test.ts:**
```typescript
// TEST DATA FACTORIES - inline
function createMockUser(overrides: Partial<any> = {}) {
  return {
    name: 'Test User',
    tier: 'pro',
    ...overrides,
  };
}

// Comprehensive test sections
describe('Context Builder', () => {
  describe('estimateTokens', () => { /* pure function tests */ });
  describe('Query Parallelization', () => { /* async behavior */ });
  describe('Caching Integration', () => { /* mock verification */ });
  describe('Performance Logging', () => { /* side effect testing */ });
  describe('Context Building', () => { /* integration */ });
  describe('Edge Cases', () => { /* boundary conditions */ });
});
```

## Testing Infrastructure Assessment

### Current Infrastructure

| Component | Status | Location |
|-----------|--------|----------|
| Test Runner | Vitest | `vitest.config.ts` |
| Environment | happy-dom | `vitest.config.ts` |
| Setup File | `vitest.setup.ts` | Project root |
| React Testing | @testing-library/react | `package.json` |
| User Events | @testing-library/user-event | `package.json` |
| Coverage | v8 provider | `vitest.config.ts` |

### Existing Mocks

**1. Anthropic Mock (`/test/mocks/anthropic.ts`):**
- `createMockMessageResponse()` - Standard message response
- `createMockThinkingResponse()` - Extended thinking response
- `createMessagesCreateMock()` - messages.create mock
- `createMessagesStreamMock()` - Streaming response mock
- `createAnthropicMock()` - Full client mock
- `anthropicErrors` - Pre-built error scenarios
- `mockResponses` - Common response scenarios (reflection, clarify, evolution)

**2. Supabase Mock (`/test/mocks/supabase.ts`):**
- `createSupabaseQueryMock<T>()` - Chainable query builder mock
- `createSupabaseAuthMock()` - Auth operations mock
- `createSupabaseStorageMock()` - Storage operations mock
- `createSupabaseMock()` - Full client mock
- `supabaseErrors` - Common error scenarios

**3. Cookies Mock (`/test/mocks/cookies.ts`):**
- `createCookieMock()` - Auth cookie operations mock

### Test Fixtures

**Location:** `/test/fixtures/`

| File | Purpose |
|------|---------|
| `dreams.ts` | Dream factory with multiple scenarios (active, achieved, archived, released) |
| `users.ts` | User factory (not read, but exists) |
| `reflections.ts` | Reflection factory (not read, but exists) |

**Dream Factory Pattern:**
```typescript
export const createMockDream = (overrides: Partial<DreamRow> = {}): DreamRow => ({
  id: '11111111-1111-4111-a111-111111111111',
  user_id: '22222222-2222-4222-a222-222222222222',
  title: 'Learn to play guitar',
  // ... defaults
  ...overrides,
});

// Pre-configured scenarios
export const activeDream = createMockDream({ status: 'active' });
export const achievedDream = createMockDream({ status: 'achieved', achieved_at: ... });
```

### Integration Test Setup

**Location:** `/test/integration/setup.ts`

Provides `createTestCaller()` function that:
- Creates mocked tRPC caller
- Injects user context (or null for unauthenticated)
- Provides `mockQuery()` and `mockQueries()` helpers
- Handles Supabase, cookies, rate limiter, logger mocks

## Hook Testing Strategy

### Current State

**No existing hook tests found.** The hooks directory contains 13 custom hooks with 0% coverage:

| Hook | Purpose | Complexity | Test Priority |
|------|---------|------------|---------------|
| `useReflectionForm.ts` | Form state, localStorage persistence | HIGH | P1 |
| `useReflectionViewMode.ts` | URL sync, view state | MEDIUM | P1 |
| `useIsMobile.ts` | Viewport detection | LOW | P2 |
| `useKeyboardHeight.ts` | Mobile keyboard handling | MEDIUM | P2 |
| `useAuth.ts` | Auth state management | HIGH | P2 |
| `useDashboard.ts` | Dashboard data aggregation | MEDIUM | P2 |
| `useAnimatedCounter.ts` | Animation utility | LOW | P3 |
| `useReducedMotion.ts` | Accessibility preference | LOW | P3 |
| `useBreathingEffect.ts` | Animation effect | LOW | P3 |
| `usePortalState.ts` | Portal management | LOW | P3 |
| `useScrollDirection.ts` | Scroll detection | LOW | P3 |
| `useStaggerAnimation.ts` | Animation utility | LOW | P3 |

### Required Testing Utilities for Hooks

**1. renderHook from @testing-library/react:**
```typescript
import { renderHook, act, waitFor } from '@testing-library/react';

// Basic hook test pattern
const { result } = renderHook(() => useReflectionForm({ dreams: mockDreams }));

// Update hook state
act(() => {
  result.current.handleFieldChange('dream', 'test value');
});

// Assert new state
expect(result.current.formData.dream).toBe('test value');
```

**2. Custom Test Wrapper for Context-Dependent Hooks:**
```typescript
// test/helpers/hook-wrapper.tsx
import { ToastProvider } from '@/contexts/ToastContext';
import { NavigationProvider } from '@/contexts/NavigationContext';

export function createHookWrapper() {
  return function HookWrapper({ children }: { children: React.ReactNode }) {
    return (
      <ToastProvider>
        <NavigationProvider>
          {children}
        </NavigationProvider>
      </ToastProvider>
    );
  };
}

// Usage
const { result } = renderHook(
  () => useReflectionForm({ dreams: mockDreams }),
  { wrapper: createHookWrapper() }
);
```

**3. LocalStorage Mock:**
```typescript
// In vitest.setup.ts or test file
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => localStorageMock.store[key] || null),
  setItem: vi.fn((key: string, value: string) => { localStorageMock.store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete localStorageMock.store[key]; }),
  clear: vi.fn(() => { localStorageMock.store = {}; }),
};

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
```

**4. URL/Router Mock for useReflectionViewMode:**
```typescript
// Mock next/navigation
vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(() => ({
    get: vi.fn((key: string) => mockParams[key]),
  })),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
  })),
}));
```

### Hook Test Template

**For `useReflectionForm`:**
```typescript
// hooks/__tests__/useReflectionForm.test.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useReflectionForm } from '../useReflectionForm';
import { createMockDream } from '@/test/fixtures/dreams';

// Mock contexts
vi.mock('@/contexts/ToastContext', () => ({
  useToast: () => ({
    warning: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('useReflectionForm', () => {
  const mockDreams = [createMockDream({ id: 'dream-1', title: 'Test Dream' })];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('initialization', () => {
    it('initializes with empty form data', () => {
      const { result } = renderHook(() => useReflectionForm({ dreams: mockDreams }));
      
      expect(result.current.formData).toEqual({
        dream: '',
        plan: '',
        relationship: '',
        offering: '',
      });
    });

    it('loads saved state from localStorage', () => {
      const savedState = {
        data: { dream: 'saved', plan: '', relationship: '', offering: '' },
        dreamId: 'dream-1',
        tone: 'gentle',
        timestamp: Date.now(),
      };
      localStorage.setItem('MIRROR_REFLECTION_DRAFT', JSON.stringify(savedState));

      const { result } = renderHook(() => useReflectionForm({ dreams: mockDreams }));

      expect(result.current.formData.dream).toBe('saved');
      expect(result.current.selectedDreamId).toBe('dream-1');
    });
  });

  describe('form operations', () => {
    it('updates field values', () => {
      const { result } = renderHook(() => useReflectionForm({ dreams: mockDreams }));

      act(() => {
        result.current.handleFieldChange('dream', 'My dream content');
      });

      expect(result.current.formData.dream).toBe('My dream content');
    });

    it('persists changes to localStorage', async () => {
      const { result } = renderHook(() => useReflectionForm({ dreams: mockDreams }));

      act(() => {
        result.current.handleFieldChange('dream', 'Persisted content');
      });

      await waitFor(() => {
        const saved = localStorage.getItem('MIRROR_REFLECTION_DRAFT');
        expect(saved).not.toBeNull();
        expect(JSON.parse(saved!).data.dream).toBe('Persisted content');
      });
    });
  });

  describe('validation', () => {
    it('returns false when no dream selected', () => {
      const { result } = renderHook(() => useReflectionForm({ dreams: mockDreams }));
      
      expect(result.current.validateForm()).toBe(false);
    });

    it('returns true when all fields filled', () => {
      const { result } = renderHook(() => useReflectionForm({ dreams: mockDreams }));

      act(() => {
        result.current.handleDreamSelect('dream-1');
        result.current.handleFieldChange('dream', 'content');
        result.current.handleFieldChange('plan', 'content');
        result.current.handleFieldChange('relationship', 'content');
        result.current.handleFieldChange('offering', 'content');
      });

      expect(result.current.validateForm()).toBe(true);
    });
  });

  describe('clearForm', () => {
    it('resets all form state', () => {
      const { result } = renderHook(() => useReflectionForm({ dreams: mockDreams }));

      act(() => {
        result.current.handleFieldChange('dream', 'content');
        result.current.handleDreamSelect('dream-1');
      });

      act(() => {
        result.current.clearForm();
      });

      expect(result.current.formData.dream).toBe('');
      expect(result.current.selectedDreamId).toBe('');
    });
  });
});
```

## View Component Testing Strategy

### Existing View Component Pattern

View components in this codebase follow a clear pattern:
- Props-driven (receive all data and callbacks as props)
- Pure rendering (no internal data fetching)
- Clear interface contracts

**Example: `DreamSelectionView.tsx`:**
```typescript
interface DreamSelectionViewProps {
  dreams: Dream[];
  selectedDreamId: string;
  onDreamSelect: (dreamId: string) => void;
}
```

### View Component Test Template

```typescript
// components/reflection/views/__tests__/DreamSelectionView.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DreamSelectionView } from '../DreamSelectionView';
import { createMockDream } from '@/test/fixtures/dreams';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('DreamSelectionView', () => {
  const mockDreams = [
    createMockDream({ id: 'dream-1', title: 'Dream One', category: 'career' }),
    createMockDream({ id: 'dream-2', title: 'Dream Two', category: 'health' }),
  ];
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the question heading', () => {
      render(
        <DreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnSelect}
        />
      );

      expect(screen.getByText('Which dream are you reflecting on?')).toBeInTheDocument();
    });

    it('renders all dreams', () => {
      render(
        <DreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnSelect}
        />
      );

      expect(screen.getByText('Dream One')).toBeInTheDocument();
      expect(screen.getByText('Dream Two')).toBeInTheDocument();
    });

    it('renders category emoji', () => {
      render(
        <DreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnSelect}
        />
      );

      // Verify emojis are present (career = briefcase)
      const cards = screen.getAllByRole('button');
      expect(cards).toHaveLength(2);
    });
  });

  describe('empty state', () => {
    it('renders empty state when no dreams', () => {
      render(
        <DreamSelectionView
          dreams={[]}
          selectedDreamId=""
          onDreamSelect={mockOnSelect}
        />
      );

      expect(screen.getByText('No active dreams yet.')).toBeInTheDocument();
      expect(screen.getByText('Create Your First Dream')).toBeInTheDocument();
    });
  });

  describe('selection', () => {
    it('calls onDreamSelect when dream clicked', () => {
      render(
        <DreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnSelect}
        />
      );

      fireEvent.click(screen.getByText('Dream One'));
      expect(mockOnSelect).toHaveBeenCalledWith('dream-1');
    });

    it('shows checkmark for selected dream', () => {
      render(
        <DreamSelectionView
          dreams={mockDreams}
          selectedDreamId="dream-1"
          onDreamSelect={mockOnSelect}
        />
      );

      // Check icon should be visible for selected dream
      // Use test-id or check for the SVG element
    });

    it('handles keyboard selection (Enter)', () => {
      render(
        <DreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnSelect}
        />
      );

      const firstDream = screen.getByText('Dream One').closest('[role="button"]');
      fireEvent.keyDown(firstDream!, { key: 'Enter' });
      expect(mockOnSelect).toHaveBeenCalledWith('dream-1');
    });

    it('handles keyboard selection (Space)', () => {
      render(
        <DreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnSelect}
        />
      );

      const firstDream = screen.getByText('Dream One').closest('[role="button"]');
      fireEvent.keyDown(firstDream!, { key: ' ' });
      expect(mockOnSelect).toHaveBeenCalledWith('dream-1');
    });
  });

  describe('days left indicator', () => {
    it('shows "Today!" when daysLeft is 0', () => {
      const todayDream = createMockDream({ 
        id: 'today', 
        title: 'Today Dream',
        daysLeft: 0 
      });

      render(
        <DreamSelectionView
          dreams={[todayDream]}
          selectedDreamId=""
          onDreamSelect={mockOnSelect}
        />
      );

      expect(screen.getByText('Today!')).toBeInTheDocument();
    });

    it('shows days remaining for future dates', () => {
      const futureDream = createMockDream({ 
        id: 'future', 
        title: 'Future Dream',
        daysLeft: 30 
      });

      render(
        <DreamSelectionView
          dreams={[futureDream]}
          selectedDreamId=""
          onDreamSelect={mockOnSelect}
        />
      );

      expect(screen.getByText('30d left')).toBeInTheDocument();
    });

    it('shows overdue indicator for past dates', () => {
      const overdueDream = createMockDream({ 
        id: 'overdue', 
        title: 'Overdue Dream',
        daysLeft: -5 
      });

      render(
        <DreamSelectionView
          dreams={[overdueDream]}
          selectedDreamId=""
          onDreamSelect={mockOnSelect}
        />
      );

      expect(screen.getByText('5d overdue')).toBeInTheDocument();
    });
  });
});
```

## Required Test Utilities

### New Utilities to Create

**1. Hook Test Wrapper (`test/helpers/hook-wrapper.tsx`):**
```typescript
import React from 'react';
import { ToastProvider } from '@/contexts/ToastContext';
import { NavigationProvider } from '@/contexts/NavigationContext';

interface WrapperProps {
  children: React.ReactNode;
}

export function createHookWrapper() {
  return function HookWrapper({ children }: WrapperProps) {
    return (
      <ToastProvider>
        <NavigationProvider>
          {children}
        </NavigationProvider>
      </ToastProvider>
    );
  };
}

export function HookTestWrapper({ children }: WrapperProps) {
  return (
    <ToastProvider>
      <NavigationProvider>
        {children}
      </NavigationProvider>
    </ToastProvider>
  );
}
```

**2. Component Test Wrapper (`test/helpers/component-wrapper.tsx`):**
```typescript
import React from 'react';
import { ToastProvider } from '@/contexts/ToastContext';
import { NavigationProvider } from '@/contexts/NavigationContext';

interface RenderOptions {
  initialRoute?: string;
  user?: User | null;
}

export function createComponentWrapper(options: RenderOptions = {}) {
  return function ComponentWrapper({ children }: { children: React.ReactNode }) {
    return (
      <ToastProvider>
        <NavigationProvider>
          {children}
        </NavigationProvider>
      </ToastProvider>
    );
  };
}
```

**3. Form Data Factory (`test/fixtures/form-data.ts`):**
```typescript
import type { FormData } from '@/lib/reflection/types';

export const EMPTY_FORM_DATA: FormData = {
  dream: '',
  plan: '',
  relationship: '',
  offering: '',
};

export const createMockFormData = (overrides: Partial<FormData> = {}): FormData => ({
  dream: 'My dream is to learn guitar',
  plan: 'I will practice 30 minutes daily',
  relationship: 'This dream connects to my creative side',
  offering: 'I am willing to sacrifice TV time',
  ...overrides,
});

export const partialFormData = createMockFormData({
  dream: 'Started writing',
  plan: '',
  relationship: '',
  offering: '',
});
```

**4. LocalStorage Test Helper (`test/helpers/storage.ts`):**
```typescript
import { vi } from 'vitest';

export function createLocalStorageMock() {
  const store: Record<string, string> = {};

  return {
    store,
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    reset: () => {
      Object.keys(store).forEach(key => delete store[key]);
    },
  };
}

export function setupLocalStorageMock() {
  const mock = createLocalStorageMock();
  Object.defineProperty(window, 'localStorage', { value: mock });
  return mock;
}
```

**5. Router Mock Helper (`test/helpers/router.ts`):**
```typescript
import { vi } from 'vitest';

export function createRouterMock() {
  return {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  };
}

export function createSearchParamsMock(params: Record<string, string | null> = {}) {
  return {
    get: vi.fn((key: string) => params[key] ?? null),
    getAll: vi.fn((key: string) => params[key] ? [params[key]] : []),
    has: vi.fn((key: string) => key in params),
    toString: vi.fn(() => new URLSearchParams(params as Record<string, string>).toString()),
  };
}
```

## Test File Structure Recommendations

### Proposed Directory Structure

```
test/
  fixtures/
    dreams.ts           # Existing
    users.ts            # Existing
    reflections.ts      # Existing
    form-data.ts        # NEW - Form data factories
  helpers/
    hook-wrapper.tsx    # NEW - Hook test wrapper
    component-wrapper.tsx # NEW - Component wrapper
    storage.ts          # NEW - LocalStorage mock
    router.ts           # NEW - Next.js router mocks
    render.tsx          # NEW - Custom render with providers
  mocks/
    anthropic.ts        # Existing
    supabase.ts         # Existing
    cookies.ts          # Existing
  integration/
    setup.ts            # Existing
    ...

hooks/
  __tests__/
    useReflectionForm.test.ts       # NEW
    useReflectionViewMode.test.ts   # NEW
    useMobileReflectionForm.test.ts # NEW (after extraction)
    useMobileReflectionFlow.test.ts # NEW (after extraction)

components/
  reflection/
    views/
      __tests__/
        DreamSelectionView.test.tsx  # NEW
        ReflectionFormView.test.tsx  # NEW
        ReflectionOutputView.test.tsx # NEW
    mobile/
      views/
        __tests__/
          MobileDreamSelectionView.test.tsx  # NEW (after extraction)
          MobileQuestionnaireView.test.tsx   # NEW (after extraction)
          MobileReflectionOutputView.test.tsx # NEW (after extraction)
```

### Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Component Test | `ComponentName.test.tsx` | `GlowButton.test.tsx` |
| Hook Test | `hookName.test.ts` | `useReflectionForm.test.ts` |
| Server Test | `module-name.test.ts` | `rate-limiter.test.ts` |
| Integration Test | `feature.test.ts` | `signin.test.ts` |
| Fixtures | `entity.ts` (no .test) | `dreams.ts` |

### Test Organization Pattern

```typescript
describe('ComponentName', () => {
  // Setup
  beforeEach(() => { /* reset mocks */ });

  // 1. Rendering tests
  describe('rendering', () => {
    it('renders correctly with default props', () => {});
    it('renders with custom className', () => {});
  });

  // 2. Props/variants tests
  describe('variants', () => {
    it('applies primary variant', () => {});
    it('applies secondary variant', () => {});
  });

  // 3. User interaction tests
  describe('interactions', () => {
    it('calls onClick when clicked', () => {});
    it('handles keyboard events', () => {});
  });

  // 4. State tests
  describe('state', () => {
    it('shows loading state', () => {});
    it('shows error state', () => {});
  });

  // 5. Edge cases
  describe('edge cases', () => {
    it('handles empty data', () => {});
    it('handles very long content', () => {});
  });

  // 6. Accessibility
  describe('accessibility', () => {
    it('has proper ARIA attributes', () => {});
    it('meets touch target size', () => {});
  });
});
```

## MobileReflectionFlow Refactoring Guidance

### Current Component Analysis (812 lines)

**Embedded functionality that should be extracted:**

1. **Step Navigation Logic (Lines 186-240):**
   - `goToNextStep`, `goToPreviousStep`
   - `canGoNext()` validation
   - Swipe handling

2. **Form State (Duplicated from hooks):**
   - Form data management
   - LocalStorage persistence

3. **UI Rendering (Lines 301-491):**
   - `renderStepContent()` - 190 lines of JSX
   - Each case in switch could be a separate view component

### Recommended Extraction

**Hooks to Extract:**
```typescript
// hooks/useMobileReflectionForm.ts
// Re-use existing useReflectionForm or extend it

// hooks/useMobileReflectionFlow.ts
export function useMobileReflectionFlow(props: {
  dreams: Dream[];
  selectedDreamId: string;
  formData: FormData;
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  
  const goToNextStep = useCallback(() => { /* ... */ }, []);
  const goToPreviousStep = useCallback(() => { /* ... */ }, []);
  const canGoNext = useCallback((): boolean => { /* ... */ }, []);
  const handleSwipe = useCallback((info: PanInfo) => { /* ... */ }, []);
  
  return {
    currentStep: WIZARD_STEPS[currentStepIndex],
    currentStepIndex,
    direction,
    goToNextStep,
    goToPreviousStep,
    canGoNext,
    handleSwipe,
    totalSteps: WIZARD_STEPS.length,
  };
}
```

**View Components to Extract:**
```
components/reflection/mobile/views/
  MobileDreamSelectionView.tsx    # Dream selection step
  MobileQuestionnaireView.tsx     # Question step (reusable for q1-q4)
  MobileToneSelectionView.tsx     # Tone selection step
  MobileGazingOverlay.tsx         # Submission animation overlay
  MobileExitConfirmModal.tsx      # Exit confirmation dialog
```

## Recommendations for Planner

1. **Create test utilities first** - Hook wrapper and storage mocks are prerequisites for hook testing

2. **Test hooks before view components** - Hooks contain the core logic; view components are simpler to test once hooks work

3. **Extract MobileReflectionFlow hooks before testing** - Testing the 812-line component as-is is impractical; extract first

4. **Follow existing patterns** - The codebase has consistent patterns; maintain them for team familiarity

5. **Prioritize useReflectionForm and useReflectionViewMode** - These are used across desktop and mobile; high value

6. **Coverage thresholds:**
   - Hooks: 90% (critical business logic)
   - View Components: 80% (rendering + interactions)
   - Utility hooks (useIsMobile, etc.): 75%

## Resource Map

### Critical Files for Testing

| File | Purpose |
|------|---------|
| `/vitest.config.ts` | Test configuration |
| `/vitest.setup.ts` | Global test setup |
| `/test/mocks/anthropic.ts` | AI mock factory |
| `/test/mocks/supabase.ts` | Database mock factory |
| `/test/fixtures/dreams.ts` | Dream test data |
| `/hooks/useReflectionForm.ts` | Primary hook to test |
| `/hooks/useReflectionViewMode.ts` | Secondary hook to test |
| `/components/reflection/mobile/MobileReflectionFlow.tsx` | Refactoring target |

### Key Dependencies for Hook Testing

| Package | Version | Purpose |
|---------|---------|---------|
| `@testing-library/react` | ^16.3.0 | `renderHook`, `act`, `waitFor` |
| `@testing-library/user-event` | ^14.6.1 | User interactions |
| `vitest` | ^2.1.0 | Test runner |
| `happy-dom` | ^15.11.0 | DOM environment |

## Questions for Planner

1. Should hooks use the existing `useToast` pattern or should we mock it globally in setup?

2. For MobileReflectionFlow, should we test the existing monolithic component first, or wait for extraction?

3. Should we add `@testing-library/react-hooks` for additional hook testing utilities, or is the built-in `renderHook` sufficient?

4. Should view component tests mock framer-motion entirely, or use the `useReducedMotion` hook to disable animations?

5. For localStorage persistence tests, should we use real localStorage (happy-dom provides it) or always mock it?
