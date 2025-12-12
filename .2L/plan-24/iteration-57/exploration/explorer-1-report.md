# Explorer 1 Report: Component Structure Analysis for Test Coverage Expansion

## Executive Summary

This report analyzes 19 target components for Iteration 57 (Plan 24 - Component Coverage Expansion). Of the originally specified components, 16 exist and 3 (NotificationsSection, ProfileInfoSection, TimezoneSection) do not exist in the codebase. The BottomSheet component already has comprehensive tests (529 lines, 77 tests). The analysis reveals clear patterns for mocking dependencies (tRPC, Next.js navigation, Framer Motion, PayPal SDK) and identifies the PayPalCheckoutModal as the most complex component requiring a dedicated PayPal SDK mock.

---

## Component Inventory

| Component | Path | Has Tests | Lines | Complexity | Priority |
|-----------|------|-----------|-------|------------|----------|
| CancelSubscriptionModal | `/components/subscription/CancelSubscriptionModal.tsx` | No | 145 | Medium | P0 |
| PayPalCheckoutModal | `/components/subscription/PayPalCheckoutModal.tsx` | No | 178 | High | P0 |
| SubscriptionStatusCard | `/components/subscription/SubscriptionStatusCard.tsx` | No | 155 | Medium | P0 |
| SubscriptionCard | `/components/dashboard/cards/SubscriptionCard.tsx` | No | 473 | Medium | P1 |
| DashboardGrid | `/components/dashboard/shared/DashboardGrid.tsx` | No | 26 | Low | P1 |
| WelcomeSection | `/components/dashboard/shared/WelcomeSection.tsx` | No | 48 | Low | P1 |
| AppNavigation | `/components/shared/AppNavigation.tsx` | No | 352 | High | P1 |
| UserDropdownMenu | `/components/shared/UserDropdownMenu.tsx` | No | 88 | Low | P1 |
| MobileNavigationMenu | `/components/shared/MobileNavigationMenu.tsx` | No | 126 | Medium | P1 |
| CosmicBackground | `/components/shared/CosmicBackground.tsx` | No | 158 | Medium | P2 |
| NavigationBase | `/components/shared/NavigationBase.tsx` | No | 64 | Low | P1 |
| ClarifyCard | `/components/clarify/ClarifyCard.tsx` | No | 237 | Medium | P1 |
| ReflectionFilters | `/components/reflections/ReflectionFilters.tsx` | No | 303 | Medium | P1 |
| BottomNavigation | `/components/navigation/BottomNavigation.tsx` | No | 190 | Medium | P1 |
| AccountInfoSection | `/components/profile/AccountInfoSection.tsx` | No | 144 | Medium | P1 |
| BottomSheet | `/components/ui/mobile/BottomSheet.tsx` | **Yes** (529 lines) | 234 | High | Done |
| NotificationsSection | N/A | N/A | N/A | N/A | Skip |
| ProfileInfoSection | N/A | N/A | N/A | N/A | Skip |
| TimezoneSection | N/A | N/A | N/A | N/A | Skip |

**Total components needing tests: 15**
**Total estimated lines of test code: ~2,500-3,000 lines**
**Estimated test count: ~200-230 tests**

---

## Components Needing Tests

### 1. CancelSubscriptionModal

**Path:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/subscription/CancelSubscriptionModal.tsx`

**Dependencies:**
- `@/components/ui/glass/GlassModal`
- `@/components/ui/glass/GlowButton`
- `@/contexts/ToastContext` (useToast)
- `@/lib/trpc` (trpc.subscriptions.cancel.useMutation)
- `lucide-react` (AlertTriangle icon)
- React useState

**Mock requirements:**
```typescript
// Mock GlassModal
vi.mock('@/components/ui/glass/GlassModal', () => ({
  GlassModal: ({ isOpen, onClose, title, children }) => isOpen ? <div role="dialog">{children}</div> : null
}));

// Mock tRPC
vi.mock('@/lib/trpc', () => ({
  trpc: {
    subscriptions: {
      cancel: {
        useMutation: () => ({
          mutate: vi.fn(),
          isPending: false
        })
      }
    }
  }
}));

// Mock ToastContext
vi.mock('@/contexts/ToastContext', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn()
  })
}));
```

**Test approach:**
- Test visibility based on `isOpen` prop
- Test tier-specific loss lists (pro vs unlimited)
- Test confirmation checkbox behavior
- Test cancel mutation trigger with confirmation
- Test error handling when mutation fails
- Test close behavior during pending state
- Test date formatting for expiry

**Estimated tests:** 15-20

---

### 2. PayPalCheckoutModal (HIGH COMPLEXITY)

**Path:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/subscription/PayPalCheckoutModal.tsx`

**Dependencies:**
- `@paypal/react-paypal-js` (PayPalScriptProvider, PayPalButtons)
- `@/components/ui/glass/CosmicLoader`
- `@/components/ui/glass/GlassCard`
- `@/contexts/ToastContext`
- `@/hooks/useAuth`
- `@/lib/trpc` (subscriptions.getPlanId, subscriptions.activateSubscription)
- `@/lib/utils/constants` (TIER_PRICING)
- `lucide-react` (X icon)
- React useState, useCallback
- process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID

**Mock requirements (CRITICAL - Need dedicated mock file):**

Create `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/mocks/paypal-sdk.tsx`:
```typescript
import React from 'react';

export const PayPalScriptProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export const PayPalButtons = ({
  createSubscription,
  onApprove,
  onError,
  onCancel,
  style
}: {
  createSubscription: () => Promise<string>;
  onApprove: (data: { subscriptionID?: string }) => void;
  onError: (err: any) => void;
  onCancel: () => void;
  style?: any;
}) => (
  <div data-testid="paypal-buttons" data-style={JSON.stringify(style)}>
    <button onClick={() => createSubscription().then(id => onApprove({ subscriptionID: id }))}>
      Mock PayPal Subscribe
    </button>
    <button onClick={() => onError({ message: 'Test error' })}>
      Trigger Error
    </button>
    <button onClick={onCancel}>
      Cancel
    </button>
  </div>
);
```

**Test approach:**
- Test non-rendering when `isOpen` is false
- Test loading state when plan data is loading
- Test error state when plan query fails
- Test PayPal buttons render when data loaded
- Test approval flow calls activateSubscription
- Test error handling in PayPal error callback
- Test cancel callback shows toast
- Test close button disabled during activation
- Test price display for monthly/yearly periods
- Test tier name capitalization

**Estimated tests:** 25-30 (most complex component)

---

### 3. SubscriptionStatusCard

**Path:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/subscription/SubscriptionStatusCard.tsx`

**Dependencies:**
- `date-fns` (formatDistanceToNow)
- `next/link`
- `./CancelSubscriptionModal`
- `@/components/ui/glass/GlassCard`
- `@/components/ui/glass/GlowBadge`
- `@/components/ui/glass/GlowButton`
- `@/lib/trpc` (subscriptions.getStatus.useQuery)
- `@/lib/utils/constants` (TIER_LIMITS)
- React useState

**Mock requirements:**
```typescript
vi.mock('@/lib/trpc', () => ({
  trpc: {
    subscriptions: {
      getStatus: {
        useQuery: () => mockUseQuery()
      }
    }
  }
}));

vi.mock('./CancelSubscriptionModal', () => ({
  CancelSubscriptionModal: ({ isOpen, onClose }) => 
    isOpen ? <div data-testid="cancel-modal"><button onClick={onClose}>Close</button></div> : null
}));
```

**Test approach:**
- Test loading skeleton state
- Test null return when no subscription
- Test free tier display (Upgrade button)
- Test paid tier display with status badge
- Test billing period display
- Test next billing date with relative time
- Test cancellation notice styling
- Test cancel modal trigger for paid users
- Test modal close and refetch behavior

**Estimated tests:** 20-25

---

### 4. SubscriptionCard

**Path:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/cards/SubscriptionCard.tsx`

**Dependencies:**
- `next/link`
- `@/components/dashboard/shared/DashboardCard` (+ CardHeader, CardTitle, CardContent, CardActions)
- `@/components/dashboard/shared/TierBadge`
- `@/components/ui/glass` (GlowButton)
- `@/hooks/useAuth`
- React

**Mock requirements:**
```typescript
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser })
}));

vi.mock('@/components/dashboard/shared/DashboardCard', () => ({
  default: ({ children, className, isLoading, animated }) => (
    <div data-testid="dashboard-card" className={className} data-loading={isLoading}>{children}</div>
  ),
  CardHeader: ({ children }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }) => <h3 data-testid="card-title">{children}</h3>,
  CardContent: ({ children }) => <div data-testid="card-content">{children}</div>,
  CardActions: ({ children }) => <div data-testid="card-actions">{children}</div>
}));

vi.mock('@/components/dashboard/shared/TierBadge', () => ({
  default: ({ tier, size }) => <span data-testid="tier-badge" data-tier={tier} data-size={size}>{tier}</span>
}));
```

**Test approach:**
- Test tier badge for free/pro/unlimited tiers
- Test benefits list for each tier
- Test upgrade preview section visibility
- Test action button text per tier
- Test action button links
- Test animation props
- Test JSX styles application

**Estimated tests:** 15-20

---

### 5. DashboardGrid (LOW COMPLEXITY)

**Path:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/shared/DashboardGrid.tsx`

**Dependencies:**
- `./DashboardGrid.module.css`
- React

**Mock requirements:** CSS modules mock only

**Test approach:**
- Test renders children
- Test applies custom className
- Test applies grid class from module
- Test isLoading prop (if used)

**Estimated tests:** 5-8

---

### 6. WelcomeSection (LOW COMPLEXITY)

**Path:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/shared/WelcomeSection.tsx`

**Dependencies:**
- `./WelcomeSection.module.css`
- `@/hooks/useAuth`

**Mock requirements:**
```typescript
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { name: 'John Doe' } })
}));
```

**Test approach:**
- Test morning greeting (5-11am)
- Test afternoon greeting (12-16pm)
- Test evening greeting (17-21pm)
- Test night greeting (22-4am)
- Test first name extraction from full name
- Test fallback to 'there' when no name
- Test applies custom className

**Estimated tests:** 10-12 (need to mock Date for time-based tests)

---

### 7. AppNavigation (HIGH COMPLEXITY)

**Path:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/shared/AppNavigation.tsx`

**Dependencies:**
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
- `@/lib/utils` (cn)
- React (useState, useRef, useEffect, useCallback)

**Mock requirements:**
```typescript
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() })
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser })
}));

vi.mock('@/lib/trpc', () => ({
  trpc: {
    auth: {
      signout: {
        useMutation: () => ({ mutateAsync: vi.fn() })
      }
    }
  }
}));

vi.mock('./DemoBanner', () => ({
  DemoBanner: () => <div data-testid="demo-banner" />
}));

vi.mock('./UserDropdownMenu', () => ({
  UserDropdownMenu: ({ user, onSignOut, onClose }) => (
    <div data-testid="user-dropdown">
      <button onClick={onSignOut}>Sign Out</button>
      <button onClick={onClose}>Close</button>
    </div>
  )
}));

vi.mock('./MobileNavigationMenu', () => ({
  MobileNavigationMenu: ({ isOpen, onClose }) => 
    isOpen ? <nav data-testid="mobile-menu"><button onClick={onClose}>Close</button></nav> : null
}));

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: { div: ({ children, ...props }) => <div {...props}>{children}</div> }
}));
```

**Test approach:**
- Test logo link to dashboard
- Test desktop nav links render correctly
- Test active page highlighting for each currentPage value
- Test clarify link visibility based on user tier
- Test admin link visibility based on user role
- Test upgrade button for free users
- Test refresh button when onRefresh provided
- Test user dropdown toggle behavior
- Test keyboard navigation (Enter, Space, Escape)
- Test mobile menu button visibility at tablet breakpoint
- Test signout mutation call
- Test document click outside closes dropdown

**Estimated tests:** 25-30

---

### 8. UserDropdownMenu (LOW COMPLEXITY)

**Path:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/shared/UserDropdownMenu.tsx`

**Dependencies:**
- `framer-motion` (motion)
- `next/link`
- `@/components/ui/glass` (GlassCard)

**Mock requirements:**
```typescript
vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...props }) => <div {...props}>{children}</div> }
}));
```

**Test approach:**
- Test renders user name and email
- Test fallback values for missing name/email
- Test profile link
- Test settings link
- Test upgrade link visibility when not unlimited tier
- Test help link
- Test sign out button triggers callback
- Test sign out button styling

**Estimated tests:** 12-15

---

### 9. MobileNavigationMenu

**Path:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/shared/MobileNavigationMenu.tsx`

**Dependencies:**
- `framer-motion` (motion)
- `next/link`
- `@/lib/utils` (cn)

**Mock requirements:**
```typescript
vi.mock('framer-motion', () => ({
  motion: { nav: ({ children, className }) => <nav className={className}>{children}</nav> }
}));
```

**Test approach:**
- Test all navigation links render
- Test active link styling for each currentPage
- Test inactive link styling
- Test clarify link visibility based on user tier
- Test admin link visibility based on user role
- Test motion animation props

**Estimated tests:** 12-15

---

### 10. CosmicBackground

**Path:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/shared/CosmicBackground.tsx`

**Dependencies:**
- React (useEffect, useState)
- window.matchMedia (reduced motion preference)

**Mock requirements:**
```typescript
// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }))
});
```

**Test approach:**
- Test default rendering with animation
- Test animation disabled when prefersReducedMotion
- Test intensity prop affects opacity/styles
- Test className prop applied
- Test aria-hidden attribute
- Test cosmic layers render conditionally

**Estimated tests:** 10-12

---

### 11. NavigationBase (LOW COMPLEXITY)

**Path:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/shared/NavigationBase.tsx`

**Dependencies:**
- `next/link`
- `@/components/ui/glass` (GlassCard)
- `@/lib/utils` (cn)
- React

**Mock requirements:**
```typescript
vi.mock('@/components/ui/glass', () => ({
  GlassCard: ({ children, elevated, className }) => (
    <div data-testid="glass-card" data-elevated={elevated} className={className}>{children}</div>
  )
}));
```

**Test approach:**
- Test renders children
- Test logo link uses homeHref prop
- Test transparent mode styling
- Test custom className applied
- Test default homeHref is '/'
- Test elevated prop passed to GlassCard

**Estimated tests:** 8-10

---

### 12. ClarifyCard

**Path:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/clarify/ClarifyCard.tsx`

**Dependencies:**
- `date-fns` (formatDistanceToNow)
- `lucide-react` (MessageCircle, Sparkles)
- `next/link`
- `@/components/dashboard/shared/DashboardCard` (+ subcomponents)
- `@/components/ui/glass` (CosmicLoader, GlowButton)
- `@/hooks/useAuth`
- `@/lib/trpc` (clarify.getLimits, clarify.listSessions)
- `@/lib/utils/constants` (CLARIFY_SESSION_LIMITS)
- React

**Mock requirements:**
```typescript
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser })
}));

vi.mock('@/lib/trpc', () => ({
  trpc: {
    clarify: {
      getLimits: { useQuery: () => mockLimitsQuery() },
      listSessions: { useQuery: () => mockSessionsQuery() }
    }
  }
}));

vi.mock('@/lib/utils/constants', () => ({
  CLARIFY_SESSION_LIMITS: { free: 0, pro: 5, unlimited: 10 }
}));
```

**Test approach:**
- Test returns null for free tier user
- Test returns null when user is null
- Test shows for pro tier user
- Test shows for unlimited tier user
- Test shows for creator/admin users
- Test loading state
- Test empty state with CTA
- Test sessions list rendering
- Test usage bar calculation
- Test session link navigation
- Test relative time formatting

**Estimated tests:** 18-22

---

### 13. ReflectionFilters

**Path:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflections/ReflectionFilters.tsx`

**Dependencies:**
- `@/lib/utils/dateRange` (DateRangeOption, DATE_RANGE_OPTIONS)
- `@/types/reflection` (ReflectionTone)
- React useState

**Mock requirements:**
```typescript
vi.mock('@/lib/utils/dateRange', () => ({
  DATE_RANGE_OPTIONS: [
    { value: 'all', label: 'All Time' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' }
  ]
}));
```

**Test approach:**
- Test search input renders and updates
- Test search clear button
- Test filter toggle button
- Test active filters indicator dot
- Test sort by dropdown options
- Test sort order toggle
- Test clear all button visibility
- Test expanded filter panel
- Test date range buttons
- Test tone filter buttons (All, Gentle, Intense, Fusion)
- Test premium filter buttons
- Test callback invocations

**Estimated tests:** 20-25

---

### 14. BottomNavigation

**Path:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/navigation/BottomNavigation.tsx`

**Dependencies:**
- `framer-motion` (motion, AnimatePresence)
- `lucide-react` (Home, Sparkles, Layers, TrendingUp, User, MessageSquare)
- `next/link`
- `next/navigation` (usePathname)
- `@/contexts/NavigationContext` (useNavigation)
- `@/hooks` (useScrollDirection)
- `@/hooks/useAuth`
- `@/lib/animations/variants` (bottomNavVariants)
- `@/lib/utils` (cn)
- `@/lib/utils/haptics` (haptic)

**Mock requirements:**
```typescript
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname
}));

vi.mock('@/contexts/NavigationContext', () => ({
  useNavigation: () => ({ showBottomNav: true })
}));

vi.mock('@/hooks', () => ({
  useScrollDirection: () => mockScrollDirection
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser })
}));

vi.mock('@/lib/utils/haptics', () => ({
  haptic: vi.fn()
}));

vi.mock('framer-motion', () => ({
  motion: { nav: ({ children, className }) => <nav className={className}>{children}</nav> },
  AnimatePresence: ({ children }) => <>{children}</>
}));
```

**Test approach:**
- Test renders when visible
- Test hides when scroll direction is down
- Test hides when showBottomNav is false
- Test all base nav items render
- Test clarify tab shows for paid users only
- Test active tab styling
- Test haptic feedback on click
- Test exact match for dashboard, prefix match for others
- Test aria attributes

**Estimated tests:** 18-22

---

### 15. AccountInfoSection

**Path:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/profile/AccountInfoSection.tsx`

**Dependencies:**
- `date-fns` (formatDistanceToNow)
- `@/types` (User)
- `@/components/ui/glass/GlassCard`
- `@/components/ui/glass/GlassInput`
- `@/components/ui/glass/GlowButton`

**Mock requirements:**
```typescript
vi.mock('@/components/ui/glass/GlassCard', () => ({
  GlassCard: ({ children, elevated }) => <div data-testid="glass-card">{children}</div>
}));

vi.mock('@/components/ui/glass/GlassInput', () => ({
  GlassInput: ({ value, onChange, placeholder, type, showPasswordToggle }) => (
    <input 
      type={type || 'text'}
      value={value} 
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      data-password-toggle={showPasswordToggle}
    />
  )
}));

vi.mock('@/components/ui/glass/GlowButton', () => ({
  GlowButton: ({ children, onClick, disabled, variant }) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant}>{children}</button>
  )
}));
```

**Test approach:**
- Test displays user name
- Test displays user email
- Test displays member since date
- Test edit name mode toggle
- Test edit name input
- Test save name callback
- Test cancel name editing
- Test edit email mode toggle
- Test new email input
- Test password input for email change
- Test change email callback
- Test cancel email editing
- Test disabled state for demo users
- Test saving/loading states

**Estimated tests:** 18-22

---

## Already Tested Components

### BottomSheet

**Path:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/ui/mobile/BottomSheet.tsx`
**Test Path:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/ui/mobile/__tests__/BottomSheet.test.tsx`

This component has comprehensive tests (529 lines, 77 tests covering):
- Visibility states
- Height modes (auto, half, full)
- Title rendering
- Drag handle
- Dismiss behaviors (backdrop click, Escape key)
- Backdrop styling
- Accessibility (dialog role, aria-modal, focus lock)
- Glass morphism styling
- Content area
- Safe area support
- Custom styling
- Touch handling
- Motion value integration

**Recommendation:** No additional tests needed for BottomSheet.

---

## Components Not Found

The following components specified in the master plan do not exist in the codebase:

1. **NotificationsSection** - Not found at `/components/profile/NotificationsSection.tsx`
2. **ProfileInfoSection** - Not found at `/components/profile/ProfileInfoSection.tsx`
3. **TimezoneSection** - Not found at `/components/profile/TimezoneSection.tsx`
4. **MobileBottomSheet** - Appears to be BottomSheet (already tested)
5. **ReflectionPageRenderer** - Not found

**Recommendation:** Remove these from the iteration scope or verify if they exist under different names. The AccountInfoSection exists and was analyzed instead.

---

## Existing Test Patterns

### Pattern 1: Dependency Mocking (vi.mock at top of file)

From `UpgradeModal.test.tsx`:
```typescript
vi.mock('@/components/ui/glass/GlassModal', () => ({
  GlassModal: ({ isOpen, onClose, title, children }) =>
    isOpen ? <div data-testid="glass-modal" role="dialog">{title}{children}</div> : null,
}));
```

### Pattern 2: tRPC Hook Mocking

From `UsageCard.test.tsx`:
```typescript
const mockUseQuery = vi.fn();
vi.mock('@/lib/trpc', () => ({
  trpc: {
    reflections: {
      checkUsage: {
        useQuery: () => mockUseQuery(),
      },
    },
  },
}));
```

### Pattern 3: Next.js Navigation Mocking

From `LandingNavigation.test.tsx`:
```typescript
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));
```

### Pattern 4: Framer Motion Mocking

From `BottomSheet.test.tsx`:
```typescript
vi.mock('framer-motion', async () => {
  const MotionDiv = React.forwardRef(({ children, className, onClick }, ref) => (
    <div ref={ref} className={className} onClick={onClick}>{children}</div>
  ));
  return {
    motion: { div: MotionDiv },
    AnimatePresence: ({ children }) => <>{children}</>,
    useMotionValue: () => mockMotionValue,
    animate: vi.fn(),
  };
});
```

### Pattern 5: Test Organization

Tests are organized with `describe` blocks for:
- `rendering` - Basic render tests
- `visibility` - Conditional rendering
- `props` - Prop handling
- `events/interactions` - Click handlers, etc.
- `accessibility` - ARIA attributes
- `edge cases` - Null/undefined handling

### Pattern 6: Data-testid Usage

Used sparingly for non-semantic elements:
```typescript
<div data-testid="dashboard-card" />
```

Prefer semantic queries:
```typescript
screen.getByRole('dialog');
screen.getByText('Submit');
screen.getByLabelText('Email');
```

---

## Recommendations

### 1. Create PayPal SDK Mock First (Blocker)

Before testing PayPalCheckoutModal, create:
`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/mocks/paypal-sdk.tsx`

This mock should export:
- `PayPalScriptProvider` - Pass-through wrapper
- `PayPalButtons` - Testable button interface with callbacks

### 2. Prioritize by Complexity

**Start with Low Complexity (warm-up):**
1. DashboardGrid (5-8 tests)
2. NavigationBase (8-10 tests)
3. UserDropdownMenu (12-15 tests)
4. WelcomeSection (10-12 tests)

**Then Medium Complexity:**
5. CancelSubscriptionModal (15-20 tests)
6. SubscriptionStatusCard (20-25 tests)
7. MobileNavigationMenu (12-15 tests)
8. CosmicBackground (10-12 tests)
9. ClarifyCard (18-22 tests)
10. ReflectionFilters (20-25 tests)
11. BottomNavigation (18-22 tests)
12. AccountInfoSection (18-22 tests)
13. SubscriptionCard (15-20 tests)

**Finally High Complexity:**
14. AppNavigation (25-30 tests)
15. PayPalCheckoutModal (25-30 tests) - AFTER PayPal mock created

### 3. Create Shared Mock Utilities

Create `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/mocks/common.tsx`:
```typescript
// Re-usable mocks for common dependencies
export const mockUseAuth = (user = null) => ({
  useAuth: () => ({ user })
});

export const mockUseRouter = () => ({
  useRouter: () => ({ push: vi.fn() })
});

export const mockFramerMotion = () => ({
  motion: { div: ({ children, ...p }) => <div {...p}>{children}</div> },
  AnimatePresence: ({ children }) => <>{children}</>
});
```

### 4. Time-based Test Utilities

For WelcomeSection's time-based greetings:
```typescript
const mockDate = (hour: number) => {
  vi.setSystemTime(new Date(2024, 0, 1, hour, 0, 0));
};
```

### 5. Skip Non-Existent Components

Update iteration scope to exclude:
- NotificationsSection
- ProfileInfoSection
- TimezoneSection
- MobileBottomSheet (use BottomSheet - already tested)
- ReflectionPageRenderer

### 6. Builder Task Distribution

Suggest splitting into 3-4 builders:
- **Builder A:** Subscription components (CancelSubscriptionModal, SubscriptionStatusCard, PayPalCheckoutModal)
- **Builder B:** Dashboard/Shared components (DashboardGrid, WelcomeSection, SubscriptionCard, NavigationBase)
- **Builder C:** Navigation components (AppNavigation, UserDropdownMenu, MobileNavigationMenu, BottomNavigation)
- **Builder D:** Remaining (ClarifyCard, ReflectionFilters, AccountInfoSection, CosmicBackground)

---

## Complexity Assessment

### High Complexity Areas
- **AppNavigation** (352 lines): Multiple sub-components, effects, refs, responsive behavior. Recommend 25-30 tests.
- **PayPalCheckoutModal** (178 lines): External SDK integration, async flows, multiple states. Recommend 25-30 tests. REQUIRES PayPal mock first.

### Medium Complexity Areas
- **CancelSubscriptionModal** (145 lines): Mutation flow, confirmation logic
- **SubscriptionStatusCard** (155 lines): tRPC query, sub-modal integration
- **ClarifyCard** (237 lines): Access control, tRPC queries, empty/loading states
- **ReflectionFilters** (303 lines): Many filter controls, state management
- **BottomNavigation** (190 lines): Scroll detection, tier-based nav items

### Low Complexity Areas
- **DashboardGrid** (26 lines): Pure presentational
- **WelcomeSection** (48 lines): Time-based greeting only
- **NavigationBase** (64 lines): Simple wrapper
- **UserDropdownMenu** (88 lines): Static link list
- **MobileNavigationMenu** (126 lines): Conditional nav links

---

## Resource Map

### Critical Files/Directories

| Path | Purpose |
|------|---------|
| `/components/subscription/` | Subscription-related UI components |
| `/components/dashboard/cards/` | Dashboard card components |
| `/components/dashboard/shared/` | Shared dashboard utilities |
| `/components/shared/` | App-wide shared components |
| `/components/clarify/` | Clarify agent UI |
| `/components/reflections/` | Reflections list/filter UI |
| `/components/navigation/` | Navigation components |
| `/components/profile/` | Profile page sections |
| `/test/mocks/` | Mock files (create paypal-sdk.tsx here) |

### Key Dependencies to Mock

| Dependency | Mock Strategy |
|------------|---------------|
| `@/lib/trpc` | vi.mock with specific router/hook mocks |
| `@/hooks/useAuth` | vi.mock returning mock user object |
| `next/navigation` | vi.mock useRouter, usePathname |
| `next/link` | vi.mock to simple anchor |
| `framer-motion` | vi.mock motion.div to regular div |
| `@paypal/react-paypal-js` | Custom mock file required |
| `date-fns` | Generally not mocked (use vi.setSystemTime) |
| `@/contexts/ToastContext` | vi.mock useToast with vi.fn() methods |
| `@/contexts/NavigationContext` | vi.mock useNavigation |

### Test Infrastructure

| Tool | Usage |
|------|-------|
| Vitest | Test runner, vi.mock, vi.fn |
| @testing-library/react | render, screen, fireEvent |
| @testing-library/user-event | userEvent for interactions |
| vi.setSystemTime | Time-based test utilities |

---

## Questions for Planner

1. Should we create tests for AccountInfoSection as a replacement for the non-existent ProfileInfoSection?

2. What is the exact path for ReflectionPageRenderer? It was mentioned but not found.

3. Should PayPal SDK mock be created as a prerequisite task before builder work begins?

4. Are there any other profile section components that exist but weren't listed?

5. Should CosmicBackground testing be deprioritized since it's primarily visual/animation?

---

## Estimated Test Counts Summary

| Component | Tests |
|-----------|-------|
| CancelSubscriptionModal | 15-20 |
| PayPalCheckoutModal | 25-30 |
| SubscriptionStatusCard | 20-25 |
| SubscriptionCard | 15-20 |
| DashboardGrid | 5-8 |
| WelcomeSection | 10-12 |
| AppNavigation | 25-30 |
| UserDropdownMenu | 12-15 |
| MobileNavigationMenu | 12-15 |
| CosmicBackground | 10-12 |
| NavigationBase | 8-10 |
| ClarifyCard | 18-22 |
| ReflectionFilters | 20-25 |
| BottomNavigation | 18-22 |
| AccountInfoSection | 18-22 |
| **Total** | **~230-290** |

This aligns with the master plan's estimate of ~230 tests for Iteration 57.
