/**
 * EmptyState - Standardized empty state component
 *
 * Builder: Builder-1 (Iteration 21)
 *
 * Used for: Dreams list, Evolution reports, Visualizations, etc.
 */

'use client';

import React from 'react';
import { GlassCard, GlowButton, GradientText } from '@/components/ui/glass';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaAction?: () => void;
}

export function EmptyState({ icon, title, description, ctaLabel, ctaAction }: EmptyStateProps) {
  return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <GlassCard elevated className="text-center max-w-md">
        <div className="text-6xl mb-4">{icon}</div>
        <GradientText gradient="cosmic" className="text-2xl font-bold mb-4">
          {title}
        </GradientText>
        <p className="text-white/60 text-base mb-6 leading-relaxed">
          {description}
        </p>
        {ctaLabel && ctaAction && (
          <GlowButton
            variant="primary"
            size="lg"
            onClick={ctaAction}
            className="w-full"
          >
            {ctaLabel}
          </GlowButton>
        )}
      </GlassCard>
    </div>
  );
}
