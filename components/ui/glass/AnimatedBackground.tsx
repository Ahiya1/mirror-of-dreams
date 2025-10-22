'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { AnimatedBackgroundProps } from '@/types/glass-components';

/**
 * AnimatedBackground - Animated gradient background layer
 *
 * @param variant - Gradient variant (cosmic | dream | glow)
 * @param intensity - Animation intensity (subtle | medium | strong)
 * @param className - Additional Tailwind classes
 */
export function AnimatedBackground({
  variant = 'cosmic',
  intensity = 'subtle',
  className,
}: AnimatedBackgroundProps) {
  const prefersReducedMotion = useReducedMotion();

  const variants = {
    cosmic: 'bg-gradient-cosmic',
    dream: 'bg-gradient-dream',
    glow: 'bg-gradient-glow',
  };

  const opacities = {
    subtle: 'opacity-20',
    medium: 'opacity-30',
    strong: 'opacity-40',
  };

  const animations = {
    subtle: {
      scale: [1, 1.05, 1],
      opacity: [0.2, 0.25, 0.2],
    },
    medium: {
      scale: [1, 1.1, 1],
      opacity: [0.3, 0.4, 0.3],
    },
    strong: {
      scale: [1, 1.15, 1],
      opacity: [0.4, 0.5, 0.4],
    },
  };

  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      <motion.div
        animate={!prefersReducedMotion ? animations[intensity] : undefined}
        transition={
          !prefersReducedMotion
            ? {
                duration: 8,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : undefined
        }
        className={cn(
          'absolute inset-0',
          'blur-3xl',
          variants[variant],
          opacities[intensity]
        )}
      />
    </div>
  );
}
