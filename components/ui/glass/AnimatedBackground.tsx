'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { AnimatedBackgroundProps } from '@/types/glass-components';

/**
 * AnimatedBackground - Three-layer atmospheric soul-sigh background
 *
 * Creates depth through three planes:
 * - Far Plane: Purple nebula slowly drifting
 * - Mid Plane: Amethyst core breathing with life
 * - Near Plane: Caustic light patterns dancing
 * - Presence: Golden warmth flickering eternally
 *
 * @param variant - Visual atmosphere (cosmic | dream | glow)
 * @param intensity - Presence intensity (subtle | medium | strong)
 * @param className - Additional Tailwind classes
 */
export function AnimatedBackground({
  variant = 'cosmic',
  intensity = 'subtle',
  className,
}: AnimatedBackgroundProps) {
  const prefersReducedMotion = useReducedMotion();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // LAYER OPACITIES (Depth control)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const intensityConfig = {
    subtle: { far: 0.3, mid: 0.15, near: 0.08, gold: 0.03 },
    medium: { far: 0.5, mid: 0.25, near: 0.12, gold: 0.05 },
    strong: { far: 0.7, mid: 0.35, near: 0.18, gold: 0.08 },
  };

  const config = intensityConfig[intensity];

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FAR PLANE ANIMATION (Nebula drift - ULTRA SLOW 35s cycle)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const nebulaDrift = {
    x: [0, 50, -30, 40, 0],
    y: [0, -60, 30, -20, 0],
    scale: [1, 1.12, 0.95, 1.08, 1],
    rotate: [0, 3, -2, 1, 0],
    opacity: [config.far * 0.7, config.far * 1.1, config.far * 0.85, config.far, config.far * 0.7],
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MID PLANE ANIMATION (Amethyst breathing - SLOW 20s cycle)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const amethystBreathe = {
    scale: [1, 1.15, 1.05, 1.12, 1],
    opacity: [config.mid * 0.85, config.mid * 1.2, config.mid * 0.9, config.mid * 1.1, config.mid * 0.85],
    rotate: [0, 2, -1, 1, 0],
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // NEAR PLANE ANIMATION (Caustic dance - 25s cycle)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const causticDance = {
    x: [0, -25, 35, -15, 20, 0],
    y: [0, 40, -25, 45, -10, 0],
    rotate: [0, 5, -3, 7, -2, 0],
    scale: [1, 1.08, 0.96, 1.05, 0.98, 1],
    opacity: [config.near * 0.6, config.near * 1.1, config.near * 0.75, config.near, config.near * 0.85, config.near * 0.6],
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // GOLDEN PRESENCE (Eternal breath - VERY SLOW 30s cycle)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const goldFlicker = {
    opacity: [config.gold * 0.5, config.gold * 1.0, config.gold * 0.7, config.gold * 1.2, config.gold * 0.6, config.gold * 0.9, config.gold * 0.5],
    scale: [1, 1.15, 0.95, 1.2, 0.9, 1.1, 1],
    x: [0, 15, -10, 20, -5, 10, 0],
    y: [0, -20, 15, -25, 10, -15, 0],
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // VARIANT BACKGROUNDS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const variantClasses = {
    cosmic: {
      far: 'bg-gradient-to-b from-mirror-nebula/60 via-mirror-nebula-dark/40 to-transparent',
      mid: 'bg-amethyst-core',
      near: 'bg-caustic-purple',
    },
    dream: {
      far: 'bg-gradient-to-br from-mirror-amethyst/40 via-mirror-nebula/30 to-transparent',
      mid: 'bg-amethyst-breath',
      near: 'bg-gradient-to-tr from-mirror-glow-core/20 to-transparent',
    },
    glow: {
      far: 'bg-gradient-radial from-mirror-amethyst-bright/50 to-transparent',
      mid: 'bg-amethyst-glow',
      near: 'bg-caustic-purple',
    },
  };

  const variant_config = variantClasses[variant];

  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          FAR PLANE: Purple Nebula (Slow Drift)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <motion.div
        animate={!prefersReducedMotion ? nebulaDrift : undefined}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={cn(
          'absolute inset-0 -top-1/4',
          'blur-3xl',
          variant_config.far
        )}
        style={{ zIndex: 1 }}
      />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MID PLANE: Amethyst Core (Breathing)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <motion.div
        animate={!prefersReducedMotion ? amethystBreathe : undefined}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={cn(
          'absolute inset-0',
          'blur-2xl',
          variant_config.mid
        )}
        style={{ zIndex: 2 }}
      />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          NEAR PLANE: Caustic Light (Dancing)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <motion.div
        animate={!prefersReducedMotion ? causticDance : undefined}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={cn(
          'absolute inset-0',
          'blur-xl',
          variant_config.near
        )}
        style={{ zIndex: 3 }}
      />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          GOLDEN PRESENCE: Eternal Warmth (Flickering)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <motion.div
        animate={!prefersReducedMotion ? goldFlicker : undefined}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={cn(
          'absolute inset-0',
          'blur-3xl',
          'bg-warmth-ambient'
        )}
        style={{ zIndex: 4 }}
      />
    </div>
  );
}
