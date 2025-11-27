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
  ...props
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
        // Interactive state (enhanced hover with glow + border highlight)
        interactive && [
          'cursor-pointer',
          'transition-all duration-250',
          'hover:-translate-y-0.5',
          'hover:shadow-[0_8px_30px_rgba(124,58,237,0.15)]',
          'hover:border-purple-400/30',
          'active:scale-[0.99]',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2'
        ],
        // Custom classes
        className
      )}
      tabIndex={interactive ? 0 : props.tabIndex}
      role={interactive ? 'button' : props.role}
      onKeyDown={interactive && onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : props.onKeyDown}
      {...props}
    >
      {children}
    </div>
  );
}
