# Builder Task Breakdown - Iteration 17

## Overview

Iteration 17 focuses on frontend integration for the PayPal subscription system built in Iteration 16. We have **3 primary builders** working in parallel to connect the UI to the backend.

**Backend Integration Points (from Iteration 16):**
- tRPC procedures: `subscriptions.createCheckout`, `subscriptions.cancel`, `subscriptions.getStatus`
- User object includes: `tier`, `reflectionsToday`, `lastReflectionDate`, `cancelAtPeriodEnd`
- Constants: `TIER_LIMITS`, `DAILY_LIMITS`, `DREAM_LIMITS`

**Critical Note on Tier Names:**
The exploration report identified a tier naming mismatch. Per the master plan:
- **Correct tier names:** `free`, `pro`, `unlimited`
- **Pricing:** Free ($0), Pro ($15/mo, $150/yr), Unlimited ($29/mo, $290/yr)
- **Monthly limits:** 2 / 30 / 60
- **Daily limits:** none / 1 / 2

---

## Builder-1: Pricing Page & Checkout Flow

### Priority
**HIGH** - Core monetization feature

### Scope
Update the pricing page to integrate PayPal checkout, add monthly/yearly toggle, handle post-checkout redirects, and show proper tier information for authenticated users.

### Complexity Estimate
**HIGH** - Multiple integration points with PayPal, state management for billing period toggle, URL parameter handling, authentication state awareness

### Success Criteria
- [ ] Pricing page shows correct tier names: Free, Pro, Unlimited
- [ ] Monthly/yearly toggle works with dynamic price display
- [ ] "Start Free" button links to signup for Free tier
- [ ] "Start Pro" and "Start Unlimited" buttons initiate PayPal checkout for authenticated users
- [ ] Unauthenticated users clicking paid tiers are prompted to sign up first
- [ ] Success redirect shows toast and updates user tier immediately
- [ ] Cancel redirect shows informative message
- [ ] Error redirect displays error details
- [ ] Loading states prevent double-clicks during checkout
- [ ] "Current Plan" badge shows on user's active tier

### Files to Create/Modify

**Modify:**
1. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/pricing/page.tsx` - Main pricing page
2. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/constants.ts` - Update tier limits (if needed)

**Create:**
3. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/subscription/CheckoutButton.tsx` - Reusable PayPal checkout button
4. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/subscription/PricingCard.tsx` - Enhanced pricing tier card

### Implementation Steps

#### Step 1: Update Tier Pricing Constants
**File:** `/lib/utils/constants.ts`

Add pricing information:
```typescript
export const TIER_PRICING = {
  pro: {
    monthly: 15,
    yearly: 150,
  },
  unlimited: {
    monthly: 29,
    yearly: 290,
  },
} as const;

export type BillingPeriod = 'monthly' | 'yearly';
```

#### Step 2: Create CheckoutButton Component
**File:** `/components/subscription/CheckoutButton.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/contexts/ToastContext';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import type { TierName, BillingPeriod } from '@/lib/utils/constants';

interface CheckoutButtonProps {
  tier: Exclude<TierName, 'free'>;
  period: BillingPeriod;
  className?: string;
  variant?: 'primary' | 'secondary';
}

export function CheckoutButton({ tier, period, className, variant = 'primary' }: CheckoutButtonProps) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);

  const createCheckoutMutation = trpc.subscriptions.createCheckout.useMutation({
    onSuccess: (data) => {
      // Redirect to PayPal approval page
      window.location.href = data.approvalUrl;
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to start checkout. Please try again.');
      setIsCreatingCheckout(false);
    },
  });

  const handleClick = async () => {
    // Require authentication for paid tiers
    if (!isAuthenticated) {
      router.push(`/auth/signup?plan=${tier}`);
      return;
    }

    // Check if already on this tier
    if (user?.tier === tier) {
      toast.info(`You're already on the ${tier.charAt(0).toUpperCase() + tier.slice(1)} plan.`);
      return;
    }

    // Create PayPal checkout session
    setIsCreatingCheckout(true);
    createCheckoutMutation.mutate({ tier, period });
  };

  return (
    <GlowButton
      variant={variant}
      onClick={handleClick}
      disabled={isCreatingCheckout}
      className={className}
    >
      {isCreatingCheckout ? 'Redirecting to PayPal...' : `Start ${tier.charAt(0).toUpperCase() + tier.slice(1)}`}
    </GlowButton>
  );
}
```

#### Step 3: Create PricingCard Component
**File:** `/components/subscription/PricingCard.tsx`

```typescript
'use client';

import { Check, X } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass/GlassCard';
import { CheckoutButton } from './CheckoutButton';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import Link from 'next/link';
import type { TierName, BillingPeriod } from '@/lib/utils/constants';

interface Feature {
  name: string;
  included: boolean;
}

interface PricingCardProps {
  tier: TierName;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  description: string;
  features: Feature[];
  popular?: boolean;
  currentUserTier?: TierName;
  billingPeriod: BillingPeriod;
}

export function PricingCard({
  tier,
  name,
  monthlyPrice,
  yearlyPrice,
  description,
  features,
  popular = false,
  currentUserTier,
  billingPeriod,
}: PricingCardProps) {
  const isCurrentPlan = tier === currentUserTier;
  const price = billingPeriod === 'monthly' ? monthlyPrice : yearlyPrice;
  const period = billingPeriod === 'monthly' ? 'per month' : 'per year';

  // Calculate savings for yearly
  const yearlySavings = billingPeriod === 'yearly' && tier !== 'free'
    ? Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100)
    : 0;

  return (
    <GlassCard
      elevated
      interactive={popular && !isCurrentPlan}
      className={`relative ${
        popular ? 'border-2 border-purple-500/50 shadow-lg shadow-purple-500/20' : ''
      } ${isCurrentPlan ? 'border-2 border-green-500/50 shadow-lg shadow-green-500/20' : ''}`}
    >
      {/* Popular badge */}
      {popular && !isCurrentPlan && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-semibold px-4 py-1 rounded-full">
          Most Popular
        </div>
      )}

      {/* Current plan badge */}
      {isCurrentPlan && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-semibold px-4 py-1 rounded-full">
          Current Plan
        </div>
      )}

      <div className="p-6">
        <h3 className="text-2xl font-bold text-white mb-2">{name}</h3>
        <p className="text-white/60 text-sm mb-6">{description}</p>

        <div className="mb-6">
          <span className="text-4xl font-bold text-white">${price}</span>
          <span className="text-white/60 ml-2">{period}</span>
          {yearlySavings > 0 && (
            <div className="text-green-400 text-sm mt-1">Save {yearlySavings}% yearly</div>
          )}
        </div>

        {/* CTA Button */}
        <div className="mb-6">
          {tier === 'free' ? (
            <Link href="/auth/signup" className="block">
              <GlowButton variant="secondary" className="w-full">
                {isCurrentPlan ? 'Current Plan' : 'Start Free'}
              </GlowButton>
            </Link>
          ) : isCurrentPlan ? (
            <GlowButton variant="secondary" className="w-full" disabled>
              Current Plan
            </GlowButton>
          ) : (
            <CheckoutButton
              tier={tier as Exclude<TierName, 'free'>}
              period={billingPeriod}
              variant={popular ? 'primary' : 'secondary'}
              className="w-full"
            />
          )}
        </div>

        {/* Features list */}
        <div className="space-y-3">
          {features.map((feature, idx) => (
            <div key={idx} className="flex items-start gap-3">
              {feature.included ? (
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <X className="w-5 h-5 text-white/30 flex-shrink-0 mt-0.5" />
              )}
              <span className={feature.included ? 'text-white' : 'text-white/40'}>
                {feature.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
```

#### Step 4: Update Pricing Page
**File:** `/app/pricing/page.tsx`

Key changes:
1. Add `'use client'` directive
2. Import `useAuth`, `useToast`, `useSearchParams`, `useState`
3. Add monthly/yearly toggle state
4. Handle success/cancel/error URL params on mount
5. Replace hardcoded CTAs with CheckoutButton components
6. Update tier data with correct pricing
7. Add current user tier detection

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import CosmicBackground from '@/components/shared/CosmicBackground';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { PricingCard } from '@/components/subscription/PricingCard';
import { TIER_LIMITS, TIER_PRICING, DAILY_LIMITS, DREAM_LIMITS } from '@/lib/utils/constants';
import type { BillingPeriod } from '@/lib/utils/constants';

export default function PricingPage() {
  const { user } = useAuth();
  const toast = useToast();
  const searchParams = useSearchParams();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');

  // Handle PayPal return redirects
  useEffect(() => {
    const success = searchParams.get('success');
    const cancel = searchParams.get('cancel');
    const error = searchParams.get('error');

    if (success) {
      toast.success('Subscription activated! Welcome to your new tier.');
      // Clean up URL
      window.history.replaceState({}, '', '/pricing');
    } else if (cancel) {
      toast.info('Checkout canceled. Your free tier is still active.');
      window.history.replaceState({}, '', '/pricing');
    } else if (error) {
      toast.error(`Payment failed: ${error}`);
      window.history.replaceState({}, '', '/pricing');
    }
  }, [searchParams, toast]);

  const tiers = [
    {
      tier: 'free' as const,
      name: 'Free',
      monthlyPrice: 0,
      yearlyPrice: 0,
      description: 'Perfect for exploring Mirror of Dreams',
      features: [
        { name: `${TIER_LIMITS.free} reflections per month`, included: true },
        { name: `${DREAM_LIMITS.free} active dreams`, included: true },
        { name: 'Basic AI insights', included: true },
        { name: 'All reflection tones', included: true },
        { name: 'Evolution reports', included: false },
        { name: 'Visualizations', included: false },
        { name: 'Daily reflection limits', included: false },
        { name: 'Priority support', included: false },
      ],
    },
    {
      tier: 'pro' as const,
      name: 'Pro',
      monthlyPrice: TIER_PRICING.pro.monthly,
      yearlyPrice: TIER_PRICING.pro.yearly,
      description: 'For committed dreamers and deep reflection',
      popular: true,
      features: [
        { name: `${TIER_LIMITS.pro} reflections per month`, included: true },
        { name: `${DAILY_LIMITS.pro} reflection per day`, included: true },
        { name: `${DREAM_LIMITS.pro} active dreams`, included: true },
        { name: 'Advanced AI insights', included: true },
        { name: 'All reflection tones', included: true },
        { name: 'Evolution reports', included: true },
        { name: 'Visualizations', included: true },
        { name: 'Priority support', included: true },
      ],
    },
    {
      tier: 'unlimited' as const,
      name: 'Unlimited',
      monthlyPrice: TIER_PRICING.unlimited.monthly,
      yearlyPrice: TIER_PRICING.unlimited.yearly,
      description: 'Maximum reflection capacity for transformation',
      features: [
        { name: `${TIER_LIMITS.unlimited} reflections per month`, included: true },
        { name: `${DAILY_LIMITS.unlimited} reflections per day`, included: true },
        { name: 'Unlimited active dreams', included: true },
        { name: 'Premium AI insights with extended thinking', included: true },
        { name: 'All reflection tones', included: true },
        { name: 'Evolution reports', included: true },
        { name: 'Visualizations', included: true },
        { name: 'Priority support', included: true },
      ],
    },
  ];

  return (
    <div className="min-h-screen relative">
      <CosmicBackground animated intensity={1} />

      {/* Navigation - same as before */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">
            Mirror of Dreams
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/auth/signin" className="text-white/80 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/auth/signup">
              <GlowButton size="sm">Start Free</GlowButton>
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Choose Your Path
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Start free and upgrade as your reflection practice deepens
            </p>
          </div>

          {/* Billing Period Toggle */}
          <div className="flex justify-center items-center gap-4 mb-12">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                billingPeriod === 'yearly'
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Yearly
              <span className="ml-2 text-green-400 text-sm">Save 17%</span>
            </button>
          </div>

          {/* Tier Cards */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-20">
            {tiers.map((tier) => (
              <PricingCard
                key={tier.tier}
                {...tier}
                billingPeriod={billingPeriod}
                currentUserTier={user?.tier}
              />
            ))}
          </div>

          {/* FAQ Section - same as before */}
          {/* ... rest of page unchanged ... */}
        </div>
      </main>
    </div>
  );
}
```

### Dependencies
- Iteration 16 backend (tRPC procedures must be deployed)
- `useAuth` hook must return `tier` property
- Toast context must be available

### Patterns to Follow
- Use existing `GlassCard`, `GlowButton` UI components
- Follow tRPC mutation pattern from profile page (onSuccess/onError handlers)
- Use `useSearchParams()` for URL parameter handling
- Handle loading states to prevent double submissions
- Clean URLs after processing redirect params with `window.history.replaceState()`

### Testing Requirements
- [ ] Test Free tier signup link works
- [ ] Test Pro monthly checkout creates PayPal session
- [ ] Test Pro yearly checkout creates PayPal session
- [ ] Test Unlimited monthly checkout creates PayPal session
- [ ] Test Unlimited yearly checkout creates PayPal session
- [ ] Test unauthenticated user clicking paid tier redirects to signup
- [ ] Test authenticated user on Free tier can upgrade
- [ ] Test success redirect shows toast and updates user
- [ ] Test cancel redirect shows appropriate message
- [ ] Test error redirect displays error
- [ ] Test toggle between monthly/yearly updates prices correctly
- [ ] Test "Current Plan" badge shows for user's active tier

---

## Builder-2: Profile & Dashboard Updates

### Priority
**HIGH** - Critical subscription management interface

### Scope
Add subscription management section to profile page (cancel, reactivate, view billing info) and update dashboard components to reflect new tier names and subscription status.

### Complexity Estimate
**MEDIUM** - Multiple UI components, one new modal, integration with existing profile page

### Success Criteria
- [ ] Profile page displays subscription status card
- [ ] Shows billing period (monthly/yearly)
- [ ] Shows next billing date
- [ ] "Cancel Subscription" button works with confirmation
- [ ] Canceled subscriptions show "canceling at period end" message
- [ ] "Reactivate" button appears for canceled subscriptions (stretch goal)
- [ ] Dashboard SubscriptionCard uses correct tier names
- [ ] Dashboard upgrade links point to `/pricing`
- [ ] Usage warnings appear when user is at 80%+ of monthly limit

### Files to Create/Modify

**Modify:**
1. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/profile/page.tsx` - Add subscription management section
2. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/cards/SubscriptionCard.tsx` - Fix tier names and links

**Create:**
3. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/subscription/CancelSubscriptionModal.tsx` - Confirmation modal for cancellation
4. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/subscription/SubscriptionStatusCard.tsx` - Reusable subscription display

### Implementation Steps

#### Step 1: Create CancelSubscriptionModal
**File:** `/components/subscription/CancelSubscriptionModal.tsx`

```typescript
'use client';

import { useState } from 'react';
import { GlassModal } from '@/components/ui/glass/GlassModal';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { AlertTriangle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/contexts/ToastContext';

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: {
    tier: string;
    period: string;
    expiresAt?: string;
  };
  onSuccess?: () => void;
}

export function CancelSubscriptionModal({
  isOpen,
  onClose,
  subscription,
  onSuccess,
}: CancelSubscriptionModalProps) {
  const toast = useToast();
  const [confirmChecked, setConfirmChecked] = useState(false);

  const cancelMutation = trpc.subscriptions.cancel.useMutation({
    onSuccess: () => {
      toast.success('Subscription canceled. Access continues until period end.');
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to cancel subscription');
    },
  });

  const handleCancel = () => {
    if (!confirmChecked) {
      toast.error('Please confirm you understand the cancellation');
      return;
    }

    cancelMutation.mutate();
  };

  const tierName = subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1);

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title="Cancel Subscription">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-white/80">
            <p className="font-semibold text-white mb-2">Are you sure you want to cancel?</p>
            <p>
              Your {tierName} {subscription.period} subscription will be canceled, but you'll retain
              access until {subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : 'the end of your billing period'}.
            </p>
          </div>
        </div>

        <div className="space-y-2 text-white/80 text-sm">
          <p className="font-semibold text-white">What you'll lose:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            {subscription.tier === 'pro' && (
              <>
                <li>30 reflections per month (back to 2)</li>
                <li>1 daily reflection limit</li>
                <li>Evolution reports</li>
                <li>Visualizations</li>
                <li>Advanced AI model</li>
              </>
            )}
            {subscription.tier === 'unlimited' && (
              <>
                <li>60 reflections per month (back to 2)</li>
                <li>2 daily reflections limit</li>
                <li>Extended thinking AI mode</li>
                <li>Unlimited dreams</li>
                <li>Evolution reports</li>
                <li>Visualizations</li>
              </>
            )}
          </ul>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmChecked}
            onChange={(e) => setConfirmChecked(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-white/30 bg-white/10 text-purple-500 focus:ring-2 focus:ring-purple-500"
          />
          <span className="text-white/80 text-sm">
            I understand I will lose access to {tierName} features at the end of my billing period
          </span>
        </label>

        <div className="flex gap-3 pt-4">
          <GlowButton
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={cancelMutation.isLoading}
          >
            Keep Subscription
          </GlowButton>
          <GlowButton
            variant="primary"
            onClick={handleCancel}
            className="flex-1 bg-red-500/20 hover:bg-red-500/30"
            disabled={!confirmChecked || cancelMutation.isLoading}
          >
            {cancelMutation.isLoading ? 'Canceling...' : 'Cancel Subscription'}
          </GlowButton>
        </div>
      </div>
    </GlassModal>
  );
}
```

#### Step 2: Create SubscriptionStatusCard Component
**File:** `/components/subscription/SubscriptionStatusCard.tsx`

```typescript
'use client';

import { useState } from 'react';
import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { GlowBadge } from '@/components/ui/glass/GlowBadge';
import { CancelSubscriptionModal } from './CancelSubscriptionModal';
import { trpc } from '@/lib/trpc';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export function SubscriptionStatusCard() {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const { data: subscription, isLoading, refetch } = trpc.subscriptions.getStatus.useQuery();

  if (isLoading) {
    return (
      <GlassCard elevated>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Subscription & Billing</h3>
          <div className="text-white/60">Loading...</div>
        </div>
      </GlassCard>
    );
  }

  if (!subscription) {
    return null;
  }

  const tierName = subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1);
  const periodName = subscription.period === 'monthly' ? 'Monthly' : 'Yearly';

  return (
    <>
      <GlassCard elevated>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Subscription & Billing</h3>

          <div className="space-y-4">
            {/* Current Plan */}
            <div>
              <div className="text-sm text-white/60 mb-1">Current Plan</div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-semibold text-white">{tierName}</span>
                {subscription.tier !== 'free' && (
                  <GlowBadge variant={subscription.isActive ? 'success' : 'warning'}>
                    {subscription.status}
                  </GlowBadge>
                )}
              </div>
            </div>

            {/* Billing Period (paid tiers only) */}
            {subscription.tier !== 'free' && (
              <div>
                <div className="text-sm text-white/60 mb-1">Billing Period</div>
                <div className="text-white">{periodName}</div>
              </div>
            )}

            {/* Next Billing Date */}
            {subscription.isActive && subscription.expiresAt && !subscription.isCanceled && (
              <div>
                <div className="text-sm text-white/60 mb-1">Next Billing Date</div>
                <div className="text-white">
                  {new Date(subscription.expiresAt).toLocaleDateString()}
                  <span className="text-white/60 text-sm ml-2">
                    ({formatDistanceToNow(new Date(subscription.expiresAt), { addSuffix: true })})
                  </span>
                </div>
              </div>
            )}

            {/* Cancellation Notice */}
            {subscription.isCanceled && subscription.expiresAt && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-500 font-semibold mb-1">Subscription Canceling</p>
                <p className="text-white/80 text-sm">
                  Your subscription will end on {new Date(subscription.expiresAt).toLocaleDateString()}.
                  You'll be downgraded to Free tier after this date.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              {subscription.tier === 'free' ? (
                <Link href="/pricing" className="flex-1">
                  <GlowButton variant="primary" className="w-full">
                    Upgrade Plan
                  </GlowButton>
                </Link>
              ) : (
                <>
                  <Link href="/pricing" className="flex-1">
                    <GlowButton variant="secondary" className="w-full">
                      Change Plan
                    </GlowButton>
                  </Link>
                  {!subscription.isCanceled && (
                    <GlowButton
                      variant="secondary"
                      onClick={() => setShowCancelModal(true)}
                      className="flex-1"
                    >
                      Cancel
                    </GlowButton>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Cancel Modal */}
      {subscription && (
        <CancelSubscriptionModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          subscription={{
            tier: subscription.tier,
            period: subscription.period || 'monthly',
            expiresAt: subscription.expiresAt || undefined,
          }}
          onSuccess={() => refetch()}
        />
      )}
    </>
  );
}
```

#### Step 3: Add Subscription Section to Profile Page
**File:** `/app/profile/page.tsx`

Add after the "Account Information" section (around line 250):

```typescript
{/* Subscription & Billing Section */}
<SubscriptionStatusCard />
```

Add import at top:
```typescript
import { SubscriptionStatusCard } from '@/components/subscription/SubscriptionStatusCard';
```

#### Step 4: Update Dashboard SubscriptionCard
**File:** `/components/dashboard/cards/SubscriptionCard.tsx`

Key changes:
1. Update tier type to match constants: `'free' | 'pro' | 'unlimited'`
2. Change upgrade link from `/subscription` to `/pricing`
3. Update tier descriptions and benefits

Example updates:
```typescript
// Change upgrade link
<Link href="/pricing">
  <GlowButton size="sm" variant="secondary">Upgrade</GlowButton>
</Link>

// Update tier info
const tierInfo = {
  free: {
    name: 'Free',
    benefits: ['2 reflections/month', '2 active dreams', 'Basic AI'],
  },
  pro: {
    name: 'Pro',
    benefits: ['30 reflections/month', '1/day limit', '5 dreams', 'Evolution reports'],
  },
  unlimited: {
    name: 'Unlimited',
    benefits: ['60 reflections/month', '2/day limit', 'Unlimited dreams', 'Extended thinking'],
  },
};
```

### Dependencies
- Iteration 16 backend (subscriptions router)
- Builder-1 (pricing page) for upgrade flow
- `date-fns` library for date formatting

### Patterns to Follow
- Use existing GlassCard/GlowButton/GlassModal components
- Follow profile page mutation pattern (onSuccess/onError)
- Use tRPC query with refetch for real-time updates
- Handle loading states gracefully

### Testing Requirements
- [ ] Subscription status displays correctly for Free tier
- [ ] Subscription status displays correctly for Pro tier
- [ ] Subscription status displays correctly for Unlimited tier
- [ ] Cancel button opens confirmation modal
- [ ] Cancel confirmation requires checkbox
- [ ] Cancel success refetches subscription data
- [ ] Canceled subscription shows yellow warning banner
- [ ] Next billing date calculates correctly
- [ ] "Change Plan" links to pricing page
- [ ] Dashboard SubscriptionCard upgrade link goes to /pricing

---

## Builder-3: Feature Gating & Daily Limits

### Priority
**MEDIUM** - UX polish and limit enforcement

### Scope
Implement feature locks for evolution reports and visualizations, add daily limit checking to reflection flow, create reusable UpgradeModal component, and standardize upgrade prompts across the app.

### Complexity Estimate
**MEDIUM** - Multiple touchpoints across app, need to coordinate feature gate logic

### Success Criteria
- [ ] Free tier users see lock overlay on evolution reports page
- [ ] Free tier users see lock overlay on visualizations page (cross-dream only)
- [ ] Reflection flow checks daily limit before allowing creation
- [ ] Daily limit error shows countdown to next day
- [ ] Monthly limit error shows upgrade prompt
- [ ] UpgradeModal is reusable across all gated features
- [ ] All upgrade CTAs point to `/pricing`
- [ ] Usage warning appears when user is at 80%+ of monthly limit

### Files to Create/Modify

**Create:**
1. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/subscription/UpgradeModal.tsx` - Reusable upgrade prompt modal
2. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/subscription/UsageWarningBanner.tsx` - Usage status banner
3. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/subscription/FeatureLockOverlay.tsx` - Generic feature lock UI

**Modify:**
4. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/reflection/MirrorExperience.tsx` - Add limit checks
5. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/evolution/page.tsx` - Update upgrade link
6. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/visualizations/page.tsx` - Verify lock works
7. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/dashboard/page.tsx` - Add usage warnings

### Implementation Steps

#### Step 1: Create UpgradeModal Component
**File:** `/components/subscription/UpgradeModal.tsx`

```typescript
'use client';

import { GlassModal } from '@/components/ui/glass/GlassModal';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { Lock, Zap, Infinity } from 'lucide-react';
import Link from 'next/link';
import { TIER_PRICING } from '@/lib/utils/constants';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: 'monthly_limit' | 'daily_limit' | 'feature_locked';
  featureName?: string;
  resetTime?: Date; // For daily limit countdown
}

export function UpgradeModal({
  isOpen,
  onClose,
  reason,
  featureName,
  resetTime,
}: UpgradeModalProps) {
  const getTitle = () => {
    switch (reason) {
      case 'monthly_limit':
        return 'Monthly Reflection Limit Reached';
      case 'daily_limit':
        return 'Daily Reflection Limit Reached';
      case 'feature_locked':
        return `Unlock ${featureName || 'This Feature'}`;
      default:
        return 'Upgrade to Continue';
    }
  };

  const getMessage = () => {
    switch (reason) {
      case 'monthly_limit':
        return "You've used all your reflections for this month. Upgrade to continue your journey.";
      case 'daily_limit':
        return resetTime
          ? `You've reached your daily reflection limit. Try again after ${resetTime.toLocaleTimeString()}.`
          : "You've reached your daily reflection limit. Try again tomorrow.";
      case 'feature_locked':
        return `${featureName || 'This feature'} is available on Pro and Unlimited plans.`;
      default:
        return 'Upgrade to unlock more features.';
    }
  };

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title={getTitle()}>
      <div className="space-y-6">
        <p className="text-white/80">{getMessage()}</p>

        {/* Quick Tier Comparison */}
        <div className="grid grid-cols-2 gap-4">
          {/* Pro Tier */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-purple-400" />
              <h4 className="font-semibold text-white">Pro</h4>
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              ${TIER_PRICING.pro.monthly}
              <span className="text-sm text-white/60">/mo</span>
            </p>
            <ul className="text-sm text-white/80 space-y-1">
              <li>• 30 reflections/month</li>
              <li>• 1 per day</li>
              <li>• Evolution reports</li>
              <li>• Visualizations</li>
            </ul>
            <Link href="/pricing" className="block mt-3">
              <GlowButton variant="primary" className="w-full" onClick={onClose}>
                Choose Pro
              </GlowButton>
            </Link>
          </div>

          {/* Unlimited Tier */}
          <div className="p-4 bg-white/5 border border-purple-500/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Infinity className="w-5 h-5 text-purple-400" />
              <h4 className="font-semibold text-white">Unlimited</h4>
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              ${TIER_PRICING.unlimited.monthly}
              <span className="text-sm text-white/60">/mo</span>
            </p>
            <ul className="text-sm text-white/80 space-y-1">
              <li>• 60 reflections/month</li>
              <li>• 2 per day</li>
              <li>• Extended thinking AI</li>
              <li>• Unlimited dreams</li>
            </ul>
            <Link href="/pricing" className="block mt-3">
              <GlowButton variant="primary" className="w-full" onClick={onClose}>
                Choose Unlimited
              </GlowButton>
            </Link>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/pricing"
            className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
            onClick={onClose}
          >
            View full pricing comparison →
          </Link>
        </div>
      </div>
    </GlassModal>
  );
}
```

#### Step 2: Create UsageWarningBanner Component
**File:** `/components/subscription/UsageWarningBanner.tsx`

```typescript
'use client';

import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { TIER_LIMITS } from '@/lib/utils/constants';
import type { TierName } from '@/lib/utils/constants';

interface UsageWarningBannerProps {
  tier: TierName;
  used: number;
  variant?: 'warning' | 'error' | 'info';
}

export function UsageWarningBanner({ tier, used, variant = 'warning' }: UsageWarningBannerProps) {
  const limit = TIER_LIMITS[tier];
  const percentage = (used / limit) * 100;
  const remaining = limit - used;

  // Don't show banner if user has plenty of reflections left
  if (percentage < 80 || tier === 'unlimited') {
    return null;
  }

  const colors = {
    warning: 'border-yellow-500/50 bg-yellow-500/10',
    error: 'border-red-500/50 bg-red-500/10',
    info: 'border-blue-500/50 bg-blue-500/10',
  };

  const icons = {
    warning: AlertTriangle,
    error: AlertTriangle,
    info: TrendingUp,
  };

  const Icon = icons[variant];

  return (
    <GlassCard className={`border-l-4 ${colors[variant]}`}>
      <div className="flex items-start gap-4">
        <Icon className={`w-6 h-6 flex-shrink-0 mt-1 ${
          variant === 'error' ? 'text-red-500' :
          variant === 'warning' ? 'text-yellow-500' :
          'text-blue-500'
        }`} />

        <div className="flex-1">
          <h4 className="text-white font-semibold mb-1">
            {remaining === 0 ? 'Reflection Limit Reached' : 'Almost at Your Limit'}
          </h4>
          <p className="text-white/80 text-sm mb-3">
            {remaining === 0
              ? `You've used all ${limit} reflections this month. Upgrade to continue.`
              : `You have ${remaining} reflection${remaining === 1 ? '' : 's'} remaining this month.`
            }
          </p>

          {/* Progress bar */}
          <div className="w-full bg-white/10 rounded-full h-2 mb-3">
            <div
              className={`h-2 rounded-full transition-all ${
                percentage >= 100 ? 'bg-red-500' :
                percentage >= 90 ? 'bg-yellow-500' :
                'bg-blue-500'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-white/60 text-sm">
              {used} / {limit} reflections used
            </span>
          </div>
        </div>

        {remaining === 0 && (
          <Link href="/pricing">
            <GlowButton variant="primary" size="sm">
              Upgrade Now
            </GlowButton>
          </Link>
        )}
      </div>
    </GlassCard>
  );
}
```

#### Step 3: Create FeatureLockOverlay Component
**File:** `/components/subscription/FeatureLockOverlay.tsx`

```typescript
'use client';

import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { GlowBadge } from '@/components/ui/glass/GlowBadge';
import { Lock } from 'lucide-react';
import Link from 'next/link';

interface FeatureLockOverlayProps {
  featureName: string;
  description: string;
  requiredTier: 'pro' | 'unlimited';
  children?: React.ReactNode;
}

export function FeatureLockOverlay({
  featureName,
  description,
  requiredTier,
  children,
}: FeatureLockOverlayProps) {
  const tierName = requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1);

  return (
    <GlassCard elevated className="border-l-4 border-purple-500/50">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-purple-500/20 rounded-lg">
          <Lock className="w-6 h-6 text-purple-400" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-semibold text-white">{featureName}</h3>
            <GlowBadge variant="warning">{tierName}+</GlowBadge>
          </div>

          <p className="text-white/80 mb-4">{description}</p>

          {children && (
            <div className="text-white/60 text-sm mb-4">
              {children}
            </div>
          )}

          <Link href="/pricing">
            <GlowButton variant="primary">
              Upgrade to {tierName}
            </GlowButton>
          </Link>
        </div>
      </div>
    </GlassCard>
  );
}
```

#### Step 4: Add Limit Checking to Reflection Flow
**File:** `/app/reflection/MirrorExperience.tsx`

Add at the beginning of the component:

```typescript
const { user } = useAuth();
const [showUpgradeModal, setShowUpgradeModal] = useState(false);
const [upgradeReason, setUpgradeReason] = useState<'monthly_limit' | 'daily_limit' | 'feature_locked'>('monthly_limit');

// Check limits before submission
const checkLimits = () => {
  if (!user) return false;

  // Check monthly limit
  const monthlyLimit = TIER_LIMITS[user.tier];
  if (user.reflectionCountThisMonth >= monthlyLimit) {
    setUpgradeReason('monthly_limit');
    setShowUpgradeModal(true);
    return false;
  }

  // Check daily limit (Pro and Unlimited only)
  if (user.tier === 'pro' || user.tier === 'unlimited') {
    const dailyLimit = DAILY_LIMITS[user.tier];
    const today = new Date().toISOString().split('T')[0];

    if (user.lastReflectionDate === today && user.reflectionsToday >= dailyLimit) {
      setUpgradeReason('daily_limit');
      setShowUpgradeModal(true);
      return false;
    }
  }

  return true;
};

// In form submission handler, add limit check:
const handleSubmit = async () => {
  if (!checkLimits()) {
    return;
  }

  // ... existing submission logic
};
```

Add UpgradeModal to render:
```typescript
<UpgradeModal
  isOpen={showUpgradeModal}
  onClose={() => setShowUpgradeModal(false)}
  reason={upgradeReason}
/>
```

#### Step 5: Update Evolution Page
**File:** `/app/evolution/page.tsx`

Change line with upgrade button from:
```typescript
router.push('/dashboard')
```

To:
```typescript
router.push('/pricing')
```

Or better, replace the inline lock UI with the new component:
```typescript
{user.tier === 'free' ? (
  <FeatureLockOverlay
    featureName="Evolution Reports"
    description="Track your growth and transformation over time with AI-powered evolution analysis."
    requiredTier="pro"
  >
    <p>Evolution reports analyze patterns across your reflections to show you:</p>
    <ul className="list-disc list-inside mt-2 space-y-1">
      <li>Recurring themes and insights</li>
      <li>Growth patterns over time</li>
      <li>Dream evolution trajectories</li>
    </ul>
  </FeatureLockOverlay>
) : (
  // Existing generation UI
)}
```

#### Step 6: Add Usage Warning to Dashboard
**File:** `/app/dashboard/page.tsx`

Add after DashboardHero or at top of main content area:

```typescript
{user && (
  <UsageWarningBanner
    tier={user.tier}
    used={user.reflectionCountThisMonth}
    variant={
      user.reflectionCountThisMonth >= TIER_LIMITS[user.tier] ? 'error' :
      user.reflectionCountThisMonth / TIER_LIMITS[user.tier] >= 0.9 ? 'warning' :
      'info'
    }
  />
)}
```

### Dependencies
- Builder-1 (pricing page must be ready)
- Iteration 16 backend (limit enforcement)
- User object must include `reflectionsToday`, `lastReflectionDate`

### Patterns to Follow
- Use existing GlassCard/GlowButton/GlassModal components
- Centralize limit checking logic in reusable functions
- Use UpgradeModal consistently across all gated features
- Link all upgrade CTAs to `/pricing`

### Testing Requirements
- [ ] Free tier sees lock on evolution reports
- [ ] Free tier sees lock on cross-dream visualizations
- [ ] Free tier can still use single-dream visualizations
- [ ] Pro tier with 0 reflections remaining sees upgrade modal
- [ ] Pro tier with 1 daily reflection used today sees daily limit error
- [ ] Unlimited tier with 2 daily reflections used sees daily limit error
- [ ] UpgradeModal displays correct messaging for each reason
- [ ] All upgrade buttons link to /pricing
- [ ] Usage warning appears at 80%, 90%, 100% thresholds
- [ ] Dashboard shows usage warning when appropriate

---

## Builder Execution Order

### Phase 1: Foundation (Parallel)
Start these together as they have no interdependencies:

**Builder-1:** Update constants and create pricing components
**Builder-3:** Create UpgradeModal and feature lock components

### Phase 2: Integration (Sequential)
After Phase 1 completes:

**Builder-2:** Add subscription management to profile (depends on Builder-1 pricing page being ready)
**Builder-3:** Add limit checks to reflection flow and update feature gates

### Phase 3: Polish (Parallel)
Final touches:

**Builder-2:** Update dashboard components
**Builder-3:** Add usage warnings across app

## Integration Notes

### Shared Components
All builders will use these shared UI components:
- `GlassCard` - Card container
- `GlowButton` - Primary CTA button
- `GlassModal` - Modal dialogs
- `GlowBadge` - Status badges

### Shared Constants
All builders reference:
- `TIER_LIMITS` - Monthly reflection limits
- `DAILY_LIMITS` - Daily reflection limits
- `TIER_PRICING` - Subscription pricing

### Potential Conflicts
- **None expected** - Builders work on separate files
- Profile page and dashboard are modified by different builders but in different sections
- All share the same tRPC procedures from Iteration 16

### Communication Protocol
If you need to coordinate:
1. Builder-1 creates pricing constants first
2. Builder-2 and Builder-3 reference those constants
3. Builder-3 creates UpgradeModal first (Builder-2 may want to use it)

## Success Metrics

### Must Have (MVP)
- [ ] Users can initiate PayPal checkout from pricing page
- [ ] Users can cancel subscription from profile
- [ ] Feature locks work for evolution/visualizations
- [ ] Daily limits prevent excess reflections
- [ ] Monthly limits enforced with upgrade prompts

### Nice to Have (Polish)
- [ ] Smooth monthly/yearly toggle animations
- [ ] Usage warnings proactively shown
- [ ] Consistent upgrade messaging across app
- [ ] "Current Plan" badges on pricing page

### Testing Checklist
- [ ] Free user can sign up
- [ ] Free user can upgrade to Pro monthly
- [ ] Free user can upgrade to Pro yearly
- [ ] Free user can upgrade to Unlimited monthly
- [ ] Free user can upgrade to Unlimited yearly
- [ ] Pro user can cancel subscription
- [ ] Canceled subscription retains access until period end
- [ ] Free user blocked from evolution reports
- [ ] Free user blocked from cross-dream visualizations
- [ ] Pro user can create 1 reflection per day max
- [ ] Unlimited user can create 2 reflections per day max
- [ ] Monthly limits enforced at tier boundaries
- [ ] Success redirect updates user tier immediately
- [ ] Dashboard shows correct tier information

---

**End of Builder Tasks**

Each builder has clear scope, dependencies, and success criteria. Follow the patterns document for code examples and integration guidance.
