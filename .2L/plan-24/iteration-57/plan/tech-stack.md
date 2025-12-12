# Technology Stack - Component Coverage Expansion

## Testing Framework

**Decision:** Vitest + React Testing Library

**Rationale:**
- Already established as project standard (57+ existing component test files)
- Full TypeScript support with `vi.fn()` and `vi.mock()` patterns
- Compatible with TanStack Query v5 (used by tRPC)
- Fast execution with HMR support

**Versions:**
- Vitest: Current project version
- @testing-library/react: Current project version
- @testing-library/user-event: For advanced interactions

## Mock Infrastructure

### Existing Mocks (Available)

| Mock | Path | Purpose |
|------|------|---------|
| Cookies Mock | `test/mocks/cookies.ts` | Server-side cookie operations |
| Supabase Mock | `test/mocks/supabase.ts` | Auth and database |
| Anthropic Mock | `test/mocks/anthropic.ts` | AI API mocking |
| Haptic Utils | `vitest.setup.ts` | Global haptic feedback |
| Global Fetch | `vitest.setup.ts` | HTTP request mocking |

### Test Helpers (Available)

| Helper | Path | Purpose |
|--------|------|---------|
| `createMockQueryResult` | `test/helpers/trpc.ts` | tRPC query success state |
| `createMockLoadingResult` | `test/helpers/trpc.ts` | tRPC query loading state |
| `createMockErrorResult` | `test/helpers/trpc.ts` | tRPC query error state |
| `createMockMutation` | `test/helpers/trpc.ts` | tRPC mutation mocking |
| `createMockInfiniteQueryResult` | `test/helpers/trpc.ts` | Infinite query mocking |

### Test Factories (Available)

| Factory | Path | Key Exports |
|---------|------|-------------|
| User Factory | `test/factories/user.factory.ts` | `createMockUser`, `freeTierUser`, `proTierUser`, `unlimitedTierUser`, `adminUser`, `demoUser` |
| Dream Factory | `test/factories/dream.factory.ts` | Dream test data |
| Reflection Factory | `test/factories/reflection.factory.ts` | Reflection test data |
| Clarify Factory | `test/factories/clarify.factory.ts` | Clarify session/message data |

### New Mock Required

**PayPal SDK Mock (CRITICAL - Builder-1 must create first)**

**Location:** `test/mocks/paypal-sdk.tsx`

**Purpose:** Mock `@paypal/react-paypal-js` package for PayPalCheckoutModal testing

**Components to Mock:**
- `PayPalScriptProvider` - Context provider (pass-through)
- `PayPalButtons` - Interactive button component with callbacks

## Component Dependencies Map

### CancelSubscriptionModal
- `@/components/ui/glass/GlassModal`
- `@/components/ui/glass/GlowButton`
- `@/contexts/ToastContext` (useToast)
- `@/lib/trpc` (subscriptions.cancel.useMutation)
- `lucide-react` (AlertTriangle)

### PayPalCheckoutModal
- `@paypal/react-paypal-js` (PayPalScriptProvider, PayPalButtons) **NEEDS MOCK**
- `@/components/ui/glass/CosmicLoader`
- `@/components/ui/glass/GlassCard`
- `@/contexts/ToastContext`
- `@/hooks/useAuth`
- `@/lib/trpc` (subscriptions.getPlanId, subscriptions.activateSubscription)
- `@/lib/utils/constants` (TIER_PRICING)

### SubscriptionStatusCard
- `date-fns` (formatDistanceToNow)
- `next/link`
- `./CancelSubscriptionModal`
- `@/components/ui/glass/GlassCard`
- `@/components/ui/glass/GlowBadge`
- `@/components/ui/glass/GlowButton`
- `@/lib/trpc` (subscriptions.getStatus.useQuery)
- `@/lib/utils/constants` (TIER_LIMITS)

### SubscriptionCard
- `next/link`
- `@/components/dashboard/shared/DashboardCard`
- `@/components/dashboard/shared/TierBadge`
- `@/components/ui/glass` (GlowButton)
- `@/hooks/useAuth`

### DashboardGrid
- CSS modules only (no external dependencies)

### WelcomeSection
- CSS modules
- `@/hooks/useAuth`
- `Date` object (for time-based greetings)

### AppNavigation
- `framer-motion` (AnimatePresence)
- `lucide-react` (Menu, X)
- `next/link`
- `next/navigation` (useRouter)
- `./DemoBanner`
- `./MobileNavigationMenu`
- `./UserDropdownMenu`
- `@/components/ui/glass` (GlassCard, GlowButton)
- `@/hooks/useAuth`
- `@/lib/trpc` (auth.signout.useMutation)

### UserDropdownMenu
- `framer-motion` (motion)
- `next/link`
- `@/components/ui/glass` (GlassCard)

### MobileNavigationMenu
- `framer-motion` (motion)
- `next/link`
- `@/lib/utils` (cn)

### NavigationBase
- `next/link`
- `@/components/ui/glass` (GlassCard)
- `@/lib/utils` (cn)

### BottomNavigation
- `framer-motion` (motion, AnimatePresence)
- `lucide-react` icons
- `next/link`
- `next/navigation` (usePathname)
- `@/contexts/NavigationContext` (useNavigation)
- `@/hooks` (useScrollDirection)
- `@/hooks/useAuth`
- `@/lib/utils/haptics` (haptic)

### ClarifyCard
- `date-fns` (formatDistanceToNow)
- `lucide-react` icons
- `next/link`
- `@/components/dashboard/shared/DashboardCard`
- `@/components/ui/glass` (CosmicLoader, GlowButton)
- `@/hooks/useAuth`
- `@/lib/trpc` (clarify.getLimits, clarify.listSessions)
- `@/lib/utils/constants` (CLARIFY_SESSION_LIMITS)

### ReflectionFilters
- `@/lib/utils/dateRange` (DateRangeOption, DATE_RANGE_OPTIONS)
- `@/types/reflection` (ReflectionTone)

### AccountInfoSection
- `date-fns` (formatDistanceToNow)
- `@/types` (User)
- `@/components/ui/glass/GlassCard`
- `@/components/ui/glass/GlassInput`
- `@/components/ui/glass/GlowButton`

### CosmicBackground
- `window.matchMedia` (reduced motion preference)
- CSS animations

## Environment Variables

Tests already have these configured in `vitest.setup.ts`:
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID`: Set for PayPal component tests

## Code Organization

### Test File Location Convention
Test files are placed in `__tests__/` subdirectory adjacent to component:
```
components/
  subscription/
    CancelSubscriptionModal.tsx
    __tests__/
      CancelSubscriptionModal.test.tsx
```

### Import Order Convention
```typescript
// 1. Testing library imports
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// 2. Mocks (BEFORE component imports)
vi.mock('next/navigation', () => ({ ... }));
vi.mock('@/hooks/useAuth', () => ({ ... }));

// 3. Component under test (AFTER mocks)
import { ComponentUnderTest } from '../ComponentUnderTest';

// 4. Types and helpers
import type { User } from '@/types';
import { createMockUser } from '@/test/factories';
import { createMockQueryResult } from '@/test/helpers';
```

## Performance Considerations

- Use `vi.clearAllMocks()` in `beforeEach` to prevent test pollution
- Use `vi.useFakeTimers()` / `vi.useRealTimers()` for time-dependent tests
- Mock heavy dependencies (framer-motion, PayPal SDK) to avoid animation delays
- Keep test data minimal but representative

## Coverage Targets

| Component Category | Target Coverage |
|-------------------|-----------------|
| Subscription Components | 85%+ |
| Dashboard Components | 80%+ |
| Navigation Components | 80%+ |
| Utility Components | 85%+ |
| Overall Iteration | 80%+ average |
