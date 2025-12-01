# Code Patterns for Iteration 17 - Frontend Integration

## Pattern 1: PayPal Checkout Button Component

### When to Use
Any time you need to initiate a PayPal subscription checkout (pricing page, upgrade prompts, modals)

### Full Implementation
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
  onSuccess?: () => void;
}

export function CheckoutButton({
  tier,
  period,
  className,
  variant = 'primary',
  onSuccess,
}: CheckoutButtonProps) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);

  const createCheckoutMutation = trpc.subscriptions.createCheckout.useMutation({
    onSuccess: (data) => {
      // Store intended destination before redirect (optional)
      sessionStorage.setItem('checkout_return_url', window.location.pathname);

      // Redirect to PayPal approval page
      window.location.href = data.approvalUrl;

      // Call optional success callback
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to start checkout. Please try again.');
      setIsCreatingCheckout(false);
    },
  });

  const handleClick = async () => {
    // Require authentication for paid tiers
    if (!isAuthenticated) {
      // Store intended plan in URL for post-signup redirect
      router.push(`/auth/signup?plan=${tier}&period=${period}`);
      return;
    }

    // Check if already on this tier
    if (user?.tier === tier) {
      toast.info(`You're already on the ${tier.charAt(0).toUpperCase() + tier.slice(1)} plan.`);
      return;
    }

    // Prevent double-clicks
    if (isCreatingCheckout) {
      return;
    }

    // Create PayPal checkout session
    setIsCreatingCheckout(true);
    createCheckoutMutation.mutate({ tier, period });
  };

  const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);

  return (
    <GlowButton
      variant={variant}
      onClick={handleClick}
      disabled={isCreatingCheckout}
      className={className}
    >
      {isCreatingCheckout ? 'Redirecting to PayPal...' : `Start ${tierName}`}
    </GlowButton>
  );
}
```

### Key Points
- Always check authentication before proceeding
- Prevent double-clicks with loading state
- Store context in sessionStorage before redirect (optional but helpful for UX)
- Handle errors gracefully with toast notifications
- Disable button during checkout creation to prevent race conditions

---

## Pattern 2: PayPal Return URL Handling

### When to Use
On any page that PayPal redirects back to (typically pricing page, but could be dashboard or profile)

### Full Implementation
```typescript
'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { trpc } from '@/lib/trpc';

export default function PricingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const utils = trpc.useContext();

  // Handle PayPal return redirects
  useEffect(() => {
    const success = searchParams.get('success');
    const cancel = searchParams.get('cancel');
    const error = searchParams.get('error');
    const subscriptionId = searchParams.get('subscription_id');

    if (success) {
      toast.success('Subscription activated! Welcome to your new tier.');

      // Force refetch user data to get updated tier
      utils.users.me.invalidate();

      // Get stored return URL if exists
      const returnUrl = sessionStorage.getItem('checkout_return_url');
      sessionStorage.removeItem('checkout_return_url');

      // Clean up URL parameters
      window.history.replaceState({}, '', '/pricing');

      // Optional: redirect to stored destination after short delay
      if (returnUrl && returnUrl !== '/pricing') {
        setTimeout(() => {
          router.push(returnUrl);
        }, 2000);
      }

    } else if (cancel) {
      toast.info('Checkout canceled. Your current plan is still active.');
      window.history.replaceState({}, '', '/pricing');

    } else if (error) {
      toast.error(`Payment failed: ${error}`);
      window.history.replaceState({}, '', '/pricing');
    }
  }, [searchParams, toast, utils, router]);

  return (
    // ... page content
  );
}
```

### Key Points
- Use `useSearchParams()` from Next.js for URL parameter access
- Invalidate user query cache to force refetch with updated tier
- Clean URLs with `window.history.replaceState()` to remove parameters
- Handle all three return scenarios: success, cancel, error
- Use sessionStorage to restore user's intended destination after checkout

---

## Pattern 3: Subscription Status Display

### When to Use
Profile page, account settings, or anywhere you need to show current subscription details

### Full Implementation
```typescript
'use client';

import { useState } from 'react';
import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { GlowBadge } from '@/components/ui/glass/GlowBadge';
import { trpc } from '@/lib/trpc';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export function SubscriptionStatusCard() {
  const { data: subscription, isLoading, refetch } = trpc.subscriptions.getStatus.useQuery();

  if (isLoading) {
    return (
      <GlassCard elevated>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-white/10 rounded w-1/3"></div>
            <div className="h-8 bg-white/10 rounded w-1/2"></div>
            <div className="h-4 bg-white/10 rounded w-2/3"></div>
          </div>
        </div>
      </GlassCard>
    );
  }

  if (!subscription) {
    return null;
  }

  const tierName = subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1);
  const periodName = subscription.period === 'monthly' ? 'Monthly' : 'Yearly';

  // Determine status badge variant
  const statusVariant = subscription.isActive ? 'success' :
                        subscription.isCanceled ? 'warning' :
                        'default';

  return (
    <GlassCard elevated>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Subscription & Billing
        </h3>

        <div className="space-y-4">
          {/* Current Plan */}
          <div>
            <div className="text-sm text-white/60 mb-1">Current Plan</div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-semibold text-white">{tierName}</span>
              {subscription.tier !== 'free' && subscription.status && (
                <GlowBadge variant={statusVariant}>
                  {subscription.status.replace('_', ' ')}
                </GlowBadge>
              )}
            </div>
          </div>

          {/* Billing Period (paid tiers only) */}
          {subscription.tier !== 'free' && subscription.period && (
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
                {new Date(subscription.expiresAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
                <span className="text-white/60 text-sm ml-2">
                  ({formatDistanceToNow(new Date(subscription.expiresAt), { addSuffix: true })})
                </span>
              </div>
            </div>
          )}

          {/* Cancellation Notice */}
          {subscription.isCanceled && subscription.expiresAt && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-500 font-semibold mb-1">
                Subscription Canceling
              </p>
              <p className="text-white/80 text-sm">
                Your subscription will end on{' '}
                {new Date(subscription.expiresAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}.
                You'll be downgraded to Free tier after this date.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            {subscription.tier === 'free' ? (
              <Link href="/pricing" className="flex-1">
                <GlowButton variant="primary" className="w-full">
                  Upgrade Plan
                </GlowButton>
              </Link>
            ) : (
              <Link href="/pricing" className="flex-1">
                <GlowButton variant="secondary" className="w-full">
                  Change Plan
                </GlowButton>
              </Link>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
```

### Key Points
- Use tRPC query to fetch subscription status
- Show loading skeleton while fetching
- Format dates with `date-fns` for consistency
- Display different UI for free vs paid tiers
- Show cancellation warning with clear date
- Use semantic badge colors (green=active, yellow=canceling)

---

## Pattern 4: Subscription Cancellation Modal

### When to Use
When user clicks "Cancel Subscription" - requires confirmation before proceeding

### Full Implementation
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
      setConfirmChecked(false); // Reset for next time
      onSuccess?.(); // Trigger parent refetch
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

  const handleClose = () => {
    if (!cancelMutation.isLoading) {
      setConfirmChecked(false);
      onClose();
    }
  };

  const tierName = subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1);
  const expiryDate = subscription.expiresAt
    ? new Date(subscription.expiresAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'the end of your billing period';

  return (
    <GlassModal isOpen={isOpen} onClose={handleClose} title="Cancel Subscription">
      <div className="space-y-4">
        {/* Warning Banner */}
        <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-white/80">
            <p className="font-semibold text-white mb-2">
              Are you sure you want to cancel?
            </p>
            <p>
              Your {tierName} {subscription.period} subscription will be canceled, but you'll
              retain access until {expiryDate}.
            </p>
          </div>
        </div>

        {/* What You'll Lose */}
        <div className="space-y-2 text-white/80 text-sm">
          <p className="font-semibold text-white">What you'll lose:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            {subscription.tier === 'pro' && (
              <>
                <li>30 reflections per month (back to 2)</li>
                <li>1 daily reflection limit</li>
                <li>5 active dreams (back to 2)</li>
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
                <li>Unlimited dreams (back to 2)</li>
                <li>Evolution reports</li>
                <li>Visualizations</li>
              </>
            )}
          </ul>
        </div>

        {/* Confirmation Checkbox */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={confirmChecked}
            onChange={(e) => setConfirmChecked(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-white/30 bg-white/10 text-purple-500 focus:ring-2 focus:ring-purple-500 cursor-pointer"
          />
          <span className="text-white/80 text-sm group-hover:text-white transition-colors">
            I understand I will lose access to {tierName} features at the end of my billing period
          </span>
        </label>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <GlowButton
            variant="secondary"
            onClick={handleClose}
            className="flex-1"
            disabled={cancelMutation.isLoading}
          >
            Keep Subscription
          </GlowButton>
          <GlowButton
            variant="primary"
            onClick={handleCancel}
            className="flex-1 bg-red-500/20 hover:bg-red-500/30 border-red-500/50"
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

### Key Points
- Require explicit confirmation checkbox before allowing cancellation
- Show clear warning about what user will lose
- Display when access will actually end (not immediately)
- Prevent closing during mutation with `isLoading` check
- Reset checkbox state after close
- Use destructive red styling for cancel button
- Call `onSuccess` callback to trigger parent component refetch

---

## Pattern 5: Feature Lock Overlay

### When to Use
Any premium feature that free tier users should not access (evolution reports, visualizations, etc.)

### Full Implementation
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
  benefits?: string[];
  className?: string;
}

export function FeatureLockOverlay({
  featureName,
  description,
  requiredTier,
  benefits,
  className,
}: FeatureLockOverlayProps) {
  const tierName = requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1);

  return (
    <GlassCard elevated className={`border-l-4 border-purple-500/50 ${className}`}>
      <div className="flex items-start gap-4">
        {/* Lock Icon */}
        <div className="p-3 bg-purple-500/20 rounded-lg flex-shrink-0">
          <Lock className="w-6 h-6 text-purple-400" />
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="text-xl font-semibold text-white">{featureName}</h3>
            <GlowBadge variant="warning">{tierName}+</GlowBadge>
          </div>

          {/* Description */}
          <p className="text-white/80 mb-4">{description}</p>

          {/* Benefits List (optional) */}
          {benefits && benefits.length > 0 && (
            <div className="mb-4">
              <p className="text-white/60 text-sm mb-2">This feature includes:</p>
              <ul className="list-disc list-inside space-y-1 text-white/60 text-sm ml-2">
                {benefits.map((benefit, idx) => (
                  <li key={idx}>{benefit}</li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA */}
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

### Usage Example
```typescript
// In evolution page
{user.tier === 'free' ? (
  <FeatureLockOverlay
    featureName="Evolution Reports"
    description="Track your growth and transformation over time with AI-powered evolution analysis."
    requiredTier="pro"
    benefits={[
      'Recurring themes and insights',
      'Growth patterns over time',
      'Dream evolution trajectories',
      'Monthly progress reports',
    ]}
  />
) : (
  // Feature content for Pro+ users
  <EvolutionReportsGenerator />
)}
```

### Key Points
- Clear visual indicator (lock icon) that feature is locked
- Badge shows which tier is required
- Optional benefits list to show value proposition
- Always link to pricing page for upgrade
- Reusable across all premium features

---

## Pattern 6: Usage Warning Banner

### When to Use
Dashboard, reflection page, or anywhere to show proactive warnings about approaching limits

### Full Implementation
```typescript
'use client';

import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { AlertTriangle, TrendingUp, Ban } from 'lucide-react';
import Link from 'next/link';
import { TIER_LIMITS } from '@/lib/utils/constants';
import type { TierName } from '@/lib/utils/constants';

interface UsageWarningBannerProps {
  tier: TierName;
  used: number;
  variant?: 'info' | 'warning' | 'error';
  className?: string;
}

export function UsageWarningBanner({
  tier,
  used,
  variant = 'warning',
  className,
}: UsageWarningBannerProps) {
  const limit = TIER_LIMITS[tier];
  const percentage = Math.min((used / limit) * 100, 100);
  const remaining = Math.max(limit - used, 0);

  // Auto-determine variant if not specified
  if (variant === 'warning') {
    if (percentage >= 100) {
      variant = 'error';
    } else if (percentage < 80) {
      variant = 'info';
    }
  }

  // Don't show banner if user has plenty left
  if (percentage < 80 && variant === 'info') {
    return null;
  }

  const config = {
    info: {
      color: 'blue',
      icon: TrendingUp,
      title: 'Reflection Usage',
      bgClass: 'bg-blue-500/10 border-blue-500/30',
      iconClass: 'text-blue-500',
      progressClass: 'bg-blue-500',
    },
    warning: {
      color: 'yellow',
      icon: AlertTriangle,
      title: 'Almost at Your Limit',
      bgClass: 'bg-yellow-500/10 border-yellow-500/30',
      iconClass: 'text-yellow-500',
      progressClass: 'bg-yellow-500',
    },
    error: {
      color: 'red',
      icon: Ban,
      title: 'Reflection Limit Reached',
      bgClass: 'bg-red-500/10 border-red-500/30',
      iconClass: 'text-red-500',
      progressClass: 'bg-red-500',
    },
  };

  const { icon: Icon, title, bgClass, iconClass, progressClass } = config[variant];

  const getMessage = () => {
    if (remaining === 0) {
      return `You've used all ${limit} reflections this month. Upgrade to continue your journey.`;
    }
    if (remaining === 1) {
      return `You have 1 reflection remaining this month.`;
    }
    if (percentage >= 90) {
      return `You have ${remaining} reflections remaining this month. Consider upgrading for more capacity.`;
    }
    return `You've used ${used} of ${limit} reflections this month.`;
  };

  return (
    <GlassCard className={`border-l-4 ${bgClass} ${className}`}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <Icon className={`w-6 h-6 flex-shrink-0 mt-1 ${iconClass}`} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h4 className="text-white font-semibold mb-1">{title}</h4>

          {/* Message */}
          <p className="text-white/80 text-sm mb-3">{getMessage()}</p>

          {/* Progress Bar */}
          <div className="w-full bg-white/10 rounded-full h-2 mb-3 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${progressClass}`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Usage Stats */}
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-sm">
              {used} / {limit} reflections used
            </span>
            <span className="text-white/60 text-sm">
              {percentage.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Upgrade CTA (only when limit reached) */}
        {remaining === 0 && (
          <div className="flex-shrink-0">
            <Link href="/pricing">
              <GlowButton variant="primary" size="sm">
                Upgrade
              </GlowButton>
            </Link>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
```

### Usage Example
```typescript
// In dashboard
import { UsageWarningBanner } from '@/components/subscription/UsageWarningBanner';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      {/* Show usage warning if user is approaching or at limit */}
      {user && (
        <UsageWarningBanner
          tier={user.tier}
          used={user.reflectionCountThisMonth}
        />
      )}

      {/* Rest of dashboard */}
    </div>
  );
}
```

### Key Points
- Auto-determines severity variant based on percentage
- Shows progress bar for visual feedback
- Only displays when user is at 80%+ usage
- Includes upgrade CTA when limit is reached
- Uses semantic colors (blue → yellow → red)

---

## Pattern 7: Upgrade Modal (Reusable)

### When to Use
Triggered when user hits any limit or tries to access locked feature

### Full Implementation
```typescript
'use client';

import { GlassModal } from '@/components/ui/glass/GlassModal';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { Lock, Zap, Infinity, Clock } from 'lucide-react';
import Link from 'next/link';
import { TIER_PRICING } from '@/lib/utils/constants';

type UpgradeReason = 'monthly_limit' | 'daily_limit' | 'feature_locked' | 'dream_limit';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: UpgradeReason;
  featureName?: string;
  resetTime?: Date; // For daily limit countdown
  currentTier?: string;
}

export function UpgradeModal({
  isOpen,
  onClose,
  reason,
  featureName,
  resetTime,
  currentTier = 'free',
}: UpgradeModalProps) {
  const getContent = () => {
    switch (reason) {
      case 'monthly_limit':
        return {
          icon: Infinity,
          title: 'Monthly Reflection Limit Reached',
          message: "You've used all your reflections for this month. Upgrade to continue your journey of transformation.",
        };
      case 'daily_limit':
        return {
          icon: Clock,
          title: 'Daily Reflection Limit Reached',
          message: resetTime
            ? `You've reached your daily reflection limit. Try again after ${resetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, or upgrade for more capacity.`
            : "You've reached your daily reflection limit. Try again tomorrow, or upgrade for more capacity.",
        };
      case 'feature_locked':
        return {
          icon: Lock,
          title: `Unlock ${featureName || 'This Feature'}`,
          message: `${featureName || 'This feature'} is available on Pro and Unlimited plans. Upgrade to unlock deeper insights.`,
        };
      case 'dream_limit':
        return {
          icon: Zap,
          title: 'Dream Limit Reached',
          message: "You've reached your active dream limit. Upgrade to track more dreams simultaneously.",
        };
      default:
        return {
          icon: Lock,
          title: 'Upgrade to Continue',
          message: 'Upgrade to unlock more features and deepen your reflection practice.',
        };
    }
  };

  const { icon: Icon, title, message } = getContent();

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        {/* Icon and Message */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-purple-500/20 rounded-lg flex-shrink-0">
            <Icon className="w-6 h-6 text-purple-400" />
          </div>
          <p className="text-white/80 pt-2">{message}</p>
        </div>

        {/* Tier Comparison Cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Pro Tier */}
          <div className={`p-4 rounded-lg border transition-all ${
            currentTier === 'free'
              ? 'bg-white/5 border-white/10 hover:border-purple-500/50'
              : 'bg-white/5 border-white/10 opacity-50'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-purple-400" />
              <h4 className="font-semibold text-white">Pro</h4>
            </div>

            <p className="text-2xl font-bold text-white mb-1">
              ${TIER_PRICING.pro.monthly}
              <span className="text-sm text-white/60 font-normal">/mo</span>
            </p>

            <ul className="text-sm text-white/80 space-y-1.5 mb-4">
              <li>• 30 reflections/month</li>
              <li>• 1 reflection per day</li>
              <li>• 5 active dreams</li>
              <li>• Evolution reports</li>
              <li>• Visualizations</li>
            </ul>

            {currentTier === 'free' && (
              <Link href="/pricing" className="block">
                <GlowButton variant="primary" className="w-full" onClick={onClose}>
                  Choose Pro
                </GlowButton>
              </Link>
            )}
          </div>

          {/* Unlimited Tier */}
          <div className="p-4 bg-white/5 border-2 border-purple-500/30 rounded-lg hover:border-purple-500/50 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <Infinity className="w-5 h-5 text-purple-400" />
              <h4 className="font-semibold text-white">Unlimited</h4>
            </div>

            <p className="text-2xl font-bold text-white mb-1">
              ${TIER_PRICING.unlimited.monthly}
              <span className="text-sm text-white/60 font-normal">/mo</span>
            </p>

            <ul className="text-sm text-white/80 space-y-1.5 mb-4">
              <li>• 60 reflections/month</li>
              <li>• 2 reflections per day</li>
              <li>• Unlimited dreams</li>
              <li>• Extended thinking AI</li>
              <li>• All Pro features</li>
            </ul>

            <Link href="/pricing" className="block">
              <GlowButton variant="primary" className="w-full" onClick={onClose}>
                Choose Unlimited
              </GlowButton>
            </Link>
          </div>
        </div>

        {/* Annual Pricing Note */}
        <div className="text-center">
          <p className="text-white/60 text-sm mb-2">
            Save 17% with annual billing
          </p>
          <Link
            href="/pricing"
            className="text-purple-400 hover:text-purple-300 text-sm transition-colors inline-flex items-center gap-1"
            onClick={onClose}
          >
            View full pricing comparison
            <span>→</span>
          </Link>
        </div>
      </div>
    </GlassModal>
  );
}
```

### Usage Example
```typescript
// In reflection flow
const [showUpgradeModal, setShowUpgradeModal] = useState(false);
const [upgradeReason, setUpgradeReason] = useState<UpgradeReason>('monthly_limit');

const handleSubmitReflection = () => {
  // Check monthly limit
  if (user.reflectionCountThisMonth >= TIER_LIMITS[user.tier]) {
    setUpgradeReason('monthly_limit');
    setShowUpgradeModal(true);
    return;
  }

  // Check daily limit
  const today = new Date().toISOString().split('T')[0];
  if (user.lastReflectionDate === today && user.reflectionsToday >= DAILY_LIMITS[user.tier]) {
    setUpgradeReason('daily_limit');
    setShowUpgradeModal(true);
    return;
  }

  // Proceed with submission...
};

return (
  <>
    {/* Your form */}

    <UpgradeModal
      isOpen={showUpgradeModal}
      onClose={() => setShowUpgradeModal(false)}
      reason={upgradeReason}
      currentTier={user.tier}
    />
  </>
);
```

### Key Points
- Single reusable component for all upgrade prompts
- Customizes icon, title, and message based on reason
- Shows tier comparison with clear pricing
- Highlights Unlimited tier with border
- Links directly to pricing page
- Can show countdown for daily limit reset

---

## Pattern 8: Daily Limit Checking

### When to Use
Before allowing reflection creation, to enforce daily limits

### Full Implementation
```typescript
import { DAILY_LIMITS, TIER_LIMITS } from '@/lib/utils/constants';
import type { User } from '@/types/user';

/**
 * Check if user can create a reflection based on daily and monthly limits
 */
export function checkReflectionLimits(user: User): {
  canCreate: boolean;
  reason?: 'monthly_limit' | 'daily_limit';
  resetTime?: Date;
} {
  // Check monthly limit first
  const monthlyLimit = TIER_LIMITS[user.tier];
  if (user.reflectionCountThisMonth >= monthlyLimit) {
    return {
      canCreate: false,
      reason: 'monthly_limit',
    };
  }

  // Free tier has no daily limit
  if (user.tier === 'free') {
    return { canCreate: true };
  }

  // Check daily limit for Pro and Unlimited
  const dailyLimit = DAILY_LIMITS[user.tier];
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // If last reflection was not today, user can create
  if (user.lastReflectionDate !== today) {
    return { canCreate: true };
  }

  // Check if daily limit reached
  if (user.reflectionsToday >= dailyLimit) {
    // Calculate reset time (midnight user's timezone)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    return {
      canCreate: false,
      reason: 'daily_limit',
      resetTime: tomorrow,
    };
  }

  return { canCreate: true };
}
```

### Usage in Component
```typescript
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { checkReflectionLimits } from '@/lib/utils/limits';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';

export function ReflectionForm() {
  const { user } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeData, setUpgradeData] = useState<{
    reason: 'monthly_limit' | 'daily_limit';
    resetTime?: Date;
  }>({ reason: 'monthly_limit' });

  const handleSubmit = async () => {
    if (!user) return;

    // Check limits before submission
    const limitCheck = checkReflectionLimits(user);

    if (!limitCheck.canCreate) {
      setUpgradeData({
        reason: limitCheck.reason!,
        resetTime: limitCheck.resetTime,
      });
      setShowUpgradeModal(true);
      return;
    }

    // Proceed with reflection creation...
    // The backend will also enforce limits as a safety measure
  };

  return (
    <>
      {/* Form UI */}
      <button onClick={handleSubmit}>Submit Reflection</button>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason={upgradeData.reason}
        resetTime={upgradeData.resetTime}
        currentTier={user?.tier}
      />
    </>
  );
}
```

### Key Points
- Check monthly limit first (applies to all tiers)
- Free tier bypasses daily limit check
- Compare dates as strings (YYYY-MM-DD) for consistency
- Calculate reset time for user feedback
- Return structured result with reason and reset time
- Frontend check is UX enhancement - backend still enforces limits

---

## Pattern 9: Billing Period Toggle

### When to Use
Pricing page to let users switch between monthly and yearly pricing

### Full Implementation
```typescript
'use client';

import { useState } from 'react';
import type { BillingPeriod } from '@/lib/utils/constants';

export function BillingPeriodToggle({
  value,
  onChange,
}: {
  value: BillingPeriod;
  onChange: (period: BillingPeriod) => void;
}) {
  return (
    <div className="flex justify-center items-center gap-4">
      <button
        onClick={() => onChange('monthly')}
        className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
          value === 'monthly'
            ? 'bg-white/20 text-white shadow-lg'
            : 'text-white/60 hover:text-white hover:bg-white/5'
        }`}
        aria-pressed={value === 'monthly'}
      >
        Monthly
      </button>

      <button
        onClick={() => onChange('yearly')}
        className={`px-6 py-2.5 rounded-lg font-medium transition-all relative ${
          value === 'yearly'
            ? 'bg-white/20 text-white shadow-lg'
            : 'text-white/60 hover:text-white hover:bg-white/5'
        }`}
        aria-pressed={value === 'yearly'}
      >
        Yearly
        <span className="ml-2 text-green-400 text-sm font-semibold">
          Save 17%
        </span>
      </button>
    </div>
  );
}
```

### Usage in Pricing Page
```typescript
export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');

  return (
    <div>
      {/* Toggle */}
      <BillingPeriodToggle
        value={billingPeriod}
        onChange={setBillingPeriod}
      />

      {/* Pricing cards that use billingPeriod */}
      {tiers.map((tier) => (
        <PricingCard
          key={tier.tier}
          {...tier}
          billingPeriod={billingPeriod}
        />
      ))}
    </div>
  );
}
```

### Key Points
- Use semantic `aria-pressed` for accessibility
- Show savings indicator on yearly option
- Smooth transition animations
- Clear visual distinction between selected/unselected states

---

## Pattern 10: tRPC Mutation with Toast Feedback

### When to Use
Any mutation that requires user feedback (checkout, cancel, update)

### Full Implementation
```typescript
'use client';

import { trpc } from '@/lib/trpc';
import { useToast } from '@/contexts/ToastContext';
import { useState } from 'react';

export function MyComponent() {
  const toast = useToast();
  const utils = trpc.useContext();
  const [isLoading, setIsLoading] = useState(false);

  const myMutation = trpc.subscriptions.someAction.useMutation({
    onMutate: () => {
      // Optional: optimistic update
      setIsLoading(true);
    },
    onSuccess: (data) => {
      // Show success message
      toast.success(data.message || 'Action completed successfully');

      // Invalidate related queries to refetch
      utils.subscriptions.getStatus.invalidate();
      utils.users.me.invalidate();

      // Reset loading state
      setIsLoading(false);
    },
    onError: (error) => {
      // Show error message
      toast.error(error.message || 'Something went wrong');

      // Reset loading state
      setIsLoading(false);
    },
    onSettled: () => {
      // Always runs after success or error
      // Cleanup or additional actions
    },
  });

  const handleAction = async () => {
    try {
      await myMutation.mutateAsync({ /* params */ });
      // Additional logic after successful mutation
    } catch (error) {
      // Error already handled in onError
      console.error('Mutation failed:', error);
    }
  };

  return (
    <button
      onClick={handleAction}
      disabled={isLoading || myMutation.isLoading}
    >
      {isLoading ? 'Processing...' : 'Submit'}
    </button>
  );
}
```

### Key Points
- Always provide user feedback via toast
- Invalidate related queries after success
- Handle loading states to prevent double-submission
- Use `mutateAsync` when you need to await the result
- Provide fallback error messages
- Clean up state in `onSettled`

---

## General Frontend Patterns

### Import Order Convention
```typescript
// 1. React and Next.js
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// 2. Third-party libraries
import { formatDistanceToNow } from 'date-fns';

// 3. Internal hooks and contexts
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';

// 4. tRPC
import { trpc } from '@/lib/trpc';

// 5. Components (UI first, then features)
import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { SubscriptionCard } from '@/components/subscription/SubscriptionCard';

// 6. Utils and constants
import { TIER_LIMITS, TIER_PRICING } from '@/lib/utils/constants';

// 7. Types
import type { TierName, BillingPeriod } from '@/lib/utils/constants';
```

### Error Handling Pattern
```typescript
try {
  const result = await mutation.mutateAsync(params);
  toast.success('Success!');
  return result;
} catch (error) {
  // Error already handled in mutation's onError
  // Only log or perform additional cleanup here
  console.error('Action failed:', error);
  return null;
}
```

### Loading State Pattern
```typescript
const [isLoading, setIsLoading] = useState(false);

const handleAction = async () => {
  setIsLoading(true);
  try {
    await doSomething();
  } finally {
    setIsLoading(false); // Always reset, even on error
  }
};

return (
  <button disabled={isLoading}>
    {isLoading ? 'Loading...' : 'Action'}
  </button>
);
```

---

**End of Patterns Document**

These patterns provide complete, copy-pasteable code for all major frontend integration tasks in Iteration 17.
