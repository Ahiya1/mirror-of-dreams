'use client';

import { cn } from '@/lib/utils';
import type { GlowBadgeProps } from '@/types/glass-components';

/**
 * GlowBadge - Status badge (simplified - no pulsing animation)
 *
 * @param variant - Badge variant (success | warning | error | info)
 * @param className - Additional Tailwind classes
 * @param children - Badge content
 */
export function GlowBadge({
  variant = 'info',
  className,
  children,
}: GlowBadgeProps) {
  const variants = {
    success: {
      bg: 'bg-green-500/20',
      text: 'text-green-500',
      border: 'border-green-500/30',
    },
    warning: {
      bg: 'bg-yellow-500/20',
      text: 'text-yellow-500',
      border: 'border-yellow-500/30',
    },
    error: {
      bg: 'bg-red-500/20',
      text: 'text-red-500',
      border: 'border-red-500/30',
    },
    info: {
      bg: 'bg-blue-500/20',
      text: 'text-blue-500',
      border: 'border-blue-500/30',
    },
  };

  const variantStyles = variants[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1',
        'text-xs font-medium',
        'rounded-full',
        'border-2',
        'backdrop-blur-sm',
        variantStyles.bg,
        variantStyles.text,
        variantStyles.border,
        className
      )}
    >
      {children}
    </span>
  );
}
