# Technology Stack

## Testing Framework

**Decision:** Vitest 2.x with React Testing Library

**Rationale:**
- Already configured in the project (`vitest.config.ts`)
- Fast execution with native ESM support
- Compatible with existing test setup
- Jest-compatible API reduces learning curve

**Test Runner:** Vitest
**DOM Environment:** happy-dom (configured in project)

## Testing Libraries

### Core Testing
- `vitest` - Test runner and assertion library
- `@testing-library/react` - React component testing utilities
- `@testing-library/jest-dom` - Custom DOM matchers

### Existing Setup
The project already has comprehensive test infrastructure:

```typescript
// vitest.setup.ts
import '@testing-library/jest-dom/vitest';
import { beforeEach, vi } from 'vitest';

// Pre-configured mocks:
vi.mock('@/lib/utils/haptics', () => ({
  haptic: vi.fn(),
  isHapticSupported: vi.fn(() => true),
}));
```

## Mocking Strategy

### 1. Framer Motion

**Decision:** Use partial mock preserving animation components

**Rationale:**
- Components render `motion.div`, `motion.input`, etc.
- Need to test reduced motion behavior
- Existing pattern in project works well

**Implementation:**
```typescript
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    useReducedMotion: vi.fn(() => false),
  };
});
```

### 2. useIsMobile Hook

**Decision:** Mock from `@/hooks` module

**Rationale:**
- GlassModal and BottomSheet have mobile-specific behavior
- Need to test both mobile and desktop rendering
- Controlled mock enables isolated testing

**Implementation:**
```typescript
vi.mock('@/hooks', async () => {
  const actual = await vi.importActual('@/hooks');
  return {
    ...actual,
    useIsMobile: vi.fn(() => false),
  };
});
```

### 3. react-focus-lock

**Decision:** Mock to render children directly

**Rationale:**
- Focus trap behavior is complex to test in JSDOM
- Component structure and callbacks are more important
- Reduces test complexity while maintaining coverage

**Implementation:**
```typescript
vi.mock('react-focus-lock', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="focus-lock">{children}</div>,
}));
```

### 4. Next.js Link

**Decision:** Mock to render standard anchor

**Rationale:**
- AuthLayout uses Next.js Link
- Avoids router context requirements
- Tests navigation href correctly

**Implementation:**
```typescript
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
```

### 5. Word Count Utility

**Decision:** Mock with simple implementation

**Rationale:**
- GlassInput word counter mode depends on this
- Simple mock provides predictable behavior
- Actual implementation tested separately

**Implementation:**
```typescript
vi.mock('@/lib/utils/wordCount', () => ({
  countWords: vi.fn((text: string) => text.trim().split(/\s+/).filter(Boolean).length),
}));
```

## Test Patterns

### File Naming Convention
- Test files: `{ComponentName}.test.tsx`
- Location: `__tests__/` directory alongside component

### Test Organization
Tests are organized by category using `describe` blocks:

1. `describe('rendering', ...)` - Basic render tests
2. `describe('variants', ...)` - Prop variants
3. `describe('interactions', ...)` - User interactions
4. `describe('accessibility', ...)` - WCAG compliance
5. `describe('mobile behavior', ...)` - Mobile-specific tests

### Query Priority (RTL Best Practices)
1. `getByRole` - For interactive elements
2. `getByLabelText` - For form controls
3. `getByText` - For content
4. `getByTestId` - Last resort

## Coverage Targets

| Component | Target Coverage |
|-----------|-----------------|
| GlassCard | 85%+ |
| GlassInput | 85%+ |
| GlassModal | 80%+ |
| CosmicLoader | 90%+ |
| AuthLayout | 90%+ |
| BottomSheet | 80%+ |
| AnimatedBackground | 85%+ |

**Overall Target:** 80%+ across all tested components

## Commands

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- GlassCard.test.tsx

# Run tests in watch mode
npm run test -- --watch
```

## Environment Variables

Pre-configured in `vitest.setup.ts`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- All required environment variables are mocked

## Dependencies (Already Installed)

```json
{
  "devDependencies": {
    "vitest": "^2.x",
    "@testing-library/react": "^14.x",
    "@testing-library/jest-dom": "^6.x",
    "happy-dom": "^12.x"
  }
}
```

No additional dependencies required for this iteration.
