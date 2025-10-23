'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { cardVariants } from '@/lib/animations/variants';
import type { GlassCardProps } from '@/types/glass-components';

/**
 * GlassCard - A glass-morphism card with blur backdrop and glow effects
 *
 * @param variant - Visual style variant (default | elevated | inset)
 * @param glassIntensity - Blur intensity (subtle | medium | strong)
 * @param glowColor - Glow color theme (purple | blue | cosmic | electric)
 * @param hoverable - Enable hover animations
 * @param animated - Enable entrance animations
 * @param onClick - Click handler
 * @param className - Additional Tailwind classes
 * @param children - Card content
 */
export function GlassCard({
  variant = 'default',
  glassIntensity = 'medium',
  glowColor = 'purple',
  hoverable = true,
  animated = true,
  onClick,
  className,
  children,
}: GlassCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = animated && !prefersReducedMotion;

  // Glass intensity mapping
  const blurClasses = {
    subtle: 'backdrop-blur-glass-sm',
    medium: 'backdrop-blur-glass',
    strong: 'backdrop-blur-glass-lg',
  };

  // Variant styling
  const variantClasses = {
    default: 'bg-white/5 border border-white/10',
    elevated: 'bg-white/8 border border-white/15 shadow-glow',
    inset: 'bg-white/3 border border-white/5 shadow-inner',
  };

  // Glow color mapping
  const glowClasses = {
    purple: 'hover:shadow-glow-lg hover:border-mirror-purple/30',
    blue: 'hover:shadow-glow-electric hover:border-mirror-blue/30',
    cosmic: 'hover:shadow-glow-lg hover:border-mirror-violet/30',
    electric: 'hover:shadow-glow-electric hover:border-mirror-cyan/30',
  };

  return (
    <motion.div
      variants={shouldAnimate ? cardVariants : undefined}
      initial={shouldAnimate ? 'hidden' : false}
      animate={shouldAnimate ? 'visible' : false}
      whileHover={hoverable && !prefersReducedMotion ? 'hover' : undefined}
      onClick={onClick}
      className={cn(
        // Base styles
        'rounded-xl p-6',
        // Glass effect
        blurClasses[glassIntensity],
        'backdrop-saturate-glass',
        // Variant
        variantClasses[variant],
        // Hover effects
        hoverable && glowClasses[glowColor],
        // Transitions
        'transition-all duration-300',
        // Custom classes
        className
      )}
    >
      {children}
    </motion.div>
  );
}
