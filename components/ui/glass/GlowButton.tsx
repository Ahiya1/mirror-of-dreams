'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { GlowButtonProps } from '@/types/glass-components';

/**
 * GlowButton - Button with gradient background and glow effects
 *
 * @param variant - Button style variant (primary | secondary | ghost)
 * @param size - Button size (sm | md | lg)
 * @param onClick - Click handler
 * @param disabled - Disabled state
 * @param className - Additional Tailwind classes
 * @param children - Button content
 */
export function GlowButton({
  variant = 'primary',
  size = 'md',
  className,
  children,
  onClick,
  disabled = false,
}: GlowButtonProps) {
  const prefersReducedMotion = useReducedMotion();

  const variants = {
    primary: 'crystal-sharp amethyst-breathing text-white mirror-corner gold-seep-edge',
    secondary: 'crystal-glass text-mirror-amethyst mirror-top hover-glow',
    ghost: 'bg-transparent text-mirror-amethyst hover:crystal-ethereal hover-glow',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <motion.button
      whileHover={!disabled && !prefersReducedMotion ? { scale: 1.02 } : undefined}
      whileTap={!disabled && !prefersReducedMotion ? { scale: 0.98 } : undefined}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        // Base structure
        'rounded-lg font-medium',
        'relative',
        // Slow reverent transitions
        'transition-all duration-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-mirror-amethyst focus-visible:ring-offset-2',
        // Variant (includes all effects)
        variants[variant],
        // Size
        sizes[size],
        // Custom
        className
      )}
    >
      {children}
    </motion.button>
  );
}
