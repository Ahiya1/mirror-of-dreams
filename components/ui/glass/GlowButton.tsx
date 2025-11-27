'use client';

import { cn } from '@/lib/utils';
import type { GlowButtonProps } from '@/types/glass-components';

/**
 * GlowButton - Enhanced button with cosmic variant for entry points
 *
 * @param variant - Button style variant (primary | secondary | ghost | cosmic)
 * @param size - Button size (sm | md | lg)
 * @param type - Button type (button | submit | reset)
 * @param onClick - Click handler
 * @param disabled - Disabled state
 * @param className - Additional Tailwind classes
 * @param children - Button content
 */
export function GlowButton({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className,
  children,
  onClick,
  disabled = false,
}: GlowButtonProps) {
  const variants = {
    primary: 'bg-purple-600 text-white hover:opacity-90 active:opacity-85',
    secondary:
      'bg-transparent text-purple-600 border border-purple-600 hover:bg-purple-600/10 active:bg-purple-600/20',
    ghost: 'bg-transparent text-gray-300 hover:text-purple-400',
    cosmic: cn(
      'bg-gradient-to-br from-purple-500/15 via-indigo-500/12 to-purple-500/15',
      'border border-purple-500/30',
      'text-purple-200',
      'backdrop-blur-md',
      'hover:from-purple-500/22 hover:via-indigo-500/18 hover:to-purple-500/22',
      'hover:border-purple-500/45',
      'hover:-translate-y-0.5',
      'hover:shadow-[0_12px_35px_rgba(147,51,234,0.2)]',
      'before:absolute before:inset-0',
      'before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent',
      'before:-translate-x-full before:transition-transform',
      'hover:before:translate-x-full',
      'overflow-hidden',
      '[&:hover::before]:duration-500'
    ),
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        // Base structure
        'rounded-lg font-medium',
        'relative',
        // Fast transitions (200ms for opacity, 300ms for transform)
        'transition-all duration-300',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2',
        // Variant
        variants[variant],
        // Size
        sizes[size],
        // Custom
        className
      )}
    >
      {children}
    </button>
  );
}
