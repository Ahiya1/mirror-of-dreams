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
      bg: 'bg-mirror-success/20',
      text: 'text-mirror-success',
      border: 'border-mirror-success/30',
    },
    warning: {
      bg: 'bg-mirror-warning/20',
      text: 'text-mirror-warning',
      border: 'border-mirror-warning/30',
    },
    error: {
      bg: 'bg-mirror-error/20',
      text: 'text-mirror-error',
      border: 'border-mirror-error/30',
    },
    info: {
      bg: 'bg-mirror-info/20',
      text: 'text-mirror-info',
      border: 'border-mirror-info/30',
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
