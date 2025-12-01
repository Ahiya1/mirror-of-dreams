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
  className = '',
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
