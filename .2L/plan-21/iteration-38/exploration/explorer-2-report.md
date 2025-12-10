# Explorer 2 Report: Component Testing Analysis

## Executive Summary

The project has a well-established testing infrastructure using Vitest with happy-dom, but **@testing-library/react is NOT installed**. This is a critical gap that must be addressed before component testing can begin. The codebase contains 70+ React components, with approximately 15-20 pure/presentational components ideal for initial testing coverage.

## Testing Library Status

### Current Testing Infrastructure

| Dependency | Version | Status |
|------------|---------|--------|
| vitest | ^2.1.0 | Installed |
| @vitest/coverage-v8 | ^2.1.0 | Installed |
| @vitest/ui | ^2.1.0 | Installed |
| @vitejs/plugin-react | ^4.3.0 | Installed |
| happy-dom | ^15.11.0 | Installed |
| **@testing-library/react** | - | **NOT INSTALLED** |
| **@testing-library/jest-dom** | - | **NOT INSTALLED** |
| **@testing-library/user-event** | - | **NOT INSTALLED** |

### Required Installations

```bash
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### Vitest Configuration Analysis

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/vitest.config.ts`

Current configuration is **partially ready** for component testing:

**Good:**
- React plugin configured (`@vitejs/plugin-react`)
- `happy-dom` environment set
- Path aliases configured (`@/components`, `@/lib`, etc.)
- Setup file exists (`vitest.setup.ts`)
- Test patterns include `.test.tsx`

**Missing:**
- `components/**/*.ts` not in coverage include (currently only `lib/**`, `server/**`, `types/**`)
- No testing-library matchers in setup

### Required vitest.setup.ts Updates

Add to `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/vitest.setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest';
```

## Components to Test

### Priority 1: Pure Presentational Components (Highest ROI)

These components have no side effects, external dependencies, or complex state:

| Component | Path | Complexity | Props |
|-----------|------|------------|-------|
| ToneBadge | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/ToneBadge.tsx` | Low | `tone`, `className`, `showGlow` |
| CharacterCounter | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/CharacterCounter.tsx` | Low | `current`, `max`, `warning` |
| ProgressBar | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/ProgressBar.tsx` | Low | `currentStep`, `totalSteps`, `className` |
| GradientText | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/ui/glass/GradientText.tsx` | Low | `gradient`, `className`, `children` |
| GlowBadge | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/ui/glass/GlowBadge.tsx` | Low | `variant`, `className`, `children` |
| TierBadge | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/shared/TierBadge.tsx` | Low | `tier`, `size`, `animated`, `showGlow`, `showIcon` |

### Priority 2: Interactive Components

Components with user interactions requiring event testing:

| Component | Path | Complexity | Key Test Areas |
|-----------|------|------------|----------------|
| GlowButton | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/ui/glass/GlowButton.tsx` | Medium | Click events, variants, disabled state, sizes |
| GlassInput | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/ui/glass/GlassInput.tsx` | Medium-High | Input handling, validation states, counter modes |
| ToneSelection | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/ToneSelection.tsx` | Medium | Tone selection, keyboard navigation, disabled state |
| GlassCard | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/ui/glass/GlassCard.tsx` | Medium | Click events, interactive states, keyboard handling |

### Priority 3: Composite Components

Components that compose other components:

| Component | Path | Complexity | Dependencies |
|-----------|------|------------|--------------|
| ReflectionQuestionCard | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/ReflectionQuestionCard.tsx` | Medium | GlassInput |
| DashboardCard | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/shared/DashboardCard.tsx` | Medium | framer-motion |
| EmptyState | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/shared/EmptyState.tsx` | Medium | GlassCard, GlowButton, GradientText |
| ProgressRing | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/shared/ProgressRing.tsx` | Medium-High | Animation timing |

### Priority 4: Additional Pure Components

Other components suitable for testing:

| Component | Path |
|-----------|------|
| DreamCategoryIcon | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/icons/DreamCategoryIcon.tsx` |
| DreamStatusIcon | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/icons/DreamStatusIcon.tsx` |
| PasswordToggle | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/ui/PasswordToggle.tsx` |
| ProgressIndicator | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/ProgressIndicator.tsx` |
| ProgressOrbs | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/ui/glass/ProgressOrbs.tsx` |
| CosmicLoader | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/ui/glass/CosmicLoader.tsx` |

## Existing Test Patterns

### Unit Test Pattern (from `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/__tests__/limits.test.ts`)

```typescript
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

describe('checkReflectionLimits', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('free tier', () => {
    test('should allow first reflection', () => {
      const user = createMockUser({ tier: 'free', reflectionCountThisMonth: 0 });
      const result = checkReflectionLimits(user);
      expect(result.canCreate).toBe(true);
    });
  });
});
```

### Test Fixture Pattern (from `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/fixtures/users.ts`)

```typescript
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'test-user-uuid-1234',
  email: 'test@example.com',
  // ... defaults
  ...overrides,
});
```

### Integration Test Pattern (from `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/integration/setup.ts`)

Uses `vi.hoisted()` for module mocks and provides `createTestCaller()` factory.

## Recommended Component Test Pattern

Based on existing patterns, here's the recommended structure for component tests:

```typescript
// components/ui/glass/__tests__/GlowButton.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { GlowButton } from '../GlowButton';

describe('GlowButton', () => {
  describe('rendering', () => {
    test('should render children', () => {
      render(<GlowButton>Click me</GlowButton>);
      expect(screen.getByRole('button')).toHaveTextContent('Click me');
    });

    test('should apply variant classes', () => {
      render(<GlowButton variant="cosmic">Cosmic</GlowButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gradient-to-br');
    });
  });

  describe('interactions', () => {
    test('should call onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<GlowButton onClick={handleClick}>Click</GlowButton>);
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('should not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(<GlowButton onClick={handleClick} disabled>Click</GlowButton>);
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });
});
```

## Test File Organization

Recommended structure:

```
components/
├── ui/
│   └── glass/
│       ├── __tests__/
│       │   ├── GlowButton.test.tsx
│       │   ├── GlassInput.test.tsx
│       │   ├── GlassCard.test.tsx
│       │   └── GradientText.test.tsx
│       ├── GlowButton.tsx
│       └── ...
├── reflection/
│   ├── __tests__/
│   │   ├── ToneBadge.test.tsx
│   │   ├── ToneSelection.test.tsx
│   │   ├── ProgressBar.test.tsx
│   │   └── ReflectionQuestionCard.test.tsx
│   └── ...
└── dashboard/
    └── shared/
        ├── __tests__/
        │   ├── TierBadge.test.tsx
        │   ├── DashboardCard.test.tsx
        │   └── ProgressRing.test.tsx
        └── ...
```

## Key Dependencies for Testing

Components have these dependencies that need mocking consideration:

| Dependency | Used In | Mocking Strategy |
|------------|---------|------------------|
| `framer-motion` | DashboardCard, GlassInput, ProgressBar | Mock or use `@testing-library/react` which handles it |
| `@/lib/utils/constants` (TONES) | ToneSelection | Import actual constants |
| `@/lib/utils` (cn) | All components | Import actual utility |
| `@/lib/utils/haptics` | GlowButton | Mock haptic feedback |
| `@/lib/utils/wordCount` | GlassInput | Import actual utility |
| `navigator.vibrate` | ToneSelection | Mock in test setup |

## Framer Motion Testing Notes

Components using `framer-motion` need consideration:

```typescript
// For components with useReducedMotion()
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    useReducedMotion: () => true, // or false depending on test
  };
});
```

## Coverage Update Recommendation

Update vitest.config.ts coverage to include components:

```typescript
coverage: {
  include: [
    'lib/**/*.ts',
    'server/**/*.ts',
    'types/**/*.ts',
    'components/**/*.tsx', // ADD THIS
  ],
}
```

## Summary of Required Actions

### Installation (Builder Task)

```bash
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### Setup Updates (Builder Task)

1. Add to `vitest.setup.ts`:
   ```typescript
   import '@testing-library/jest-dom/vitest';
   ```

2. Update `vitest.config.ts` coverage include:
   ```typescript
   include: ['lib/**/*.ts', 'server/**/*.ts', 'types/**/*.ts', 'components/**/*.tsx'],
   ```

### Test Creation Priority Order

1. **Wave 1:** ToneBadge, CharacterCounter, GradientText, GlowBadge (pure, no deps)
2. **Wave 2:** GlowButton, TierBadge (simple interactions)
3. **Wave 3:** ProgressBar, GlassInput (animations, complex state)
4. **Wave 4:** ToneSelection, DashboardCard (composite, keyboard)
5. **Wave 5:** ReflectionQuestionCard, EmptyState, ProgressRing

## Questions for Planner

1. Should component tests be in `__tests__` directories alongside components, or in a central `test/components/` directory?
2. What coverage threshold should be targeted for components? (Current thresholds: statements 35%, branches 55%, functions 60%, lines 35%)
3. Should animation testing be included, or should tests always use reduced motion?

