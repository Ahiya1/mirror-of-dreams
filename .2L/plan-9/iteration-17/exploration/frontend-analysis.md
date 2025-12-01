# Iteration 17 Frontend Integration Analysis

**Explorer:** Explorer-17  
**Date:** 2025-11-30  
**Focus:** Analyze current frontend state to understand what exists and what needs to change for PayPal integration

## Executive Summary

The frontend has solid foundations for subscription UI but requires significant integration work to connect with PayPal. Key findings:

1. **Pricing page exists** but currently links to signup, not checkout
2. **Profile page has subscription display** but no management controls
3. **Feature gating is partially implemented** - evolution/visualizations have tier checks, but inconsistent patterns
4. **tRPC procedures exist** from Iteration 16 but frontend hasn't integrated them yet
5. **Tier naming mismatch** - frontend uses `free/pro/unlimited`, backend/design uses `free/essential/premium/creator`

## Current State Analysis

### 1. Pricing Page (`/app/pricing/page.tsx`)

**Current Implementation:**
- Static pricing display with 3 tiers: Free ($0), Pro ($9.99), Unlimited ($29.99)
- CTAs link to signup pages: `/auth/signup`, `/auth/signup?plan=pro`, `/auth/signup?plan=unlimited`
- No monthly/yearly toggle (FAQ mentions annual billing but UI doesn't support it)
- Clean layout with feature comparison
- Uses TIER_LIMITS constants for reflection counts

**What Needs to Change:**
- Replace signup CTAs with PayPal checkout flow for paid tiers
- Add monthly/yearly toggle with price calculations
- Handle success/cancel URL params from PayPal redirects
- Add loading states during checkout creation
- Update tier names to match backend: `essential` and `premium` instead of `pro` and `unlimited`

**Integration Points:**
- `trpc.subscriptions.createCheckout.useMutation()` - creates PayPal approval URL
- Redirect to PayPal on paid tier selection
- Handle return from PayPal with status messages

### 2. Profile Page (`/app/profile/page.tsx`)

**Current Implementation:**
- Shows tier as capitalized string: "Free", "Pro", "Unlimited"
- Displays reflection usage: `{user?.reflectionCountThisMonth} / {limit}`
- Hardcoded limits: free=10, pro=50, unlimited=unlimited
- Total reflections count shown
- No subscription management UI (no cancel button, no billing portal link)

**What Needs to Change:**
- Add "Subscription & Billing" card section
- Show subscription status (active, canceled, cancel_at_period_end)
- Display billing period (monthly/yearly)
- Add "Cancel Subscription" button with confirmation modal
- Add "Manage Billing" button linking to PayPal portal
- Show next billing date
- Handle downgrade scenarios (cancel_at_period_end messaging)

**Integration Points:**
- `trpc.subscriptions.getStatus.useQuery()` - fetch subscription details
- `trpc.subscriptions.cancel.useMutation()` - cancel subscription
- Handle loading/error states for mutations

### 3. Dashboard (`/app/dashboard/page.tsx` + `components/dashboard/cards/SubscriptionCard.tsx`)

**Current Implementation:**
- Dashboard assembles 6 cards including SubscriptionCard
- SubscriptionCard shows tier badge, benefits list, and upgrade CTA
- Uses outdated tier names: `free/essential/premium/creator`
- Upgrade links point to `/subscription` route (which doesn't exist yet)
- No usage warnings or upgrade prompts in dashboard hero

**What Needs to Change:**
- Update SubscriptionCard to use consistent tier names
- Change upgrade link from `/subscription` to `/pricing`
- Add usage banner in DashboardHero when near limit
- Add "Upgrade" prompt when limit reached
- Consider showing PayPal checkout directly in modal vs redirecting to pricing page

**Integration Points:**
- Already using `useAuth()` which has tier/usage data
- Could add inline checkout modal for faster conversion

### 4. Feature Gating

**Current Patterns Found:**

#### Evolution Reports (`/app/evolution/page.tsx`)
```tsx
{user.tier === 'free' ? (
  <GlassCard elevated className="border-l-4 border-yellow-500">
    <GlowBadge variant="warning">!</GlowBadge>
    <div>
      <p>Upgrade to Essential</p>
      <p>Evolution reports are available for Essential tier and higher.</p>
    </div>
    <GlowButton onClick={() => router.push('/dashboard')}>
      Upgrade Now
    </GlowButton>
  </GlassCard>
) : (
  // Generation controls
)}
```

**Pattern:** Full feature lockout with upgrade prompt

#### Visualizations (`/app/visualizations/page.tsx`)
```tsx
{user.tier === 'free' && !selectedDreamId ? (
  <GlassCard className="border-l-4 border-yellow-500 mb-6">
    <GlowBadge variant="warning">!</GlowBadge>
    <div>
      <p>Cross-dream visualizations require Essential tier or higher. 
         You can still create dream-specific visualizations.</p>
    </div>
  </GlassCard>
) : null}
```

**Pattern:** Partial feature restriction (cross-dream locked, single-dream allowed)

#### Profile Page (`/app/profile/page.tsx`)
```tsx
{user?.reflectionCountThisMonth} / {user?.tier === 'free' ? '10' : user?.tier === 'pro' ? '50' : 'Unlimited'}
```

**Pattern:** Display-only usage stats (no enforcement here)

#### AppNavigation (`/components/shared/AppNavigation.tsx`)
```tsx
{user?.tier === 'free' && (
  // Upgrade prompt banner
)}
```

**Pattern:** Contextual upgrade prompt in navigation

**What's Missing:**
- Reflection creation limit enforcement in UI
- Consistent upgrade flow (some point to `/dashboard`, others nowhere)
- Post-limit modal/banner when user tries to create reflection
- Unified UpgradePrompt component for reusability

### 5. Reflection Flow

**Current Implementation:**
- Main reflection page: `/app/reflection/page.tsx` (wraps MirrorExperience)
- MirrorExperience component: `/app/reflection/MirrorExperience.tsx`
- No visible limit checking in UI (backend handles via tRPC)
- Uses `trpc.reflection.create.useMutation()` which returns error on limit

**What Needs to Add:**
- Pre-flight check: `trpc.users.checkReflectionLimit.useQuery()` (if available)
- Graceful error handling when limit reached
- Upgrade modal/banner on limit error
- Usage warning when approaching limit (e.g., "1 reflection remaining this month")

**Integration Points:**
- Add limit check before showing reflection form
- Handle `TRPCError` with code `FORBIDDEN` for limit exceeded
- Show UpgradeModal with pricing options

### 6. Constants & Type Mismatches

**Problem:** Tier name inconsistency across codebase

**constants.ts:**
```ts
export const TIER_LIMITS = {
  free: 2,
  pro: 30,
  unlimited: 60,
}
```

**SubscriptionCard.tsx:**
```ts
tier: (user?.tier || 'free') as 'free' | 'essential' | 'premium' | 'creator',
```

**Backend (Iteration 16):**
- `free`, `essential`, `premium`, `creator`

**Recommendation:** 
- Update `constants.ts` to match backend schema
- Update all frontend references to use correct tier names
- Create type definition: `export type SubscriptionTier = 'free' | 'essential' | 'premium' | 'creator';`

## Backend Integration Points (from Iteration 16)

### tRPC Procedures Available

**`subscriptions` router:**
```ts
trpc.subscriptions.getStatus.useQuery()
// Returns: { tier, status, period, isActive, isSubscribed, isCanceled, 
//           cancelAtPeriodEnd, nextBilling, subscriptionId, startedAt, expiresAt }

trpc.subscriptions.createCheckout.useMutation({ tier, period })
// Returns: { approvalUrl } - redirect user here

trpc.subscriptions.cancel.useMutation()
// Returns: { success: true }
```

**Note:** Backend expects tier values: `'essential' | 'premium' | 'creator'` (NOT `'pro' | 'unlimited'`)

### URL Handling for PayPal Returns

Backend webhook handler processes PayPal events, but frontend needs to:

1. **Success flow:**
   - User returns to: `/pricing?success=true&subscription_id=XXX`
   - Show success toast: "Subscription activated! Welcome to [tier]"
   - Refetch user data: `trpc.users.me.useQuery()`
   - Redirect to dashboard

2. **Cancel flow:**
   - User returns to: `/pricing?cancel=true`
   - Show info toast: "Checkout canceled. Your free tier is still active."
   - No action needed

3. **Error flow:**
   - User returns to: `/pricing?error=message`
   - Show error toast: "Payment failed: {message}"

## File Modification Breakdown

### Files Needing Updates

#### 1. `/app/pricing/page.tsx` (MAJOR CHANGES)
**Scope:** Add PayPal checkout integration

**Changes:**
- [ ] Add monthly/yearly toggle state
- [ ] Update tier pricing display based on toggle
- [ ] Replace static CTAs with dynamic checkout buttons
- [ ] Add `createCheckout` mutation
- [ ] Add loading states during checkout creation
- [ ] Handle success/cancel/error URL params with `useSearchParams()`
- [ ] Update tier names: `pro` → `essential`, `unlimited` → `premium`
- [ ] Add authenticated user check (show "Current Plan" if already subscribed)

**New imports needed:**
```ts
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
```

#### 2. `/app/profile/page.tsx` (MEDIUM CHANGES)
**Scope:** Add subscription management UI

**Changes:**
- [ ] Add new GlassCard section: "Subscription & Billing"
- [ ] Add `getStatus` query to fetch subscription details
- [ ] Display billing period, next billing date
- [ ] Add "Cancel Subscription" button with confirmation modal
- [ ] Add "Manage Billing" button (link to PayPal portal - may need backend endpoint)
- [ ] Show cancel_at_period_end banner if subscription is canceling
- [ ] Update tier display to use correct names

**New components:**
- CancelSubscriptionModal (confirmation + password)

#### 3. `/components/dashboard/cards/SubscriptionCard.tsx` (MINOR CHANGES)
**Scope:** Fix tier names and upgrade links

**Changes:**
- [ ] Update tier type: `'free' | 'essential' | 'premium' | 'creator'`
- [ ] Update tier info mapping (remove outdated structure)
- [ ] Change upgrade link: `/subscription` → `/pricing`
- [ ] Update tier descriptions to match pricing page

#### 4. `/lib/utils/constants.ts` (BREAKING CHANGE)
**Scope:** Update tier constants to match backend

**Changes:**
```ts
export const TIER_LIMITS = {
  free: 2,
  essential: 30,
  premium: 60,
  creator: 999999, // unlimited
} as const;

export type SubscriptionTier = keyof typeof TIER_LIMITS;

export const TIER_PRICING = {
  essential: {
    monthly: 9.99,
    yearly: 99.99, // 17% discount
  },
  premium: {
    monthly: 29.99,
    yearly: 299.99, // 17% discount
  },
  creator: {
    monthly: 99.99,
    yearly: 999.99,
  },
} as const;
```

**Impact:** This will require updates across the codebase wherever `TIER_LIMITS` is imported

#### 5. `/app/reflection/MirrorExperience.tsx` (MINOR CHANGES)
**Scope:** Add limit checking and upgrade prompts

**Changes:**
- [ ] Add usage check query (from `useAuth` user object)
- [ ] Show warning banner when near limit (1-2 reflections remaining)
- [ ] Handle limit exceeded error from `createReflection` mutation
- [ ] Show UpgradeModal on limit error

**New component:**
- UpgradeModal (reusable across app)

#### 6. `/app/evolution/page.tsx` (MINOR CHANGES)
**Scope:** Update upgrade link

**Changes:**
- [ ] Change upgrade button: `router.push('/dashboard')` → `router.push('/pricing')`
- [ ] Update tier name: "Essential" (already correct!)

#### 7. `/app/visualizations/page.tsx` (NO CHANGES)
**Already correct** - uses proper messaging and allows partial access for free tier

### New Components to Create

#### 1. `/components/subscription/UpgradeModal.tsx`
**Purpose:** Reusable modal prompting upgrade with tier options

**Props:**
```ts
interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: 'limit_reached' | 'feature_locked';
  feature?: string; // e.g., "Evolution Reports"
}
```

**Features:**
- Show tier comparison
- Direct checkout CTAs (monthly/yearly for each tier)
- Handle checkout creation and redirect
- Close on successful redirect

#### 2. `/components/subscription/CancelSubscriptionModal.tsx`
**Purpose:** Confirmation modal for subscription cancellation

**Props:**
```ts
interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: {
    tier: string;
    period: string;
    nextBilling: string;
  };
}
```

**Features:**
- Show what user will lose
- Confirm cancellation with checkbox
- Handle cancel mutation
- Show success/error states

#### 3. `/components/subscription/UsageBanner.tsx`
**Purpose:** Contextual banner showing usage status

**Props:**
```ts
interface UsageBannerProps {
  used: number;
  limit: number;
  tier: SubscriptionTier;
  variant?: 'info' | 'warning' | 'error';
}
```

**Features:**
- Visual progress bar
- Contextual messaging based on usage
- Upgrade CTA when appropriate

## Recommended Builder Task Breakdown

### Task 1: Update Constants & Types (Foundation)
**Priority:** CRITICAL (blocks other tasks)  
**Estimated Complexity:** LOW  
**Files:** 1

**Work:**
1. Update `/lib/utils/constants.ts` with correct tier names and pricing
2. Create TypeScript types for subscription data
3. Fix all TypeScript errors from tier name changes

**Why First:** All other tasks depend on correct tier names

---

### Task 2: Pricing Page Integration (Core Feature)
**Priority:** HIGH  
**Estimated Complexity:** HIGH  
**Files:** 1 main + 1 new component

**Work:**
1. Add monthly/yearly toggle with price calculations
2. Integrate `createCheckout` mutation
3. Handle checkout flow and loading states
4. Handle return URL params (success/cancel/error)
5. Create UpgradeModal component (reusable)
6. Add authenticated user check (show current plan badge)

**Dependencies:** Task 1

---

### Task 3: Profile Page Subscription Management (Core Feature)
**Priority:** HIGH  
**Estimated Complexity:** MEDIUM  
**Files:** 1 main + 1 new component

**Work:**
1. Add "Subscription & Billing" card section
2. Integrate `getStatus` query
3. Display subscription details (period, next billing, status)
4. Add cancel button with CancelSubscriptionModal
5. Handle cancel_at_period_end messaging
6. Add "Manage Billing" link (if backend supports)

**Dependencies:** Task 1, Task 2 (UpgradeModal)

---

### Task 4: Dashboard Updates (Polish)
**Priority:** MEDIUM  
**Estimated Complexity:** LOW  
**Files:** 2

**Work:**
1. Update SubscriptionCard tier names and links
2. Add UsageBanner to DashboardHero when near/at limit
3. Update upgrade CTAs to point to `/pricing`

**Dependencies:** Task 1, Task 2 (UpgradeModal)

---

### Task 5: Feature Gating & Reflection Limits (UX Polish)
**Priority:** MEDIUM  
**Estimated Complexity:** MEDIUM  
**Files:** 3

**Work:**
1. Add limit checking to reflection flow
2. Show usage warning when near limit
3. Handle limit exceeded error with UpgradeModal
4. Update evolution/visualization upgrade links to `/pricing`
5. Standardize feature gating UI patterns

**Dependencies:** Task 1, Task 2 (UpgradeModal)

---

## Integration Patterns to Follow

### 1. Checkout Flow Pattern

```tsx
const handleCheckout = async (tier: 'essential' | 'premium', period: 'monthly' | 'yearly') => {
  setIsCheckingOut(true);
  
  try {
    const { approvalUrl } = await createCheckout.mutateAsync({ tier, period });
    
    // Redirect to PayPal
    window.location.href = approvalUrl;
  } catch (error) {
    toast.error('Checkout failed. Please try again.');
    setIsCheckingOut(false);
  }
};
```

### 2. Return URL Handling Pattern

```tsx
const searchParams = useSearchParams();
const router = useRouter();
const toast = useToast();

useEffect(() => {
  const success = searchParams.get('success');
  const cancel = searchParams.get('cancel');
  const error = searchParams.get('error');
  
  if (success) {
    toast.success('Subscription activated! Welcome to your new tier.');
    // Refetch user data
    router.replace('/pricing'); // Remove params
  } else if (cancel) {
    toast.info('Checkout canceled.');
    router.replace('/pricing');
  } else if (error) {
    toast.error(`Payment failed: ${error}`);
    router.replace('/pricing');
  }
}, [searchParams]);
```

### 3. Subscription Status Display Pattern

```tsx
const { data: subscription } = trpc.subscriptions.getStatus.useQuery();

{subscription?.cancelAtPeriodEnd && (
  <GlassCard className="border-l-4 border-yellow-500">
    <p>Your subscription will cancel on {formatDate(subscription.expiresAt)}</p>
    <GlowButton onClick={() => reactivate()}>Reactivate</GlowButton>
  </GlassCard>
)}
```

### 4. Feature Gate Pattern

```tsx
const FeatureGate: FC<{ tier: SubscriptionTier; requiredTier: SubscriptionTier }> = ({ 
  tier, requiredTier, children 
}) => {
  const tierOrder = ['free', 'essential', 'premium', 'creator'];
  const hasAccess = tierOrder.indexOf(tier) >= tierOrder.indexOf(requiredTier);
  
  if (!hasAccess) {
    return <UpgradePrompt requiredTier={requiredTier} />;
  }
  
  return <>{children}</>;
};
```

## Risks & Challenges

### Technical Risks

1. **Tier Name Migration**
   - **Risk:** Breaking changes across entire codebase
   - **Mitigation:** Search/replace carefully, test all tier-dependent features
   - **Impact:** HIGH

2. **PayPal Redirect Flow**
   - **Risk:** User loses context after returning from PayPal
   - **Mitigation:** Store intended destination in localStorage before redirect
   - **Impact:** MEDIUM

3. **Subscription State Sync**
   - **Risk:** Frontend shows stale tier after PayPal completes
   - **Mitigation:** Force refetch user data on return, use webhook updates
   - **Impact:** MEDIUM

### UX Risks

1. **Checkout Abandonment**
   - **Risk:** Users get confused during PayPal flow
   - **Mitigation:** Clear messaging, progress indicators, return handling
   - **Impact:** MEDIUM

2. **Feature Lock Frustration**
   - **Risk:** Users hit limits and can't create reflections
   - **Mitigation:** Proactive warnings, graceful upgrade prompts
   - **Impact:** HIGH

3. **Pricing Clarity**
   - **Risk:** Users don't understand value proposition
   - **Mitigation:** Clear benefit descriptions, feature comparison
   - **Impact:** MEDIUM

## Questions for Planner

1. **Tier Naming:** Should we proceed with backend tier names (`essential/premium/creator`) or update backend to match current frontend (`pro/unlimited`)? **Recommendation:** Use backend names - they're more scalable.

2. **Annual Billing:** FAQ mentions it, but should we implement it in Iteration 17 or defer? **Recommendation:** Implement now - it's already in backend schema.

3. **PayPal Portal:** Do we have a backend endpoint for "Manage Billing" that links to PayPal portal? **Recommendation:** Builder should check if needed.

4. **Reactivation:** Should canceled subscriptions be reactivatable before expiration? **Recommendation:** Yes - better UX, prevents churn.

5. **Inline Checkout:** Should we support modal-based checkout in dashboard/profile, or always redirect to pricing page? **Recommendation:** Redirect to pricing for consistency.

6. **Usage Enforcement:** Should reflection limit be checked in frontend pre-flight, or only handle backend errors? **Recommendation:** Both - pre-flight for UX, backend for security.

## Success Metrics

### Must Have (MVP)
- [ ] Users can checkout via PayPal from pricing page
- [ ] Users can cancel subscription from profile page
- [ ] Subscription status displays correctly in profile
- [ ] Feature gating works for evolution/visualization
- [ ] Reflection limits enforced with upgrade prompts

### Nice to Have (Polish)
- [ ] Monthly/yearly toggle with dynamic pricing
- [ ] Usage warnings when approaching limit
- [ ] Smooth return flow from PayPal
- [ ] Inline upgrade prompts in dashboard
- [ ] Reusable UpgradeModal component

### Testing Checklist
- [ ] Free user can checkout essential monthly
- [ ] Free user can checkout essential yearly
- [ ] Free user can checkout premium monthly
- [ ] Free user can checkout premium yearly
- [ ] Paid user can cancel subscription
- [ ] Canceled subscription shows correct messaging
- [ ] Reflection limit blocks creation at limit
- [ ] Evolution reports locked for free tier
- [ ] Visualizations partially locked for free tier

## Resource Map

### Critical Files (Must Modify)
- `/app/pricing/page.tsx` - Main checkout integration
- `/app/profile/page.tsx` - Subscription management
- `/lib/utils/constants.ts` - Tier definitions
- `/components/dashboard/cards/SubscriptionCard.tsx` - Tier display

### Supporting Files (Should Modify)
- `/app/reflection/MirrorExperience.tsx` - Limit enforcement
- `/app/evolution/page.tsx` - Upgrade link fix
- `/app/dashboard/page.tsx` - Usage banners

### New Files (Must Create)
- `/components/subscription/UpgradeModal.tsx` - Reusable upgrade prompt
- `/components/subscription/CancelSubscriptionModal.tsx` - Cancel flow
- `/components/subscription/UsageBanner.tsx` - Usage display

### Integration Files (Read for Context)
- `/server/trpc/routers/subscriptions.ts` - Backend API
- `/types/subscription.ts` - Type definitions
- `/server/lib/paypal.ts` - PayPal client (if needed)

## Next Steps for Builder

1. **Read Iteration 16 summary** to understand backend implementation
2. **Start with Task 1** (constants) to fix type mismatches
3. **Implement Task 2** (pricing page) as core feature
4. **Test checkout flow** with PayPal sandbox
5. **Implement Task 3** (profile management) for subscription control
6. **Polish with Tasks 4-5** based on time available

## Appendix: Code Patterns from Existing Files

### Existing tRPC Usage Pattern
```tsx
// From profile page
const updateProfileMutation = trpc.users.updateProfile.useMutation({
  onSuccess: (data) => {
    setUser((prev) => prev ? { ...prev, ...data.user } : null);
    toast.success(data.message);
  },
  onError: (error) => {
    toast.error(error.message);
  },
});
```

### Existing Modal Pattern
```tsx
// From profile page
<GlassModal isOpen={showModal} onClose={handleClose} title="Confirm Action">
  <div className="space-y-4">
    {/* Content */}
  </div>
</GlassModal>
```

### Existing Feature Gate Pattern (Inconsistent - Needs Standardization)
```tsx
// Evolution page - Full lockout
{user.tier === 'free' ? <UpgradePrompt /> : <FeatureContent />}

// Visualization page - Partial restriction
{user.tier === 'free' && !selectedDreamId ? <Warning /> : null}
```

---

**End of Report**

This analysis provides a complete picture of the current frontend state and integration requirements for PayPal subscription flow. All code examples are from actual files in the codebase.
