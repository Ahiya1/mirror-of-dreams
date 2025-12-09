'use client';

import { Check, X } from 'lucide-react';
import Link from 'next/link';

import { CheckoutButton } from './CheckoutButton';

import type { TierName, BillingPeriod } from '@/lib/utils/constants';

import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlowButton } from '@/components/ui/glass/GlowButton';

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
  const yearlySavings =
    billingPeriod === 'yearly' && tier !== 'free'
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
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-1 text-sm font-semibold text-white">
          Most Popular
        </div>
      )}

      {/* Current plan badge */}
      {isCurrentPlan && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-1 text-sm font-semibold text-white">
          Current Plan
        </div>
      )}

      <div className="p-6">
        <h3 className="mb-2 text-2xl font-bold text-white">{name}</h3>
        <p className="mb-6 text-sm text-white/60">{description}</p>

        <div className="mb-6">
          <span className="text-4xl font-bold text-white">${price}</span>
          <span className="ml-2 text-white/60">{period}</span>
          {yearlySavings > 0 && (
            <div className="mt-1 text-sm text-mirror-success">Save {yearlySavings}% yearly</div>
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
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-mirror-success" />
              ) : (
                <X className="mt-0.5 h-5 w-5 flex-shrink-0 text-white/30" />
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
