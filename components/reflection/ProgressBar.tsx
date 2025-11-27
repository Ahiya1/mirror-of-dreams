'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

/**
 * ProgressBar - Visual progress indicator for reflection journey
 *
 * Shows progress through reflection questions as:
 * - Horizontal bar segments
 * - Current step highlighted with cosmic glow
 * - Completed steps filled
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps,
  className,
}) => {
  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      {/* Progress segments */}
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        const isPending = stepNumber > currentStep;

        return (
          <motion.div
            key={index}
            className={cn(
              'h-2 rounded-full transition-all duration-500',
              isCurrent && 'w-16 bg-mirror-purple shadow-lg shadow-mirror-purple/40',
              isCompleted && 'w-12 bg-mirror-purple/80',
              isPending && 'w-10 bg-white/20'
            )}
            initial={{ width: 0, opacity: 0 }}
            animate={{
              width: isCurrent ? '4rem' : isCompleted ? '3rem' : '2.5rem',
              opacity: 1,
            }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          />
        );
      })}

      {/* Step counter text */}
      <span className="ml-3 text-sm text-white/60 font-light">
        Step {currentStep} of {totalSteps}
      </span>
    </div>
  );
};

export default ProgressBar;
