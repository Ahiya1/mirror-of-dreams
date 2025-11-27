'use client';

import { cn } from '@/lib/utils';
import type { GlassCardProps } from '@/types/glass-components';

/**
 * GlassCard - Simplified glass-morphism card (restrained design)
 *
 * @param elevated - Adds subtle shadow and border highlight (functional depth)
 * @param interactive - Enables subtle hover lift on interaction (functional feedback)
 * @param onClick - Click handler
 * @param className - Additional Tailwind classes
 * @param children - Card content
 */
export function GlassCard({
  elevated = false,
  interactive = false,
  onClick,
  className,
  children,
}: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        // Base glass effect (functional depth)
        'backdrop-blur-crystal',
        'bg-gradient-to-br from-white/8 via-transparent to-purple-500/3',
        'border border-white/10',
        'rounded-xl p-6',
        'relative',
        // Elevated state (functional hierarchy)
        elevated && 'shadow-lg border-white/15',
        // Interactive state (functional feedback - subtle lift only, no scale)
        interactive && 'transition-transform duration-250 hover:-translate-y-0.5 cursor-pointer',
        // Custom classes
        className
      )}
    >
      {children}
    </div>
  );
}
