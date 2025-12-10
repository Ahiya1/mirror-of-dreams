# Explorer 1 Report: Dashboard Components Analysis for Testing

## Executive Summary

The dashboard components directory contains 15 components across cards and shared utilities. Currently, only 1 component (TierBadge) has tests out of 15 total (6.7% coverage). The project has a well-established test infrastructure using Vitest, happy-dom, and React Testing Library with comprehensive mock helpers for tRPC. Priority for testing should focus on user-facing card components that fetch data via tRPC, as these have the highest user interaction and complexity.

## Component Inventory

### Card Components (7 total, 0 tested)

| Component | File | Lines | tRPC Queries | Interactions | Complexity |
|-----------|------|-------|--------------|--------------|------------|
| ReflectionsCard | `/components/dashboard/cards/ReflectionsCard.tsx` | 209 | `reflections.list` | Click on items, link navigation | Medium |
| UsageCard | `/components/dashboard/cards/UsageCard.tsx` | 123 | `reflections.checkUsage` | Link navigation | Low |
| DreamsCard | `/components/dashboard/cards/DreamsCard.tsx` | 400 | `dreams.list`, `dreams.getLimits` | Click on dreams, reflect button, link navigation | High |
| EvolutionCard | `/components/dashboard/cards/EvolutionCard.tsx` | 435 | `evolution.list`, `evolution.checkEligibility` | Click report preview, navigation buttons | High |
| ProgressStatsCard | `/components/dashboard/cards/ProgressStatsCard.tsx` | 318 | `reflections.list` | Display only (no interactions) | Low |
| SubscriptionCard | `/components/dashboard/cards/SubscriptionCard.tsx` | 474 | None (uses `useAuth`) | Link navigation | Medium |
| VisualizationCard | `/components/dashboard/cards/VisualizationCard.tsx` | 337 | `visualizations.list` | Click preview, navigation buttons | Medium |

### Shared Components (7 total, 1 tested)

| Component | File | Lines | Dependencies | Interactions | Complexity | Tested |
|-----------|------|-------|--------------|--------------|------------|--------|
| DashboardCard | `/components/dashboard/shared/DashboardCard.tsx` | 198 | framer-motion | Click, hover, ripple effect | Medium | No |
| DashboardGrid | `/components/dashboard/shared/DashboardGrid.tsx` | 27 | CSS modules | None | Low | No |
| WelcomeSection | `/components/dashboard/shared/WelcomeSection.tsx` | 49 | `useAuth` | None | Low | No |
| TierBadge | `/components/dashboard/shared/TierBadge.tsx` | 140 | None (pure component) | None | Low | **Yes** |
| ProgressRing | `/components/dashboard/shared/ProgressRing.tsx` | 217 | None | None (visual only) | Medium | No |
| ReflectionItem | `/components/dashboard/shared/ReflectionItem.tsx` | 174 | Next.js Link | Click, hover, navigation | Medium | No |

### Hero Component (1 total, 0 tested)

| Component | File | Lines | Dependencies | Interactions | Complexity |
|-----------|------|-------|--------------|--------------|------------|
| DashboardHero | `/components/dashboard/DashboardHero.tsx` | 243 | `useAuth`, `trpc.dreams.list`, Next.js router | Click CTA, link navigation | Medium |

## Current Test Coverage

### Tested Component: TierBadge
- **File:** `/components/dashboard/shared/__tests__/TierBadge.test.tsx`
- **Test Count:** 30 tests across 8 describe blocks
- **Categories Tested:**
  - Rendering (3 tests)
  - Tiers (7 tests for all tier variants)
  - Sizes (4 tests: sm, md, lg, xl)
  - Icons (5 tests)
  - Glow effect (4 tests)
  - Custom className (2 tests)
  - Styling (4 tests)
  - Animation prop (2 tests)

### Coverage Gap Analysis
- **Cards:** 0/7 tested (0%)
- **Shared:** 1/7 tested (14.3%)
- **Hero:** 0/1 tested (0%)
- **Overall:** 1/15 tested (6.7%)

## Priority Components for Testing

### Priority 1: High Impact, High Complexity

1. **DreamsCard** (Highest Priority)
   - Uses 2 tRPC queries
   - Complex conditional rendering (empty, loading, data states)
   - User interactions (reflect button, dream links)
   - Category emoji mapping logic
   - Days left calculation and display

2. **EvolutionCard**
   - Uses 2 tRPC queries
   - Report preview with markdown rendering
   - Eligibility status handling
   - Progress bar display
   - Multiple button actions based on state

3. **DashboardCard** (Foundation Component)
   - Used by ALL card components
   - Click handling with ripple effect
   - Loading/error overlay states
   - framer-motion animations

### Priority 2: Medium Impact

4. **ReflectionsCard**
   - tRPC query for reflections
   - Empty state rendering
   - Uses ReflectionItem sub-component

5. **VisualizationCard**
   - tRPC query for visualizations
   - Preview card with click handling
   - Style icons mapping

6. **ReflectionItem**
   - Link navigation
   - Time formatting logic
   - Tone display
   - Hover state

### Priority 3: Lower Complexity

7. **DashboardHero**
   - Time-based greeting
   - CTA button disabled state
   - Link for empty state

8. **UsageCard**
   - Simple usage display
   - Unlimited tier handling

9. **SubscriptionCard**
   - Tier benefits display
   - Upgrade path logic
   - Uses TierBadge (already tested)

10. **ProgressStatsCard**
    - Monthly stats calculation
    - Motivational message display

### Priority 4: Low Complexity (Can Skip or Quick Tests)

11. **WelcomeSection** - Simple greeting display
12. **DashboardGrid** - CSS layout only
13. **ProgressRing** - Visual animation only

## Test Cases Required

### DreamsCard Test Cases

```markdown
## DreamsCard.test.tsx

### Rendering
- [ ] Renders card with title "Active Dreams"
- [ ] Renders "View All" header action link to /dreams
- [ ] Shows loading state with CosmicLoader when isLoading
- [ ] Shows error state when hasError

### Empty State
- [ ] Renders empty state message when no dreams
- [ ] Renders "Create Your First Dream" CTA button
- [ ] CTA links to /dreams

### With Dreams Data
- [ ] Renders up to 3 dreams
- [ ] Displays dream title for each dream
- [ ] Shows correct category emoji for each category type
- [ ] Shows "Reflect" button for each dream
- [ ] Shows reflection count for each dream

### Days Left Display
- [ ] Shows "Xd left" for positive daysLeft
- [ ] Shows "Today!" for daysLeft === 0
- [ ] Shows "Xd overdue" for negative daysLeft
- [ ] Shows different colors based on urgency (overdue, soon, normal)

### Dream Limits
- [ ] Shows dream limit indicator "X / Y dreams"
- [ ] Shows infinity symbol for unlimited tier

### Interactions
- [ ] Click on dream links to /dreams/{id}
- [ ] Click on "Reflect" button navigates to /reflection?dreamId={id}
- [ ] Hover state changes dream item background
```

### EvolutionCard Test Cases

```markdown
## EvolutionCard.test.tsx

### Rendering
- [ ] Renders card with title "Evolution Insights"
- [ ] Shows loading state when isLoading

### With Reports
- [ ] Renders report preview card when has reports
- [ ] Shows "Latest Report" label
- [ ] Shows report date formatted (month, day)
- [ ] Shows evolution preview text (max 200 chars)
- [ ] Shows reflection count meta
- [ ] Shows dream title meta if available
- [ ] Shows "View all reports" link
- [ ] Shows "View Reports" button

### Without Reports - Eligible
- [ ] Shows "Ready to Generate" status
- [ ] Shows eligibility message
- [ ] Shows "Generate Report" button

### Without Reports - Not Eligible
- [ ] Shows "Keep Reflecting" status
- [ ] Shows reason from eligibility data
- [ ] Shows progress bar toward first report
- [ ] Shows "Create Reflections" button

### Interactions
- [ ] Click report preview navigates to /evolution/{id}
- [ ] Click "View all reports" navigates to /evolution
- [ ] Click action buttons navigate correctly
```

### DashboardCard Test Cases

```markdown
## DashboardCard.test.tsx

### Rendering
- [ ] Renders children content
- [ ] Applies base dashboard-card class
- [ ] Applies variant class (default, premium, creator)
- [ ] Applies custom className

### Loading State
- [ ] Shows loading overlay when isLoading
- [ ] Shows spinner in loading overlay

### Error State
- [ ] Shows error overlay when hasError
- [ ] Shows error icon and message

### Hover Behavior
- [ ] Adds hovered class on mouseenter
- [ ] Removes hovered class on mouseleave
- [ ] Does not add hovered class when hoverable=false

### Click Behavior
- [ ] Adds clickable class when onClick provided
- [ ] Calls onClick handler when clicked
- [ ] Creates ripple effect on click
- [ ] Applies card press animation (framer-motion)

### Animation
- [ ] Applies animation delay
- [ ] Respects prefers-reduced-motion

### Sub-components
- [ ] CardHeader renders with correct class
- [ ] CardTitle renders with icon and text
- [ ] CardContent renders with inner class
- [ ] CardActions renders with correct class
- [ ] HeaderAction renders as button or link
```

### ReflectionItem Test Cases

```markdown
## ReflectionItem.test.tsx

### Rendering
- [ ] Renders as a Link to /reflections/{id}
- [ ] Displays dream title (from joined dreams or reflection title)
- [ ] Shows "Reflection" as fallback title
- [ ] Displays preview text (max 120 chars)
- [ ] Shows time ago format

### Time Formatting
- [ ] Shows "just now" for <1 min
- [ ] Shows "Xm ago" for minutes
- [ ] Shows "Xh ago" for hours
- [ ] Shows "Xd ago" for days
- [ ] Shows formatted date for >7 days

### Tone Badge
- [ ] Displays tone name (Gentle, Intense, Fusion)
- [ ] Falls back to "Fusion" for unknown tones

### Premium Badge
- [ ] Shows "Premium" badge when is_premium=true
- [ ] Hides premium badge when is_premium=false

### Interactions
- [ ] Calls onClick when provided
- [ ] Shows hover indicator arrow on hover

### Memoization
- [ ] Uses areReflectionItemPropsEqual comparator
- [ ] Re-renders only when relevant props change
```

## Mocking Requirements

### tRPC Mocking Pattern

Based on existing tests, mock tRPC using this pattern:

```typescript
// Mock the tRPC module
vi.mock('@/lib/trpc', () => ({
  trpc: {
    dreams: {
      list: {
        useQuery: vi.fn(),
      },
      getLimits: {
        useQuery: vi.fn(),
      },
    },
    reflections: {
      list: {
        useQuery: vi.fn(),
      },
      checkUsage: {
        useQuery: vi.fn(),
      },
    },
    evolution: {
      list: {
        useQuery: vi.fn(),
      },
      checkEligibility: {
        useQuery: vi.fn(),
      },
    },
    visualizations: {
      list: {
        useQuery: vi.fn(),
      },
    },
  },
}));

// In tests, use the helper functions:
import { createMockQueryResult, createMockLoadingResult, createMockErrorResult } from '@/test/helpers';
import { trpc } from '@/lib/trpc';

vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
  createMockQueryResult([
    { id: 'dream-1', title: 'Test Dream', category: 'creative', daysLeft: 30 },
  ])
);
```

### useAuth Mocking Pattern

```typescript
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: 'user-1',
      name: 'Test User',
      tier: 'free' as const,
      subscriptionStatus: 'active' as const,
    },
    isLoading: false,
  })),
}));
```

### Next.js Router Mocking Pattern

```typescript
const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: vi.fn(),
  }),
}));
```

### Framer Motion Mocking Pattern

```typescript
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: React.PropsWithChildren<{ className?: string }>) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
  useReducedMotion: vi.fn(() => false),
}));
```

### Glass UI Components Mocking Pattern

```typescript
vi.mock('@/components/ui/glass', () => ({
  GlassCard: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div className={className}>{children}</div>
  ),
  GlowButton: ({ 
    children, 
    onClick, 
    disabled, 
    className,
    variant 
  }: React.PropsWithChildren<{
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    variant?: string;
  }>) => (
    <button onClick={onClick} disabled={disabled} className={className} data-variant={variant}>
      {children}
    </button>
  ),
  CosmicLoader: ({ label }: { label?: string }) => <div data-testid="loader">{label}</div>,
}));
```

### Test Data Factories

Create factory functions for consistent test data:

```typescript
// test/factories/dashboard.ts

export const createMockDream = (overrides = {}) => ({
  id: 'dream-1',
  title: 'Test Dream',
  description: 'Dream description',
  category: 'creative' as const,
  daysLeft: 30,
  targetDate: '2025-02-01',
  reflectionCount: 5,
  ...overrides,
});

export const createMockReflection = (overrides = {}) => ({
  id: 'reflection-1',
  title: 'Test Reflection',
  dreams: { title: 'Test Dream' },
  content: 'Reflection content preview text...',
  created_at: new Date().toISOString(),
  tone: 'fusion' as const,
  is_premium: false,
  ...overrides,
});

export const createMockEvolutionReport = (overrides = {}) => ({
  id: 'report-1',
  evolution: 'Your growth insights...',
  reflection_count: 4,
  created_at: new Date().toISOString(),
  dreams: { title: 'Test Dream' },
  ...overrides,
});

export const createMockVisualization = (overrides = {}) => ({
  id: 'viz-1',
  narrative: 'Visualization narrative...',
  style: 'synthesis' as const,
  reflection_count: 3,
  created_at: new Date().toISOString(),
  dreams: { title: 'Test Dream' },
  ...overrides,
});
```

## Test File Structure

```
components/dashboard/
  cards/
    __tests__/
      DreamsCard.test.tsx         (Priority 1)
      EvolutionCard.test.tsx      (Priority 1)
      ReflectionsCard.test.tsx    (Priority 2)
      VisualizationCard.test.tsx  (Priority 2)
      UsageCard.test.tsx          (Priority 3)
      SubscriptionCard.test.tsx   (Priority 3)
      ProgressStatsCard.test.tsx  (Priority 3)
  shared/
    __tests__/
      TierBadge.test.tsx          (EXISTS)
      DashboardCard.test.tsx      (Priority 1)
      ReflectionItem.test.tsx     (Priority 2)
      ProgressRing.test.tsx       (Priority 4)
      WelcomeSection.test.tsx     (Priority 4)
      DashboardGrid.test.tsx      (Priority 4)
  __tests__/
    DashboardHero.test.tsx        (Priority 3)
```

## Recommendations for Builder

1. **Start with DashboardCard tests** - This is the foundation component used by all cards. Testing it first ensures the base functionality is verified.

2. **Follow the mocking patterns** from existing tests in `DreamSelectionView.test.tsx` - it demonstrates proper mocking of Next.js router, framer-motion, and UI components.

3. **Use the test helper utilities** from `@/test/helpers` - they provide ready-to-use mock result factories for tRPC queries.

4. **Test loading and error states first** - These are quick wins that catch common regressions.

5. **Focus on user interactions** - Click handlers, navigation, and conditional rendering based on data state.

6. **Skip animation testing** - Per reduced-motion patterns in the codebase, animations are intentionally skipped when `prefersReducedMotion` is true.

7. **Estimated effort:**
   - DashboardCard: 2 hours
   - DreamsCard: 3 hours
   - EvolutionCard: 3 hours
   - ReflectionsCard: 1.5 hours
   - Other cards: 1-1.5 hours each
   - Total: ~15-18 hours for full coverage

## Resource Map

### Critical Files
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/` - All dashboard components
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/helpers/` - Test utilities
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/vitest.config.ts` - Test configuration
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/vitest.setup.ts` - Global test setup

### Existing Test Patterns
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/shared/__tests__/TierBadge.test.tsx`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/views/__tests__/DreamSelectionView.test.tsx`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/ui/glass/__tests__/GlowButton.test.tsx`

### Key Dependencies
- `vitest` - Test runner
- `@testing-library/react` - React testing utilities
- `@testing-library/jest-dom/vitest` - DOM assertions
- `happy-dom` - DOM environment
