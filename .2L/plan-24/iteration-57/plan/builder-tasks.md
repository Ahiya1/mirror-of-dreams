# Builder Task Breakdown - Component Coverage Expansion

## Overview

**4 primary builders** will work in parallel on separate component domains.
Builder-1 has a **critical dependency**: must create PayPal SDK mock before testing PayPalCheckoutModal.

**Estimated Tests:** 230-290 total across all builders

---

## Builder-1: Subscription Components + PayPal Mock

### Scope

Create comprehensive tests for subscription management components. **CRITICAL:** Must create PayPal SDK mock first before testing PayPalCheckoutModal.

### Complexity Estimate

**HIGH**

The PayPalCheckoutModal requires external SDK mocking which adds complexity. However, the patterns are well-documented.

### Success Criteria

- [ ] PayPal SDK mock created at `test/mocks/paypal-sdk.tsx`
- [ ] CancelSubscriptionModal.test.tsx with 15-20 tests
- [ ] PayPalCheckoutModal.test.tsx with 25-30 tests
- [ ] SubscriptionStatusCard.test.tsx with 20-25 tests
- [ ] All tests pass without flakiness
- [ ] Coverage for each component exceeds 80%

### Files to Create

1. `test/mocks/paypal-sdk.tsx` - PayPal SDK mock (CREATE FIRST)
2. `components/subscription/__tests__/CancelSubscriptionModal.test.tsx`
3. `components/subscription/__tests__/PayPalCheckoutModal.test.tsx`
4. `components/subscription/__tests__/SubscriptionStatusCard.test.tsx`

### Dependencies

**Depends on:** Nothing (first to start)
**Blocks:** Nothing (isolated)

### Implementation Notes

**Order of Implementation:**
1. **First:** Create `test/mocks/paypal-sdk.tsx`
2. **Second:** Test CancelSubscriptionModal (simpler, warm-up)
3. **Third:** Test SubscriptionStatusCard (medium complexity)
4. **Fourth:** Test PayPalCheckoutModal (uses PayPal mock)

**CancelSubscriptionModal Test Areas:**
- Modal visibility (isOpen prop)
- Tier-specific loss lists (pro vs unlimited benefits)
- Confirmation checkbox enables/disables cancel button
- Cancel mutation triggered on confirm
- Error handling when mutation fails
- Close behavior during pending state
- Date formatting for subscription expiry

**PayPalCheckoutModal Test Areas:**
- Non-rendering when `isOpen` is false
- Loading state when plan data loading (shows CosmicLoader)
- Error state when plan query fails
- PayPal buttons render when data loaded
- Approval flow calls activateSubscription mutation
- Error callback shows toast
- Cancel callback shows toast
- Close button disabled during activation
- Price display for monthly/yearly periods
- Tier name capitalization

**SubscriptionStatusCard Test Areas:**
- Loading skeleton state
- Null return when no subscription data
- Free tier display (shows upgrade button)
- Paid tier display with status badge
- Billing period display (monthly/yearly)
- Next billing date with relative time (formatDistanceToNow)
- Cancellation notice styling
- Cancel modal trigger (only for paid users)
- Modal close and refetch behavior

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use **Pattern 8: PayPal SDK Mock** for PayPalCheckoutModal
- Use **Pattern 3: tRPC Mutation Mock** for cancel mutation
- Use **Pattern 2: tRPC Query Mock** for subscription status
- Use **Pattern 6: Toast Context Mock** for notifications
- Use **Pattern 9: Glass UI Component Mocks** for GlassModal, GlowButton

### Testing Requirements

- Unit tests for all three components
- 60-75 tests total for Builder-1
- Coverage target: 85%+ per component

### PayPal Mock Implementation

Create `test/mocks/paypal-sdk.tsx`:

```typescript
import React from 'react';
import { vi } from 'vitest';

export interface MockPayPalButtonsProps {
  style?: Record<string, unknown>;
  createSubscription?: (
    data: unknown,
    actions: { subscription: { create: (config: unknown) => Promise<string> } }
  ) => Promise<string>;
  onApprove?: (data: { subscriptionID?: string | null }) => Promise<void>;
  onError?: (err: Record<string, unknown>) => void;
  onCancel?: () => void;
}

export const mockPayPalActions = {
  subscription: {
    create: vi.fn().mockResolvedValue('SUB-123456789'),
  },
};

export const MockPayPalScriptProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const MockPayPalButtons = ({
  createSubscription,
  onApprove,
  onError,
  onCancel,
}: MockPayPalButtonsProps) => {
  const handleApprove = async () => {
    try {
      if (createSubscription) {
        await createSubscription({}, mockPayPalActions);
      }
      if (onApprove) {
        await onApprove({ subscriptionID: 'SUB-123456789' });
      }
    } catch {
      if (onError) {
        onError({ message: 'Test error' });
      }
    }
  };

  return (
    <div data-testid="paypal-buttons">
      <button
        onClick={handleApprove}
        data-testid="paypal-subscribe-button"
        type="button"
      >
        PayPal Subscribe
      </button>
      <button
        onClick={() => onError?.({ message: 'PayPal error' })}
        data-testid="paypal-error-trigger"
        type="button"
      >
        Trigger Error
      </button>
      <button
        onClick={onCancel}
        data-testid="paypal-cancel-button"
        type="button"
      >
        Cancel
      </button>
    </div>
  );
};
```

---

## Builder-2: Dashboard Components

### Scope

Create comprehensive tests for dashboard card and shared components. These are primarily presentational components with simpler testing requirements.

### Complexity Estimate

**MEDIUM**

SubscriptionCard is 473 lines but mostly JSX rendering. DashboardGrid and WelcomeSection are low complexity.

### Success Criteria

- [ ] SubscriptionCard.test.tsx with 15-20 tests
- [ ] DashboardGrid.test.tsx with 5-8 tests
- [ ] WelcomeSection.test.tsx with 10-12 tests
- [ ] All tests pass without flakiness
- [ ] Coverage for each component exceeds 80%

### Files to Create

1. `components/dashboard/cards/__tests__/SubscriptionCard.test.tsx`
2. `components/dashboard/shared/__tests__/DashboardGrid.test.tsx`
3. `components/dashboard/shared/__tests__/WelcomeSection.test.tsx`

### Dependencies

**Depends on:** Nothing
**Blocks:** Nothing

### Implementation Notes

**Order of Implementation:**
1. **First:** DashboardGrid (simplest, 26 lines)
2. **Second:** WelcomeSection (requires time mocking)
3. **Third:** SubscriptionCard (largest component)

**DashboardGrid Test Areas:**
- Renders children correctly
- Applies custom className
- Applies grid class from CSS module
- Handles empty children

**WelcomeSection Test Areas:**
- Morning greeting (5am-11:59am)
- Afternoon greeting (12pm-4:59pm)
- Evening greeting (5pm-8:59pm)
- Night greeting (9pm-4:59am)
- First name extraction from full name
- Fallback to "there" when no name
- Handles null user gracefully
- Custom className application

**SubscriptionCard Test Areas:**
- Tier badge rendering for free/pro/unlimited
- Benefits list content varies by tier
- Upgrade preview section for free users
- Action button text varies by tier
- Action button links to correct page
- Loading state handling
- Animation props passed correctly

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use **Pattern 1: useAuth Hook Mock** for user data
- Use **Pattern 15: Time-Based Testing** for WelcomeSection
- Use **Pattern 10: DashboardCard Component Mocks** for card structure

### Testing Requirements

- Unit tests for all three components
- 30-40 tests total for Builder-2
- Coverage target: 80%+ per component

### WelcomeSection Time Testing Example

```typescript
describe('WelcomeSection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('time-based greeting', () => {
    it('shows morning greeting at 9am', () => {
      vi.setSystemTime(new Date('2025-01-10T09:00:00'));
      mockUseAuth.mockReturnValue({ user: createMockUser({ name: 'John Doe' }) });

      render(<WelcomeSection />);

      expect(screen.getByText(/good morning/i)).toBeInTheDocument();
      expect(screen.getByText(/john/i)).toBeInTheDocument();
    });

    // ... additional time tests
  });
});
```

---

## Builder-3: Navigation Components

### Scope

Create comprehensive tests for all navigation-related components including the complex AppNavigation.

### Complexity Estimate

**HIGH**

AppNavigation is 352 lines with multiple sub-components, effects, refs, and responsive behavior. Other components are simpler but there are 5 total.

### Success Criteria

- [ ] AppNavigation.test.tsx with 25-30 tests
- [ ] UserDropdownMenu.test.tsx with 12-15 tests
- [ ] MobileNavigationMenu.test.tsx with 12-15 tests
- [ ] NavigationBase.test.tsx with 8-10 tests
- [ ] BottomNavigation.test.tsx with 18-22 tests
- [ ] All tests pass without flakiness
- [ ] Coverage for each component exceeds 80%

### Files to Create

1. `components/shared/__tests__/NavigationBase.test.tsx`
2. `components/shared/__tests__/UserDropdownMenu.test.tsx`
3. `components/shared/__tests__/MobileNavigationMenu.test.tsx`
4. `components/shared/__tests__/AppNavigation.test.tsx`
5. `components/navigation/__tests__/BottomNavigation.test.tsx`

### Dependencies

**Depends on:** Nothing
**Blocks:** Nothing

### Implementation Notes

**Order of Implementation:**
1. **First:** NavigationBase (simplest, 64 lines)
2. **Second:** UserDropdownMenu (88 lines, self-contained)
3. **Third:** MobileNavigationMenu (126 lines)
4. **Fourth:** BottomNavigation (190 lines, mobile-specific)
5. **Fifth:** AppNavigation (352 lines, most complex)

**NavigationBase Test Areas:**
- Renders children correctly
- Logo link uses homeHref prop
- Default homeHref is "/"
- Transparent mode styling
- Custom className applied
- Elevated prop passed to GlassCard

**UserDropdownMenu Test Areas:**
- Renders user name and email
- Fallback values for missing name/email
- Profile link present
- Settings link present
- Upgrade link visible when not unlimited tier
- Upgrade link hidden for unlimited tier
- Help link present
- Sign out button triggers callback
- Sign out button styling

**MobileNavigationMenu Test Areas:**
- All navigation links render
- Active link styling for each currentPage
- Inactive link styling
- Clarify link visible for paid users only
- Clarify link hidden for free users
- Admin link visible for admin users
- Admin link hidden for non-admins
- Motion animation props (mocked)

**BottomNavigation Test Areas:**
- Renders when visible (showBottomNav: true)
- Hides when scroll direction is down
- Hides when showBottomNav is false
- All base nav items render (Dashboard, Dreams, Reflect, Journey, Profile)
- Clarify tab shows for paid users only
- Clarify tab hidden for free users
- Active tab styling based on pathname
- Exact match for dashboard, prefix match for others
- Haptic feedback on click
- ARIA attributes present

**AppNavigation Test Areas:**
- Logo link navigates to dashboard
- Desktop nav links render correctly
- Active page highlighting for each currentPage value
- Clarify link visible for paid users
- Clarify link hidden for free users
- Admin link visible for admin users
- Admin link hidden for non-admins
- Upgrade button visible for free users
- Upgrade button hidden for paid users
- Refresh button visible when onRefresh provided
- User dropdown toggle behavior
- Keyboard navigation (Enter, Space to toggle)
- Escape key closes dropdown
- Document click outside closes dropdown
- Signout mutation called on sign out
- Mobile menu button visible at tablet breakpoint
- Demo banner renders when user is demo

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use **Pattern 4: Next.js Navigation Mock** for routing
- Use **Pattern 5: Next/Link Mock** for links
- Use **Pattern 7: Framer Motion Mock** for animations
- Use **Pattern 11: Navigation Context Mock** for BottomNavigation
- Use **Pattern 12: useScrollDirection Hook Mock** for BottomNavigation
- Use **Pattern 13: Haptic Feedback Mock** for BottomNavigation

### Testing Requirements

- Unit tests for all five components
- 75-92 tests total for Builder-3
- Coverage target: 80%+ per component

### Potential Split Strategy

If AppNavigation proves too complex, consider splitting:

**Sub-builder 3A:** NavigationBase, UserDropdownMenu, MobileNavigationMenu
- 3 components, ~35 tests
- Estimate: MEDIUM

**Sub-builder 3B:** AppNavigation, BottomNavigation
- 2 components, ~50 tests
- Estimate: HIGH

---

## Builder-4: Remaining Components

### Scope

Create comprehensive tests for clarify, reflections, profile, and shared visual components.

### Complexity Estimate

**MEDIUM**

ReflectionFilters is largest (303 lines) but primarily filter controls. ClarifyCard has tier-based access control. CosmicBackground requires matchMedia mocking.

### Success Criteria

- [ ] ClarifyCard.test.tsx with 18-22 tests
- [ ] ReflectionFilters.test.tsx with 20-25 tests
- [ ] AccountInfoSection.test.tsx with 18-22 tests
- [ ] CosmicBackground.test.tsx with 10-12 tests
- [ ] All tests pass without flakiness
- [ ] Coverage for each component exceeds 80%

### Files to Create

1. `components/shared/__tests__/CosmicBackground.test.tsx`
2. `components/clarify/__tests__/ClarifyCard.test.tsx`
3. `components/reflections/__tests__/ReflectionFilters.test.tsx`
4. `components/profile/__tests__/AccountInfoSection.test.tsx`

### Dependencies

**Depends on:** Nothing
**Blocks:** Nothing

### Implementation Notes

**Order of Implementation:**
1. **First:** CosmicBackground (visual, 158 lines)
2. **Second:** AccountInfoSection (form-based, 144 lines)
3. **Third:** ClarifyCard (tier-based, 237 lines)
4. **Fourth:** ReflectionFilters (filter controls, 303 lines)

**CosmicBackground Test Areas:**
- Default rendering with animation
- Animation disabled when prefersReducedMotion
- Intensity prop affects opacity/styles
- className prop applied
- aria-hidden attribute present
- Cosmic layers render conditionally based on intensity

**AccountInfoSection Test Areas:**
- Displays user name
- Displays user email
- Displays "member since" date with relative time
- Edit name mode toggle
- Edit name input value changes
- Save name callback triggered
- Cancel name editing
- Edit email mode toggle
- New email input
- Password input for email change
- Change email callback triggered
- Cancel email editing
- Disabled state for demo users
- Saving/loading states
- Error handling for invalid inputs

**ClarifyCard Test Areas:**
- Returns null for free tier user
- Returns null when user is null
- Shows for pro tier user
- Shows for unlimited tier user
- Shows for creator/admin users
- Loading state (CosmicLoader)
- Empty state with CTA (no sessions)
- Sessions list rendering
- Usage bar calculation (sessions used / limit)
- Session link navigation
- Relative time formatting for sessions

**ReflectionFilters Test Areas:**
- Search input renders and updates
- Search input debounce behavior
- Search clear button visible when text present
- Search clear button triggers callback
- Filter toggle button
- Active filters indicator dot when filters active
- Sort by dropdown options (Newest, Oldest, etc.)
- Sort by selection triggers callback
- Sort order toggle (asc/desc)
- Clear all button visible when hasActiveFilters
- Clear all button triggers callback
- Expanded filter panel visibility
- Date range buttons (All Time, This Week, This Month, etc.)
- Date range selection triggers callback
- Tone filter buttons (All, Gentle, Intense, Fusion)
- Tone selection triggers callback
- Premium filter toggle
- Premium filter triggers callback

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use **Pattern 14: matchMedia Mock** for CosmicBackground
- Use **Pattern 1: useAuth Hook Mock** for ClarifyCard tier access
- Use **Pattern 2: tRPC Query Mock** for ClarifyCard sessions
- Use **Testing Filter Components** pattern for ReflectionFilters
- Use **Testing Form Interactions** pattern for AccountInfoSection

### Testing Requirements

- Unit tests for all four components
- 66-81 tests total for Builder-4
- Coverage target: 80%+ per component

### CosmicBackground matchMedia Example

```typescript
describe('CosmicBackground', () => {
  it('disables animation when prefers-reduced-motion', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: true, // prefers-reduced-motion: reduce
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    render(<CosmicBackground />);

    // Animation classes should not be applied
    const background = screen.getByTestId('cosmic-background');
    expect(background).not.toHaveClass('animate');
  });
});
```

---

## Builder Execution Order

### Parallel Group 1 (No dependencies)

All builders can start immediately:
- **Builder-1:** Subscription Components (start with PayPal mock)
- **Builder-2:** Dashboard Components
- **Builder-3:** Navigation Components
- **Builder-4:** Remaining Components

### Integration Notes

**File Locations:**
Each builder creates test files in isolated directories. No conflicts expected.

**Shared Resources:**
- Builder-1 creates `test/mocks/paypal-sdk.tsx` which is new
- All builders use existing `test/helpers/trpc.ts` and `test/factories/user.factory.ts`

**Potential Conflict Areas:**
None identified. All builders work on separate component directories.

---

## Summary Table

| Builder | Components | Tests | Complexity | Est. Time |
|---------|------------|-------|------------|-----------|
| Builder-1 | CancelSubscriptionModal, PayPalCheckoutModal, SubscriptionStatusCard | 60-75 | HIGH | 45-60 min |
| Builder-2 | SubscriptionCard, DashboardGrid, WelcomeSection | 30-40 | MEDIUM | 30-45 min |
| Builder-3 | AppNavigation, UserDropdownMenu, MobileNavigationMenu, NavigationBase, BottomNavigation | 75-92 | HIGH | 60-75 min |
| Builder-4 | ClarifyCard, ReflectionFilters, AccountInfoSection, CosmicBackground | 66-81 | MEDIUM | 45-60 min |
| **Total** | **15 components** | **231-288** | - | **2-3 hrs** |

---

## Validation Checklist

Before marking iteration complete, verify:

- [ ] PayPal SDK mock exists at `test/mocks/paypal-sdk.tsx`
- [ ] All 15 component test files created
- [ ] Minimum 230 tests total
- [ ] All tests pass (`npm run test`)
- [ ] No flaky tests (run 3x if needed)
- [ ] Coverage improved by at least 3%
- [ ] Each component has 80%+ coverage
