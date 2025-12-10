'use client';

import { memo } from 'react';

import { cn } from '@/lib/utils';

const TONE_COLORS = {
  gentle: {
    bg: 'bg-purple-500/20',
    text: 'text-purple-300',
    border: 'border-purple-500/30',
    glow: 'shadow-lg shadow-purple-500/30',
  },
  fusion: {
    bg: 'bg-amber-500/20',
    text: 'text-amber-300',
    border: 'border-amber-500/30',
    glow: 'shadow-lg shadow-amber-500/30',
  },
  intense: {
    bg: 'bg-red-500/20',
    text: 'text-red-300',
    border: 'border-red-500/30',
    glow: 'shadow-lg shadow-red-500/30',
  },
} as const;

interface ToneBadgeProps {
  tone: string;
  className?: string;
  showGlow?: boolean;
}

/**
 * ToneBadge - Display reflection tone with appropriate color and glow
 *
 * Colors:
 * - gentle: Purple (soft wisdom)
 * - fusion: Gold (balanced harmony)
 * - intense: Red (piercing truth)
 *
 * Wrapped in React.memo to prevent unnecessary re-renders when parent re-renders
 * with the same props.
 */
export const ToneBadge = memo(function ToneBadge({
  tone,
  className,
  showGlow = true,
}: ToneBadgeProps) {
  const colors = TONE_COLORS[tone as keyof typeof TONE_COLORS] || TONE_COLORS.gentle;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium capitalize',
        colors.bg,
        colors.text,
        colors.border,
        showGlow && colors.glow,
        className
      )}
    >
      {tone}
    </span>
  );
});
