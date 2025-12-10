# Explorer 1 Report: React Hooks Analysis for Testing

## Executive Summary

The hooks directory contains **14 custom React hooks** across authentication, animation, accessibility, viewport, and reflection domains. Currently, only 1 hook (`useMobileReflectionFlow`) has tests (~29KB comprehensive test file). The priority hooks from vision.md (`useReflectionForm`, `useReflectionViewMode`, `useMobileReflectionForm`) have **0% coverage**. Note: `useMobileReflectionForm.ts` does not exist - the mobile reflection state is managed by `useMobileReflectionFlow.ts` combined with `useReflectionForm.ts`.

## Hooks Inventory

### Priority 1: Reflection Hooks (Target: 90% coverage)

| Hook | Lines | Coverage | Complexity | Dependencies |
|------|-------|----------|------------|--------------|
| `useReflectionForm.ts` | 169 | **0%** | HIGH | localStorage, ToastContext |
| `useReflectionViewMode.ts` | 63 | **0%** | MEDIUM | next/navigation (searchParams) |
| `useMobileReflectionFlow.ts` | 174 | **~95%** | HIGH | localStorage, framer-motion (PanInfo) |

### Priority 2: Authentication & State Hooks

| Hook | Lines | Coverage | Complexity | Dependencies |
|------|-------|----------|------------|--------------|
| `useAuth.ts` | 178 | **0%** | HIGH | tRPC, next/navigation (router) |
| `useDashboard.ts` | 51 | **0%** | LOW | tRPC utils |
| `usePortalState.ts` | 115 | **0%** | MEDIUM | next/navigation (router) |

### Priority 3: Animation & Effects Hooks

| Hook | Lines | Coverage | Complexity | Dependencies |
|------|-------|----------|------------|--------------|
| `useAnimatedCounter.ts` | 83 | **0%** | MEDIUM | requestAnimationFrame, matchMedia |
| `useBreathingEffect.ts` | 88 | **0%** | LOW | matchMedia |
| `useStaggerAnimation.ts` | 107 | **0%** | MEDIUM | IntersectionObserver, matchMedia |

### Priority 4: Viewport & Accessibility Hooks

| Hook | Lines | Coverage | Complexity | Dependencies |
|------|-------|----------|------------|--------------|
| `useIsMobile.ts` | 34 | **0%** | LOW | window.innerWidth, resize event |
| `useKeyboardHeight.ts` | 49 | **0%** | LOW | visualViewport API |
| `useReducedMotion.ts` | 37 | **0%** | LOW | matchMedia |
| `useScrollDirection.ts` | 76 | **0%** | MEDIUM | scroll event, requestAnimationFrame |

### Barrel Export

- `index.ts` - Exports all hooks with proper type exports

## Test Coverage Status

### Currently Tested

**`useMobileReflectionFlow.ts`** - Comprehensive test file exists at:
```
/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/hooks/__tests__/useMobileReflectionFlow.test.ts
```

Test coverage includes:
- Initialization tests (7 tests)
- `canGoNext` validation tests (12 tests)
- Navigation tests (11 tests)
- Swipe handling tests (13 tests)
- Textarea focus state tests (2 tests)
- Exit handling tests (7 tests)
- Reactivity tests (3 tests)
- Return value completeness tests (2 tests)

### Not Tested (Priority Gaps)

| Hook | Reason | Effort |
|------|--------|--------|
| `useReflectionForm` | Critical for reflection feature | HIGH |
| `useReflectionViewMode` | Critical for reflection navigation | MEDIUM |
| `useAuth` | tRPC mocking complexity | HIGH |
| All others | Lower priority | LOW-MEDIUM |

## Test Cases Required per Hook

### useReflectionForm.ts (169 lines, HIGH PRIORITY)

**Purpose:** Manages reflection form state, validation, and localStorage persistence.

**Test Categories:**

#### 1. Initialization Tests
```typescript
- initializes with empty form data when no saved state exists
- initializes with initialDreamId when provided
- initializes selectedTone to 'fusion' by default
- initializes selectedDream as null
```

#### 2. Dream Selection Tests
```typescript
- handleDreamSelect updates selectedDreamId
- handleDreamSelect updates selectedDream when dream found in dreams array
- handleDreamSelect sets selectedDream to null when dream not found
- updates selectedDream when dreams array loads (useEffect)
```

#### 3. Form Field Change Tests
```typescript
- handleFieldChange updates dream field
- handleFieldChange updates plan field
- handleFieldChange updates relationship field
- handleFieldChange updates offering field
- handleFieldChange preserves other fields when updating one
```

#### 4. Validation Tests
```typescript
- validateForm returns false and shows toast when no dream selected
- validateForm returns false and shows toast when dream field empty
- validateForm returns false and shows toast when plan field empty
- validateForm returns false and shows toast when relationship field empty
- validateForm returns false and shows toast when offering field empty
- validateForm returns true when all fields have content
- validateForm trims whitespace when validating
```

#### 5. LocalStorage Persistence Tests
```typescript
- saves form data to localStorage when content changes
- saves dreamId to localStorage
- saves tone to localStorage
- loads saved form data on mount
- loads saved dreamId on mount
- loads saved tone on mount
- removes expired data (older than 24 hours)
- handles localStorage errors gracefully (try/catch)
- clears localStorage on clearForm
```

#### 6. Clear Form Tests
```typescript
- clearForm resets formData to EMPTY_FORM_DATA
- clearForm resets selectedDreamId to empty string
- clearForm resets selectedDream to null
- clearForm resets selectedTone to 'fusion'
- clearForm removes STORAGE_KEY from localStorage
```

#### 7. SSR Safety Tests
```typescript
- handles window undefined gracefully (localStorage effects)
```

### useReflectionViewMode.ts (63 lines, HIGH PRIORITY)

**Purpose:** Manages reflection view mode and URL parameter synchronization.

**Test Categories:**

#### 1. Initialization Tests
```typescript
- initializes viewMode to 'questionnaire' when no id in URL
- initializes viewMode to 'output' when id exists in URL
- reads reflectionId from searchParams
- reads dreamIdFromUrl from searchParams
- initializes newReflection as null
```

#### 2. View Mode Sync Tests
```typescript
- syncs viewMode to 'output' when reflectionId appears in URL
- syncs viewMode to 'questionnaire' when reflectionId removed from URL
- does not sync viewMode when newReflection exists (prevents override)
```

#### 3. New Reflection Handling Tests
```typescript
- setNewReflection updates newReflection state
- setting newReflection prevents viewMode sync from URL
```

#### 4. Reset Tests
```typescript
- resetToQuestionnaire sets viewMode to 'questionnaire'
- resetToQuestionnaire sets newReflection to null
- resetToQuestionnaire calls history.replaceState with '/reflection'
```

### useAuth.ts (178 lines, MEDIUM PRIORITY)

**Purpose:** Authentication state management with tRPC integration.

**Test Categories:**

#### 1. Initial State Tests
```typescript
- initializes user as null
- initializes isLoading as true
- initializes error as null
- isAuthenticated is false when user is null
```

#### 2. Profile Fetching Tests
```typescript
- fetches user profile on mount
- maps getProfile response to User type correctly
- sets user to null when no userData
- updates isLoading from userLoading
```

#### 3. Sign In Tests
```typescript
- signin calls mutation with email and password
- signin sets user on success
- signin navigates to /dashboard on success
- signin sets error on failure
- signin clears error before attempting
```

#### 4. Sign Up Tests
```typescript
- signup calls mutation with name, email, password
- signup sets user on success
- signup navigates to /dashboard on success
- signup sets error on failure
```

#### 5. Sign Out Tests
```typescript
- signout calls mutation
- signout clears user on success
- signout navigates to / on success
- signout clears user even on error (graceful degradation)
```

#### 6. Refresh Tests
```typescript
- refreshUser triggers refetch
```

#### 7. Loading State Tests
```typescript
- isLoading is true during signin mutation
- isLoading is true during signup mutation
- isLoading is true during signout mutation
```

### Other Hooks (LOW-MEDIUM PRIORITY)

Each hook needs basic tests:

| Hook | Test Focus |
|------|------------|
| `useDashboard` | refreshAll invalidates correct queries |
| `usePortalState` | Tagline rotation, button config, navigation |
| `useAnimatedCounter` | Animation values, reduced motion handling |
| `useBreathingEffect` | Preset handling, hover pause, reduced motion |
| `useStaggerAnimation` | IntersectionObserver, item styles, visibility |
| `useIsMobile` | Breakpoint detection, resize handling |
| `useKeyboardHeight` | visualViewport events, threshold |
| `useReducedMotion` | MediaQuery detection, change events |
| `useScrollDirection` | Direction detection, threshold, throttling |

## Mocking Requirements

### 1. ToastContext Mock

Required for: `useReflectionForm`

```typescript
// test/mocks/toast.ts
vi.mock('@/contexts/ToastContext', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
}));
```

### 2. Next.js Navigation Mock

Required for: `useReflectionViewMode`, `useAuth`, `usePortalState`

```typescript
// Mock for searchParams
const mockSearchParams = new URLSearchParams();
vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

// Helper to set search params
const setSearchParam = (key: string, value: string) => {
  mockSearchParams.set(key, value);
};
```

### 3. tRPC Mock

Required for: `useAuth`, `useDashboard`

```typescript
// test/mocks/trpc.ts
vi.mock('@/lib/trpc', () => ({
  trpc: {
    users: {
      getProfile: {
        useQuery: vi.fn(() => ({
          data: null,
          isLoading: false,
          refetch: vi.fn(),
        })),
      },
    },
    auth: {
      signin: { useMutation: vi.fn() },
      signup: { useMutation: vi.fn() },
      signout: { useMutation: vi.fn() },
    },
    useUtils: () => ({
      subscriptions: { getStatus: { invalidate: vi.fn() } },
      reflections: { list: { invalidate: vi.fn() }, checkUsage: { invalidate: vi.fn() } },
      dreams: { list: { invalidate: vi.fn() } },
      evolution: { checkEligibility: { invalidate: vi.fn() } },
    }),
  },
}));
```

### 4. LocalStorage Mock (Already in existing test)

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

### 5. Window APIs Mock

Required for: Animation and viewport hooks

```typescript
// matchMedia mock
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// visualViewport mock
Object.defineProperty(window, 'visualViewport', {
  value: {
    height: 800,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
});

// IntersectionObserver mock
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
```

### 6. History API Mock

Required for: `useReflectionViewMode`

```typescript
Object.defineProperty(window, 'history', {
  value: {
    replaceState: vi.fn(),
  },
});
```

## Implementation Strategy

### Phase 1: Setup (1 hour)

1. Create mock files:
   - `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/mocks/toast.ts`
   - `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/mocks/navigation.ts`
   
2. Update `vitest.setup.ts` with global mocks for window APIs

### Phase 2: Priority 1 Hook Tests (4-5 hours)

1. **useReflectionForm.test.ts** (~2.5 hours)
   - ~30-35 test cases
   - Complex localStorage interaction
   - Toast context mocking
   - Form validation logic

2. **useReflectionViewMode.test.ts** (~1.5 hours)
   - ~15-20 test cases
   - URL searchParams mocking
   - History API mocking
   - View mode synchronization

### Phase 3: Priority 2 Hook Tests (Optional for this iteration)

1. **useAuth.test.ts** (~2 hours) - Complex tRPC mocking
2. **useDashboard.test.ts** (~30 min) - Simple tRPC utils test
3. **usePortalState.test.ts** (~1.5 hours) - Tagline rotation, navigation

### Test File Structure

```
hooks/
  __tests__/
    useMobileReflectionFlow.test.ts  (EXISTS - 995 lines)
    useReflectionForm.test.ts        (NEW - ~400 lines)
    useReflectionViewMode.test.ts    (NEW - ~200 lines)
```

### Key Patterns from Existing Test

From `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/hooks/__tests__/useMobileReflectionFlow.test.ts`:

1. **Test Organization:**
   ```typescript
   describe('useMobileReflectionFlow', () => {
     describe('initialization', () => { /* ... */ });
     describe('canGoNext', () => { /* ... */ });
     describe('navigation', () => { /* ... */ });
     // etc.
   });
   ```

2. **Hook Rendering:**
   ```typescript
   import { renderHook, act } from '@testing-library/react';
   
   const { result } = renderHook(() => useHookName(options));
   ```

3. **State Updates:**
   ```typescript
   act(() => {
     result.current.someAction();
   });
   expect(result.current.someState).toBe(expectedValue);
   ```

4. **Rerender with New Props:**
   ```typescript
   const { result, rerender } = renderHook(
     ({ formData }) => useHookName({ formData }),
     { initialProps: { formData: EMPTY_FORM_DATA } }
   );
   
   rerender({ formData: updatedFormData });
   ```

5. **Test Fixtures:**
   - Import from `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/fixtures/form-data.ts`
   - Use factories for consistent test data

## Recommendations for Builder

1. **Start with useReflectionForm** - It has the most test cases but follows patterns similar to `useMobileReflectionFlow`

2. **Create Reusable Toast Mock** - Many hooks will need toast mocking for validation feedback

3. **Test SSR Safety** - All hooks use `'use client'` and check `typeof window !== 'undefined'`

4. **Use Existing Fixtures** - The form-data fixtures already exist and cover edge cases

5. **Follow Existing Test Structure** - The `useMobileReflectionFlow.test.ts` is an excellent template

6. **Note on useMobileReflectionForm** - This hook does NOT exist. Vision.md mentions it but the actual implementation uses `useReflectionForm` for form state + `useMobileReflectionFlow` for wizard navigation. Update documentation accordingly.

## Questions for Planner

1. Should we prioritize `useAuth` tests in this iteration or defer to a later iteration?
2. Is there a ToastContext mock already available somewhere in the codebase?
3. Should animation hooks have timing-based tests or just verify state transitions?
4. The vision.md mentions `useMobileReflectionForm.ts` but it does not exist - should we create it or update the vision?

## Resource Map

### Critical Files
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/hooks/useReflectionForm.ts` - Form state management
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/hooks/useReflectionViewMode.ts` - View mode & URL sync
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/hooks/__tests__/useMobileReflectionFlow.test.ts` - Test pattern reference

### Supporting Files
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/fixtures/form-data.ts` - Form test data
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/reflection/constants.ts` - Storage keys, questions
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/reflection/types.ts` - Type definitions
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/contexts/ToastContext.tsx` - Toast interface
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/vitest.setup.ts` - Test setup
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/helpers/render.tsx` - Render helpers

### Key Dependencies
- `@testing-library/react` - renderHook, act
- `vitest` - describe, it, expect, vi
- Form data fixtures - EMPTY_FORM_DATA, createMockFormData, etc.
