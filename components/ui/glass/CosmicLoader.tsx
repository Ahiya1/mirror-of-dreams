'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { memo } from 'react';

import type { CosmicLoaderProps } from '@/types/glass-components';

import { cn } from '@/lib/utils';

/**
 * CosmicLoader - Animated gradient ring loader
 *
 * Wrapped in React.memo to prevent unnecessary re-renders when parent re-renders
 * with the same props.
 *
 * @param size - Loader size (sm | md | lg)
 * @param className - Additional Tailwind classes
 * @param label - Custom loading message for screen readers
 */
export const CosmicLoader = memo(function CosmicLoader({
  size = 'md',
  className,
  label = 'Loading content',
}: CosmicLoaderProps) {
  const prefersReducedMotion = useReducedMotion();

  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  const borderSizes = {
    sm: 'border-2',
    md: 'border-4',
    lg: 'border-6',
  };

  return (
    <div
      className={cn('flex items-center justify-center', className)}
      role="status"
      aria-label={label}
    >
      <motion.div
        animate={
          !prefersReducedMotion
            ? {
                rotate: 360,
              }
            : undefined
        }
        transition={
          !prefersReducedMotion
            ? {
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              }
            : undefined
        }
        className={cn(
          'rounded-full',
          sizes[size],
          borderSizes[size],
          'border-t-mirror-purple border-r-mirror-indigo border-b-mirror-violet border-transparent',
          'shadow-glow'
        )}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
});
