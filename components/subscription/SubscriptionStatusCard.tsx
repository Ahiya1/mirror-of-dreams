'use client';

import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useState } from 'react';

import { CancelSubscriptionModal } from './CancelSubscriptionModal';

import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlowBadge } from '@/components/ui/glass/GlowBadge';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { trpc } from '@/lib/trpc';
import { TIER_LIMITS } from '@/lib/utils/constants';

export function SubscriptionStatusCard() {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const { data: subscription, isLoading, refetch } = trpc.subscriptions.getStatus.useQuery();

  if (isLoading) {
    return (
      <GlassCard elevated>
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Subscription & Billing</h3>
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-1/3 rounded bg-white/10"></div>
            <div className="h-8 w-1/2 rounded bg-white/10"></div>
            <div className="h-4 w-2/3 rounded bg-white/10"></div>
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
  const statusVariant = subscription.isActive
    ? ('success' as const)
    : subscription.isCanceled
      ? ('warning' as const)
      : ('info' as const);

  return (
    <>
      <GlassCard elevated>
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Subscription & Billing</h3>

          <div className="space-y-4">
            {/* Current Plan */}
            <div>
              <div className="mb-1 text-sm text-white/60">Current Plan</div>
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
                <div className="mb-1 text-sm text-white/60">Billing Period</div>
                <div className="text-white">{periodName}</div>
              </div>
            )}

            {/* Next Billing Date */}
            {subscription.isActive && subscription.expiresAt && !subscription.isCanceled && (
              <div>
                <div className="mb-1 text-sm text-white/60">Next Billing Date</div>
                <div className="text-white">
                  {new Date(subscription.expiresAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                  <span className="ml-2 text-sm text-white/60">
                    ({formatDistanceToNow(new Date(subscription.expiresAt), { addSuffix: true })})
                  </span>
                </div>
              </div>
            )}

            {/* Cancellation Notice */}
            {subscription.isCanceled && subscription.expiresAt && (
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
                <p className="mb-1 font-semibold text-yellow-500">Subscription Canceling</p>
                <p className="text-sm text-white/80">
                  Your subscription will end on{' '}
                  {new Date(subscription.expiresAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                  . You'll be downgraded to Free tier after this date.
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
