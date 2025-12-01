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
