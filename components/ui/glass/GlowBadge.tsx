'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { GlowBadgeProps } from '@/types/glass-components';

/**
 * GlowBadge - Status badge with glow effect
 *
 * @param variant - Badge variant (success | warning | error | info)
 * @param glowing - Enable pulsing glow animation
 * @param className - Additional Tailwind classes
 * @param children - Badge content
 */
export function GlowBadge({
  variant = 'info',
  glowing = false,
  className,
  children,
}: GlowBadgeProps) {
  const prefersReducedMotion = useReducedMotion();

  const variants = {
    success: {
      bg: 'bg-mirror-success/20',
      text: 'text-mirror-success',
      border: 'border-mirror-success/30',
      shadow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]',
    },
    warning: {
      bg: 'bg-mirror-warning/20',
      text: 'text-mirror-warning',
      border: 'border-mirror-warning/30',
      shadow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
    },
    error: {
      bg: 'bg-mirror-error/20',
      text: 'text-mirror-error',
      border: 'border-mirror-error/30',
      shadow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]',
    },
    info: {
      bg: 'bg-mirror-info/20',
      text: 'text-mirror-info',
      border: 'border-mirror-info/30',
      shadow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]',
    },
  };

  const variantStyles = variants[variant];

  return (
    <motion.span
      animate={
        glowing && !prefersReducedMotion
          ? {
              boxShadow: [
                variantStyles.shadow,
                'shadow-[0_0_40px_rgba(139,92,246,0.6)]',
                variantStyles.shadow,
              ],
            }
          : undefined
      }
      transition={
        glowing && !prefersReducedMotion
          ? {
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }
          : undefined
      }
      className={cn(
        'inline-flex items-center px-3 py-1',
        'text-xs font-medium',
        'rounded-full',
        'border',
        'backdrop-blur-sm',
        variantStyles.bg,
        variantStyles.text,
        variantStyles.border,
        glowing && variantStyles.shadow,
        className
      )}
    >
      {children}
    </motion.span>
  );
}
