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

  // Crystal clarity mapping (sharp, minimal blur - 2px!)
  const blurClasses = {
    subtle: 'backdrop-blur-crystal backdrop-saturate-crystal',
    medium: 'backdrop-blur-crystal backdrop-saturate-crystal',
    strong: 'backdrop-blur-crystal-soft backdrop-saturate-crystal',
  };

  // Variant styling - Living crystalline surfaces
  const variantClasses = {
    default: 'crystal-glass mirror-corner warmth-ambient',
    elevated: 'crystal-sharp mirror-top refraction-edge gold-seep-edge',
    inset: 'crystal-ethereal mirror-corner',
  };

  // Glow behavior on hover (slow, reverent)
  const glowClasses = {
    purple: 'hover-glow',
    blue: 'hover-glow',
    cosmic: 'hover-glow hover-breathe',
    electric: 'hover-glow',
  };

  // Breathing variants (elevated cards breathe always)
  const breathingClass = variant === 'elevated' ? 'breathe-slow' : '';

  return (
    <motion.div
      variants={shouldAnimate ? cardVariants : undefined}
      initial={shouldAnimate ? 'hidden' : false}
      animate={shouldAnimate ? 'visible' : false}
      whileHover={hoverable && !prefersReducedMotion ? 'hover' : undefined}
      onClick={onClick}
      className={cn(
        // Base structure
        'rounded-xl p-6',
        'relative',
        // Crystal variant (includes all effects)
        variantClasses[variant],
        // Breathing (if elevated)
        breathingClass,
        // Hover reverence
        hoverable && glowClasses[glowColor],
        // Slow transitions (0.5s instead of 0.3s)
        'transition-all duration-500',
        // Custom classes
        className
      )}
    >
      {children}
    </motion.div>
  );
}
