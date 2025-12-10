# Technology Stack

## Testing Framework

**Decision:** Vitest with @testing-library/react

**Rationale:**
- Already configured in the project (`vitest.config.ts`)
- Fast execution with native ESM support
- Compatible with React Testing Library patterns
- Consistent with existing `useMobileReflectionFlow.test.ts`

## Test Utilities

### renderHook
**Decision:** Use `@testing-library/react` renderHook

**Rationale:**
- Standard approach for testing React hooks in isolation
- Provides `result.current` for accessing hook return values
- Supports `rerender()` for testing prop changes
- Integrates with `act()` for state updates

**Version:** Using version already in package.json

### vi (Vitest Mock Utilities)
**Decision:** Use Vitest's built-in mocking

**Rationale:**
- Native to Vitest (no additional dependencies)
- Type-safe mock functions
- Supports module mocking with `vi.mock()`

## Mocking Strategy

### 1. ToastContext Mock

**Approach:** Module mock with vi.mock()

**Implementation:**
```typescript
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
};

vi.mock('@/contexts/ToastContext', () => ({
  useToast: () => mockToast,
}));
```

**Key Points:**
- Mock must be hoisted (vi.mock is hoisted automatically)
- Reset mocks in beforeEach to track individual test calls
- The actual ToastContext returns an object with these 4 methods

### 2. Next.js Navigation Mock

**Approach:** Module mock with configurable searchParams

**Implementation:**
```typescript
let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

// Helper to update params in tests
const setSearchParams = (params: Record<string, string>) => {
  mockSearchParams = new URLSearchParams(params);
};
```

**Key Points:**
- searchParams.get('id') returns reflectionId
- searchParams.get('dreamId') returns dreamIdFromUrl
- Must re-render hook after changing params to trigger useEffect

### 3. localStorage Mock

**Approach:** Use existing pattern from useMobileReflectionFlow.test.ts

**Implementation:**
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
```

**Key Points:**
- Mock tracks both method calls AND stores actual values
- Clear store in beforeEach for test isolation
- Can seed store with initial values for testing load scenarios

### 4. History API Mock

**Approach:** Partial window.history mock

**Implementation:**
```typescript
const mockReplaceState = vi.fn();

Object.defineProperty(window, 'history', {
  value: {
    replaceState: mockReplaceState,
  },
  writable: true,
});
```

**Key Points:**
- Only need replaceState for useReflectionViewMode
- Verify it's called with correct arguments in resetToQuestionnaire tests

## Test File Organization

```
hooks/
  __tests__/
    useMobileReflectionFlow.test.ts  (EXISTING - 995 lines)
    useReflectionForm.test.ts        (NEW - ~400 lines)
    useReflectionViewMode.test.ts    (NEW - ~200 lines)
```

## Existing Fixtures

### Form Data Fixtures (test/fixtures/form-data.ts)
Already available:
- `EMPTY_FORM_DATA` - Default empty state
- `createMockFormData()` - Factory for complete form data
- `partialFormData` - In-progress form
- `minimalFormData` - Minimum valid content
- `whitespaceOnlyFormData` - For trim validation
- `formProgressScenarios` - Question completion states

### Constants (lib/reflection/constants.ts)
- `STORAGE_KEY = 'MIRROR_REFLECTION_DRAFT'`
- `STORAGE_EXPIRY_MS = 24 * 60 * 60 * 1000` (24 hours)
- `EMPTY_FORM_DATA` - Empty form constant

## Environment Setup

**File:** `vitest.setup.ts`

Existing setup includes:
- `@testing-library/jest-dom/vitest` matchers
- Haptic feedback mock
- Environment variables for Supabase, PayPal, etc.
- Global fetch mock
- `vi.resetAllMocks()` in beforeEach

## Coverage Targets

| Module | Minimum Coverage | Target Coverage |
|--------|------------------|-----------------|
| useReflectionForm | 85% | 90% |
| useReflectionViewMode | 85% | 90% |

## Key TypeScript Types

### From lib/reflection/types.ts
```typescript
interface FormData {
  dream: string;
  plan: string;
  relationship: string;
  offering: string;
}

interface Dream {
  id: string;
  title: string;
  description?: string;
  targetDate?: string | null;
  daysLeft?: number | null;
  category?: string;
}

type ViewMode = 'questionnaire' | 'output';

interface NewReflection {
  id: string;
  content: string;
}

interface SavedFormState {
  data: FormData;
  dreamId: string;
  tone: ToneId;
  timestamp: number;
}
```

### From lib/utils/constants.ts
```typescript
type ToneId = 'fusion' | 'nurturing' | 'direct' | 'philosophical' | 'playful';
```

## Dependencies

### Production (already in package.json)
- `react` - ^18.x
- `next` - 14.x (for navigation hooks)

### Dev Dependencies (already in package.json)
- `vitest` - Test runner
- `@testing-library/react` - React Testing Library
- `@testing-library/jest-dom` - DOM matchers
