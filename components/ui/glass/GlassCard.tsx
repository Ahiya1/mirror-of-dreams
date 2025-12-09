'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { GlassCardProps } from '@/types/glass-components';

/**
 * GlassCard - Simplified glass-morphism card (restrained design)
 *
 * @param elevated - Adds subtle shadow and border highlight (functional depth)
 * @param interactive - Enables subtle hover lift on interaction (functional feedback)
 * @param onClick - Click handler
 * @param className - Additional Tailwind classes
 * @param children - Card content
 * @param style - Inline styles
 */
export function GlassCard({
  elevated = false,
  interactive = false,
  onClick,
  className,
  children,
  style,
  ...dataAttributes
}: GlassCardProps) {
  const prefersReducedMotion = useReducedMotion();

  // Determine if we should animate (interactive AND has onClick AND no reduced motion)
  const shouldAnimate = interactive && onClick && !prefersReducedMotion;

  const cardClassName = cn(
    // Base glass effect (functional depth)
    'backdrop-blur-crystal',
    'bg-gradient-to-br from-white/8 via-transparent to-purple-500/3',
    'border border-white/10',
    'rounded-xl p-6',
    'relative',
    // Elevated state (functional hierarchy)
    elevated && 'shadow-lg border-white/15',
    // Interactive state (enhanced hover with glow + border highlight + warmth)
    interactive && [
      'cursor-pointer',
      'transition-all duration-250',
      'hover:-translate-y-0.5',
      // Combined purple glow + golden warmth (70/20/10 formula)
      'hover:shadow-[0_8px_30px_rgba(124,58,237,0.12),0_4px_20px_rgba(251,191,36,0.08)]',
      'hover:border-purple-400/25',
      'active:scale-[0.99]',  // Keep CSS fallback for non-animated state
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2'
    ],
    // Custom classes
    className
  );

  // Handle keyboard interaction for accessibility
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (interactive && onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <motion.div
      onClick={onClick}
      // Touch feedback animation (only when interactive with click handler)
      whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.1 }}
      className={cardClassName}
      style={style}
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? 'button' : undefined}
      onKeyDown={handleKeyDown}
      {...dataAttributes}
    >
      {children}
    </motion.div>
  );
}
