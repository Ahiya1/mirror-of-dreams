# Code Patterns & Conventions

## File Structure

```
hooks/
  __tests__/
    useMobileReflectionFlow.test.ts  (EXISTING - pattern reference)
    useReflectionForm.test.ts        (NEW)
    useReflectionViewMode.test.ts    (NEW)
  useReflectionForm.ts               (TARGET - 169 lines)
  useReflectionViewMode.ts           (TARGET - 63 lines)
  index.ts                           (barrel export)

test/
  fixtures/
    form-data.ts                     (existing fixtures)
  helpers/
    render.tsx                       (custom render)
    trpc.ts                          (tRPC mocks)
    index.ts                         (exports)
```

## Naming Conventions

- Test files: `{hookName}.test.ts`
- Describe blocks: Use hook name as outer describe
- Test names: Start with verb ("initializes", "updates", "returns")
- Mock variables: Prefix with `mock` (e.g., `mockToast`, `mockSearchParams`)

## Test Organization Pattern

Follow the structure from `useMobileReflectionFlow.test.ts`:

```typescript
describe('useHookName', () => {
  // Setup mocks and helpers at top
  const mockCallback = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset any mock state
  });

  afterEach(() => {
    vi.resetModules();
  });

  // ============================================
  // CATEGORY TESTS
  // ============================================
  describe('category name', () => {
    it('specific test case', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

## Hook Testing Patterns

### Basic Hook Rendering

```typescript
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useReflectionForm } from '../useReflectionForm';

describe('useReflectionForm', () => {
  it('initializes with default values', () => {
    const { result } = renderHook(() =>
      useReflectionForm({ dreams: [] })
    );

    expect(result.current.formData).toEqual({
      dream: '',
      plan: '',
      relationship: '',
      offering: '',
    });
    expect(result.current.selectedDreamId).toBe('');
    expect(result.current.selectedTone).toBe('fusion');
  });
});
```

### Testing State Updates with act()

```typescript
it('updates form field on handleFieldChange', () => {
  const { result } = renderHook(() =>
    useReflectionForm({ dreams: [] })
  );

  act(() => {
    result.current.handleFieldChange('dream', 'My new dream');
  });

  expect(result.current.formData.dream).toBe('My new dream');
});
```

### Testing with Props Changes (rerender)

```typescript
it('updates selectedDream when dreams array loads', () => {
  const { result, rerender } = renderHook(
    ({ dreams }) => useReflectionForm({ dreams, initialDreamId: 'dream-1' }),
    { initialProps: { dreams: undefined } }
  );

  expect(result.current.selectedDream).toBeNull();

  // Simulate dreams loading
  const mockDreams = [{ id: 'dream-1', title: 'My Dream' }];
  rerender({ dreams: mockDreams });

  expect(result.current.selectedDream).toEqual(mockDreams[0]);
});
```

### Testing Callbacks

```typescript
it('validates form and returns false when dream field empty', () => {
  const { result } = renderHook(() =>
    useReflectionForm({ dreams: [] })
  );

  // Set dreamId but leave form fields empty
  act(() => {
    result.current.handleDreamSelect('dream-1');
  });

  let isValid: boolean;
  act(() => {
    isValid = result.current.validateForm();
  });

  expect(isValid).toBe(false);
  expect(mockToast.warning).toHaveBeenCalledWith('Please elaborate on your dream');
});
```

## Mock Patterns

### ToastContext Mock (Required for useReflectionForm)

```typescript
// At top of test file, before imports
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
};

vi.mock('@/contexts/ToastContext', () => ({
  useToast: () => mockToast,
}));

// In beforeEach
beforeEach(() => {
  vi.clearAllMocks();
  // mockToast methods are automatically cleared by vi.clearAllMocks()
});
```

### localStorage Mock (Required for useReflectionForm)

```typescript
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => localStorageMock.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageMock.store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageMock.store[key];
  }),
  clear: vi.fn(() => {
    localStorageMock.store = {};
  }),
};

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// In beforeEach
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.store = {}; // Reset store state
});
```

### Next.js Navigation Mock (Required for useReflectionViewMode)

```typescript
// Create mutable reference for searchParams
let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}));

// Helper function to update params
const setMockSearchParams = (params: Record<string, string>) => {
  mockSearchParams = new URLSearchParams(params);
};

// Usage in test
it('initializes viewMode to output when id exists in URL', () => {
  setMockSearchParams({ id: 'reflection-123' });

  const { result } = renderHook(() => useReflectionViewMode());

  expect(result.current.viewMode).toBe('output');
  expect(result.current.reflectionId).toBe('reflection-123');
});

// In beforeEach
beforeEach(() => {
  mockSearchParams = new URLSearchParams(); // Reset to empty
});
```

### History API Mock (Required for useReflectionViewMode)

```typescript
const mockReplaceState = vi.fn();

beforeEach(() => {
  Object.defineProperty(window, 'history', {
    value: {
      replaceState: mockReplaceState,
    },
    writable: true,
  });
  mockReplaceState.mockClear();
});

// Usage in test
it('calls history.replaceState on resetToQuestionnaire', () => {
  setMockSearchParams({ id: 'reflection-123' });

  const { result } = renderHook(() => useReflectionViewMode());

  act(() => {
    result.current.resetToQuestionnaire();
  });

  expect(mockReplaceState).toHaveBeenCalledWith(null, '', '/reflection');
});
```

## Test Data Factory Patterns

### Dream Factory

```typescript
const createMockDream = (overrides: Partial<Dream> = {}): Dream => ({
  id: 'dream-1',
  title: 'Test Dream',
  description: 'A test dream description',
  targetDate: '2025-12-31',
  daysLeft: 365,
  category: 'personal_growth',
  ...overrides,
});

const createMockDreams = (count: number): Dream[] =>
  Array.from({ length: count }, (_, i) =>
    createMockDream({ id: `dream-${i + 1}`, title: `Dream ${i + 1}` })
  );
```

### Using Existing Form Fixtures

```typescript
import {
  EMPTY_FORM_DATA,
  createMockFormData,
  partialFormData,
  minimalFormData,
  whitespaceOnlyFormData,
  formProgressScenarios,
} from '@/test/fixtures/form-data';

// Use in tests
it('treats whitespace-only content as invalid', () => {
  const { result } = renderHook(() =>
    useReflectionForm({ dreams: [] })
  );

  // Set form with whitespace-only content
  act(() => {
    result.current.handleFieldChange('dream', '   ');
    result.current.handleDreamSelect('dream-1');
  });

  let isValid: boolean;
  act(() => {
    isValid = result.current.validateForm();
  });

  expect(isValid).toBe(false);
});
```

### localStorage Saved State Factory

```typescript
import { STORAGE_KEY, STORAGE_EXPIRY_MS } from '@/lib/reflection/constants';
import type { SavedFormState } from '@/lib/reflection/types';

const createSavedFormState = (overrides: Partial<SavedFormState> = {}): SavedFormState => ({
  data: createMockFormData(),
  dreamId: 'dream-1',
  tone: 'fusion',
  timestamp: Date.now(),
  ...overrides,
});

// Seed localStorage before test
it('loads saved form data on mount', () => {
  const savedState = createSavedFormState();
  localStorageMock.store[STORAGE_KEY] = JSON.stringify(savedState);

  const { result } = renderHook(() =>
    useReflectionForm({ dreams: [] })
  );

  expect(result.current.formData).toEqual(savedState.data);
  expect(result.current.selectedDreamId).toBe(savedState.dreamId);
  expect(result.current.selectedTone).toBe(savedState.tone);
});
```

## Testing Patterns by Category

### Testing useEffect Behavior

```typescript
describe('localStorage persistence', () => {
  it('saves form data to localStorage when content changes', async () => {
    const { result } = renderHook(() =>
      useReflectionForm({ dreams: [] })
    );

    act(() => {
      result.current.handleFieldChange('dream', 'My dream content');
    });

    // Wait for useEffect to run
    await vi.waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    const savedData = JSON.parse(localStorageMock.store[STORAGE_KEY]);
    expect(savedData.data.dream).toBe('My dream content');
  });
});
```

### Testing Expired Data Handling

```typescript
it('removes expired data (older than 24 hours)', () => {
  const expiredState = createSavedFormState({
    timestamp: Date.now() - STORAGE_EXPIRY_MS - 1000, // 1 second past expiry
  });
  localStorageMock.store[STORAGE_KEY] = JSON.stringify(expiredState);

  const { result } = renderHook(() =>
    useReflectionForm({ dreams: [] })
  );

  // Should not load expired data
  expect(result.current.formData).toEqual(EMPTY_FORM_DATA);
  expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
});
```

### Testing SSR Safety

```typescript
it('handles window undefined gracefully', () => {
  const originalWindow = global.window;
  // @ts-expect-error - Testing SSR scenario
  delete global.window;

  // Should not throw
  expect(() => {
    renderHook(() => useReflectionForm({ dreams: [] }));
  }).not.toThrow();

  global.window = originalWindow;
});
```

### Testing URL Parameter Sync (useReflectionViewMode)

```typescript
describe('view mode sync with URL', () => {
  it('syncs viewMode to output when reflectionId appears in URL', () => {
    // Start with no params
    setMockSearchParams({});

    const { result, rerender } = renderHook(() => useReflectionViewMode());
    expect(result.current.viewMode).toBe('questionnaire');

    // Simulate URL change
    setMockSearchParams({ id: 'reflection-123' });
    rerender();

    expect(result.current.viewMode).toBe('output');
  });

  it('does not sync viewMode when newReflection exists', () => {
    setMockSearchParams({});

    const { result, rerender } = renderHook(() => useReflectionViewMode());

    // Set newReflection first
    act(() => {
      result.current.setNewReflection({ id: 'new-1', content: 'Content' });
    });

    // Simulate URL change
    setMockSearchParams({ id: 'reflection-123' });
    rerender();

    // Should stay on questionnaire because newReflection prevents sync
    expect(result.current.viewMode).toBe('questionnaire');
  });
});
```

## Testing Patterns for Validation

### Comprehensive Validation Test Suite

```typescript
describe('validateForm', () => {
  it('returns false and shows toast when no dream selected', () => {
    const { result } = renderHook(() =>
      useReflectionForm({ dreams: [] })
    );

    let isValid: boolean;
    act(() => {
      isValid = result.current.validateForm();
    });

    expect(isValid).toBe(false);
    expect(mockToast.warning).toHaveBeenCalledWith('Please select a dream');
  });

  it('returns false and shows toast when dream field empty', () => {
    const { result } = renderHook(() =>
      useReflectionForm({ dreams: [createMockDream()] })
    );

    act(() => {
      result.current.handleDreamSelect('dream-1');
    });

    let isValid: boolean;
    act(() => {
      isValid = result.current.validateForm();
    });

    expect(isValid).toBe(false);
    expect(mockToast.warning).toHaveBeenCalledWith('Please elaborate on your dream');
  });

  // Similar pattern for plan, relationship, offering fields...

  it('returns true when all fields have content', () => {
    const mockDreams = [createMockDream()];
    const { result } = renderHook(() =>
      useReflectionForm({ dreams: mockDreams })
    );

    act(() => {
      result.current.handleDreamSelect('dream-1');
      result.current.handleFieldChange('dream', 'My dream');
      result.current.handleFieldChange('plan', 'My plan');
      result.current.handleFieldChange('relationship', 'My relationship');
      result.current.handleFieldChange('offering', 'My offering');
    });

    let isValid: boolean;
    act(() => {
      isValid = result.current.validateForm();
    });

    expect(isValid).toBe(true);
    expect(mockToast.warning).not.toHaveBeenCalled();
  });
});
```

## Error Handling Patterns

### Testing localStorage Error Handling

```typescript
it('handles localStorage errors gracefully on save', () => {
  localStorageMock.setItem.mockImplementationOnce(() => {
    throw new Error('Storage full');
  });

  const { result } = renderHook(() =>
    useReflectionForm({ dreams: [] })
  );

  // Should not throw
  expect(() => {
    act(() => {
      result.current.handleFieldChange('dream', 'Content');
    });
  }).not.toThrow();
});

it('handles localStorage errors gracefully on load', () => {
  localStorageMock.getItem.mockImplementationOnce(() => {
    throw new Error('Storage corrupted');
  });

  // Should not throw and should use default values
  const { result } = renderHook(() =>
    useReflectionForm({ dreams: [] })
  );

  expect(result.current.formData).toEqual(EMPTY_FORM_DATA);
});
```

## Import Order Convention

```typescript
// 1. React/Testing imports
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// 2. Hook under test
import { useReflectionForm } from '../useReflectionForm';

// 3. Types
import type { Dream } from '@/lib/reflection/types';

// 4. Test fixtures
import {
  EMPTY_FORM_DATA,
  createMockFormData,
  partialFormData,
} from '@/test/fixtures/form-data';

// 5. Constants
import { STORAGE_KEY, STORAGE_EXPIRY_MS } from '@/lib/reflection/constants';
```

## Code Quality Standards

- Use `vi.clearAllMocks()` in beforeEach, NOT individual mock.mockClear()
- Always wrap state changes in `act()`
- Use async/await with `vi.waitFor()` for useEffect assertions
- Keep test descriptions clear: "returns X when Y" or "handles Z"
- Group related tests with nested describe blocks
- Use the AAA pattern: Arrange, Act, Assert

## Security Patterns

For hook tests specifically:
- Ensure localStorage handles malformed JSON gracefully
- Verify expired tokens/data are properly rejected
- Test that validation cannot be bypassed with whitespace-only content
