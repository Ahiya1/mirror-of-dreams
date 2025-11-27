'use client';

import { cn } from '@/lib/utils';
import type { GlowButtonProps } from '@/types/glass-components';

/**
 * GlowButton - Enhanced button with cosmic and semantic variants
 *
 * @param variant - Button style variant (primary | secondary | ghost | cosmic | success | danger | info)
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
    primary: cn(
      'bg-purple-600 text-white',
      'hover:opacity-90 hover:-translate-y-0.5',
      'active:scale-[0.98] active:opacity-80'
    ),
    secondary: cn(
      'bg-transparent text-purple-600 border border-purple-600',
      'hover:bg-purple-600/10 hover:-translate-y-0.5',
      'active:scale-[0.98] active:bg-purple-600/20'
    ),
    ghost: cn(
      'bg-transparent text-gray-300',
      'hover:text-purple-400 hover:bg-white/5',
      'active:scale-[0.98] active:bg-white/10'
    ),
    cosmic: cn(
      'bg-gradient-to-br from-purple-500/15 via-indigo-500/12 to-purple-500/15',
      'border border-purple-500/30',
      'text-purple-200',
      'backdrop-blur-md',
      'hover:from-purple-500/22 hover:via-indigo-500/18 hover:to-purple-500/22',
      'hover:border-purple-500/45',
      'hover:-translate-y-0.5',
      'hover:shadow-[0_12px_35px_rgba(147,51,234,0.2)]',
      'active:scale-[0.98]',
      'before:absolute before:inset-0',
      'before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent',
      'before:-translate-x-full before:transition-transform before:duration-500',
      'hover:before:translate-x-full',
      'overflow-hidden'
    ),
    success: cn(
      'bg-mirror-success text-white',
      'hover:bg-mirror-success/90 hover:-translate-y-0.5',
      'active:scale-[0.98] active:bg-mirror-success/80',
      'focus-visible:ring-mirror-success'
    ),
    danger: cn(
      'bg-mirror-error text-white',
      'hover:bg-mirror-error/90 hover:-translate-y-0.5',
      'active:scale-[0.98] active:bg-mirror-error/80',
      'focus-visible:ring-mirror-error'
    ),
    info: cn(
      'bg-mirror-info text-white',
      'hover:bg-mirror-info/90 hover:-translate-y-0.5',
      'active:scale-[0.98] active:bg-mirror-info/80',
      'focus-visible:ring-mirror-info'
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
        // Fast transitions (200ms - snappy and responsive)
        'transition-all duration-200',
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
