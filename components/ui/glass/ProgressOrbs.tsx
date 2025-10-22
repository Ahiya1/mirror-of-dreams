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
            {/* Orb */}
            <motion.div
              initial={false}
              animate={
                !prefersReducedMotion
                  ? {
                      scale: isActive ? 1.2 : 1,
                      opacity: isActive || isCompleted ? 1 : 0.4,
                    }
                  : undefined
              }
              transition={{ duration: 0.3 }}
              className={cn(
                'w-3 h-3 rounded-full',
                isActive && 'bg-gradient-primary shadow-glow-lg',
                isCompleted && !isActive && 'bg-mirror-purple shadow-glow',
                !isActive && !isCompleted && 'bg-white/20'
              )}
            />

            {/* Connector Line */}
            {index < steps - 1 && (
              <motion.div
                initial={false}
                animate={
                  !prefersReducedMotion
                    ? {
                        scaleX: isCompleted ? 1 : 0.3,
                        opacity: isCompleted ? 1 : 0.3,
                      }
                    : undefined
                }
                transition={{ duration: 0.3 }}
                className={cn(
                  'w-8 h-0.5 mx-1',
                  isCompleted ? 'bg-mirror-purple' : 'bg-white/20'
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
