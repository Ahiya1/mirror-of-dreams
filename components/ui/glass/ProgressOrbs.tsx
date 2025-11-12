'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ProgressOrbsProps } from '@/types/glass-components';

/**
 * ProgressOrbs - Multi-step progress indicator with orbs
 *
 * @param steps - Total number of steps
 * @param currentStep - Current active step (0-indexed)
 * @param className - Additional Tailwind classes
 */
export function ProgressOrbs({ steps, currentStep, className }: ProgressOrbsProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {Array.from({ length: steps }, (_, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <div key={index} className="flex items-center">
            {/* Orb - Slow, breathing, alive */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={
                !prefersReducedMotion
                  ? {
                      scale: isActive ? [1, 1.15, 1.1] : [0.8, 1, 0.95],
                      opacity: isActive || isCompleted ? [0.9, 1, 0.95] : [0.3, 0.4, 0.35],
                    }
                  : { scale: 1, opacity: isActive || isCompleted ? 1 : 0.4 }
              }
              transition={{
                duration: prefersReducedMotion ? 0.01 : 2.5,
                delay: index * 0.15,
                ease: [0.4, 0, 0.2, 1],
                repeat: Infinity,
                repeatType: 'reverse',
              }}
              className={cn(
                'w-4 h-4 rounded-full relative',
                isActive && 'bg-gradient-to-br from-mirror-amethyst via-mirror-amethyst-bright to-mirror-amethyst-light shadow-amethyst-breath',
                isCompleted && !isActive && 'bg-gradient-to-br from-mirror-amethyst-deep via-mirror-amethyst to-mirror-amethyst shadow-amethyst-mid',
                !isActive && !isCompleted && 'bg-white/5 border border-white/15'
              )}
            >
              {/* Inner glow layer */}
              {(isActive || isCompleted) && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(124, 58, 237, 0.6) 0%, transparent 70%)',
                  }}
                  animate={{
                    scale: [1, 1.3, 1.1],
                    opacity: [0.4, 0.7, 0.5],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    ease: 'easeInOut',
                  }}
                />
              )}
            </motion.div>

            {/* Connector Line - Slow growth */}
            {index < steps - 1 && (
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={
                  !prefersReducedMotion
                    ? {
                        scaleX: isCompleted ? [0.9, 1, 0.95] : [0.2, 0.3, 0.25],
                        opacity: isCompleted ? [0.9, 1, 0.95] : [0.2, 0.3, 0.25],
                      }
                    : { scaleX: isCompleted ? 1 : 0.3, opacity: isCompleted ? 1 : 0.3 }
                }
                transition={{
                  duration: prefersReducedMotion ? 0.01 : 2,
                  delay: index * 0.15 + 0.3,
                  ease: [0.4, 0, 0.2, 1],
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
                className={cn(
                  'w-8 h-0.5 mx-1',
                  isCompleted ? 'bg-gradient-to-r from-mirror-amethyst via-mirror-amethyst-bright to-mirror-amethyst' : 'bg-white/8'
                )}
                style={{ transformOrigin: 'left' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
