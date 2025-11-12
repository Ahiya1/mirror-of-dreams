'use client';

import { cn } from '@/lib/utils';
import type { GradientTextProps } from '@/types/glass-components';

/**
 * GradientText - Text with gradient color effect
 *
 * @param gradient - Gradient style (cosmic | primary | dream)
 * @param className - Additional Tailwind classes
 * @param children - Text content
 */
export function GradientText({
  gradient = 'cosmic',
  className,
  children,
}: GradientTextProps) {
  const gradientClasses = {
    cosmic: 'bg-gradient-cosmic',
    primary: 'bg-gradient-primary',
    dream: 'bg-gradient-violet',
  };

  return (
    <span
      className={cn(
        // Base gradient text styles
        'bg-clip-text text-transparent',
        // Gradient
        gradientClasses[gradient],
        // Custom
        className
      )}
    >
      {children}
    </span>
  );
}
