'use client';

import { Lock } from 'lucide-react';
import Link from 'next/link';

import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlowBadge } from '@/components/ui/glass/GlowBadge';
import { GlowButton } from '@/components/ui/glass/GlowButton';

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
  className = '',
}: FeatureLockOverlayProps) {
  const tierName = requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1);

  return (
    <GlassCard elevated className={`border-l-4 border-purple-500/50 ${className}`}>
      <div className="flex items-start gap-4">
        {/* Lock Icon */}
        <div className="flex-shrink-0 rounded-lg bg-purple-500/20 p-3">
          <Lock className="h-6 w-6 text-purple-400" />
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-semibold text-white">{featureName}</h3>
            <GlowBadge variant="warning">{tierName}+</GlowBadge>
          </div>

          {/* Description */}
          <p className="mb-4 text-white/80">{description}</p>

          {/* Benefits List (optional) */}
          {benefits && benefits.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-sm text-white/60">This feature includes:</p>
              <ul className="ml-2 list-inside list-disc space-y-1 text-sm text-white/60">
                {benefits.map((benefit, idx) => (
                  <li key={idx}>{benefit}</li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA */}
          <Link href="/pricing">
            <GlowButton variant="primary">Upgrade to {tierName}</GlowButton>
          </Link>
        </div>
      </div>
    </GlassCard>
  );
}
