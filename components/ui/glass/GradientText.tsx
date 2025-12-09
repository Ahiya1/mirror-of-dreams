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
  // Use the gradient-text-* classes defined in globals.css
  // which include the background-clip and text-fill-color properties
  const gradientClasses = {
    cosmic: 'gradient-text-cosmic',
    primary: 'gradient-text-amethyst',
    dream: 'gradient-text-ethereal',
  };

  return (
    <span
      className={cn(
        // Gradient class (includes bg-clip-text and text-fill-color)
        gradientClasses[gradient],
        // Custom
        className
      )}
    >
      {children}
    </span>
  );
}
