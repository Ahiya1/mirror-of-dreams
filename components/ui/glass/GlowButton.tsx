'use client';

import { memo } from 'react';

import type { GlowButtonProps } from '@/types/glass-components';

import { cn } from '@/lib/utils';
import { haptic } from '@/lib/utils/haptics';

/**
 * GlowButton - Enhanced button with cosmic and semantic variants
 *
 * Wrapped in React.memo to prevent unnecessary re-renders when parent re-renders
 * with the same props.
 *
 * @param variant - Button style variant (primary | secondary | ghost | cosmic | success | danger | info)
 * @param size - Button size (sm | md | lg)
 * @param type - Button type (button | submit | reset)
 * @param onClick - Click handler
 * @param disabled - Disabled state
 * @param className - Additional Tailwind classes
 * @param children - Button content
 */
export const GlowButton = memo(function GlowButton({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className,
  children,
  onClick,
  disabled = false,
}: GlowButtonProps) {
  // Haptic-enhanced click handler
  const handleClick = () => {
    if (!disabled) {
      haptic('light'); // Trigger haptic feedback on tap
    }
    onClick?.();
  };
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
    // Warm variant - for primary actions that feel held and safe
    warm: cn(
      'bg-gradient-to-br from-amber-500/20 via-orange-500/15 to-amber-500/20',
      'border border-amber-500/30',
      'text-amber-100',
      'backdrop-blur-md',
      'hover:from-amber-500/30 hover:via-orange-500/25 hover:to-amber-500/30',
      'hover:border-amber-400/50',
      'hover:-translate-y-0.5',
      'hover:shadow-[0_12px_35px_rgba(251,191,36,0.25)]',
      'active:scale-[0.98]',
      'before:absolute before:inset-0',
      'before:bg-gradient-to-r before:from-transparent before:via-amber-200/15 before:to-transparent',
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

  // Size classes with minimum touch targets (48px for WCAG AA compliance)
  const sizes = {
    sm: 'px-4 py-2 text-sm min-h-[44px] min-w-[44px]',
    md: 'px-6 py-3 text-base min-h-[48px] min-w-[48px]',
    lg: 'px-8 py-4 text-lg min-h-[52px] min-w-[52px]',
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        // Base structure
        'rounded-lg font-medium',
        'relative',
        // Fast transitions (200ms - snappy and responsive)
        'transition-all duration-200',
        'disabled:cursor-not-allowed disabled:opacity-50',
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
});
