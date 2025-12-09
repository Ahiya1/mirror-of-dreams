/**
 * EmptyState - Enhanced empty state component with progress indicators
 *
 * Builder: Builder-3 (Iteration 9)
 * Enhanced: Added optional illustration, progress, variant, and className props
 * Backwards Compatible: All new props are optional
 *
 * Used for: Dreams list, Evolution reports, Visualizations, Dashboard, Reflections
 */

'use client';

import React from 'react';

import { GlassCard, GlowButton, GradientText } from '@/components/ui/glass';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  // Required props (existing)
  icon: string;
  title: string;
  description: string;

  // Optional props (existing)
  ctaLabel?: string;
  ctaAction?: () => void;

  // NEW - Optional enhancement props (Iteration 9)
  illustration?: React.ReactNode; // Custom SVG/image (instead of icon)
  progress?: {
    current: number; // e.g., 2
    total: number; // e.g., 4
    label: string; // e.g., 'reflections'
  };
  variant?: 'default' | 'compact'; // Size variant
  className?: string; // Additional classes
}

export function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  ctaAction,
  illustration,
  progress,
  variant = 'default',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center',
        variant === 'default' && 'min-h-[50vh]',
        variant === 'compact' && 'min-h-[30vh]',
        className
      )}
    >
      <GlassCard
        elevated
        className={cn(
          'text-center',
          variant === 'default' && 'max-w-md p-xl',
          variant === 'compact' && 'max-w-sm p-lg'
        )}
      >
        {/* Icon or Illustration (prioritize illustration if provided) */}
        {illustration ? (
          <div className="mb-md">{illustration}</div>
        ) : (
          <div
            className={cn(
              'mb-md',
              variant === 'default' && 'text-6xl',
              variant === 'compact' && 'text-4xl'
            )}
          >
            {icon}
          </div>
        )}

        {/* Title */}
        <GradientText
          gradient="cosmic"
          className={cn(
            'mb-md',
            variant === 'default' && 'text-h2',
            variant === 'compact' && 'text-h3'
          )}
        >
          {title}
        </GradientText>

        {/* Description */}
        <p
          className={cn(
            'mb-lg text-white/60',
            variant === 'default' && 'text-body',
            variant === 'compact' && 'text-body-sm'
          )}
        >
          {description}
        </p>

        {/* Progress Indicator (Optional) */}
        {progress && (
          <div className="mb-lg">
            <div className="mb-sm flex items-center justify-center gap-2">
              <div className="text-h3 font-semibold text-mirror-amethyst">{progress.current}</div>
              <div className="text-body-sm text-white/50">/</div>
              <div className="text-body text-white/60">
                {progress.total} {progress.label}
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-mirror-amethyst to-purple-400 transition-all duration-500"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* CTA Button (Optional) */}
        {ctaLabel && ctaAction && (
          <GlowButton
            variant="primary"
            size={variant === 'default' ? 'lg' : 'md'}
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
