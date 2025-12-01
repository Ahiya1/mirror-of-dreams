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
  className = '',
}: UsageWarningBannerProps) {
  const limit = TIER_LIMITS[tier];
  const percentage = Math.min((used / limit) * 100, 100);
  const remaining = Math.max(limit - used, 0);

  // Auto-determine variant if not specified
  let finalVariant = variant;
  if (variant === 'warning') {
    if (percentage >= 100) {
      finalVariant = 'error';
    } else if (percentage < 80) {
      finalVariant = 'info';
    }
  }

  // Don't show banner if user has plenty left
  if (percentage < 80 && finalVariant === 'info') {
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

  const { icon: Icon, title, bgClass, iconClass, progressClass } = config[finalVariant];

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
