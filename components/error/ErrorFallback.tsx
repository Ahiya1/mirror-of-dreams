'use client';

import { GlowButton } from '@/components/ui/glass/GlowButton';
import { cn } from '@/lib/utils';

/**
 * Props for ErrorFallback component
 */
export interface ErrorFallbackProps {
  /** Error title heading */
  title?: string;
  /** Error description message */
  message?: string;
  /** Error digest/ID for support reference */
  errorDigest?: string;
  /** Handler for retry action */
  onRetry?: () => void;
  /** Handler for go home action */
  onGoHome?: () => void;
  /** Visual variant */
  variant?: 'default' | 'minimal' | 'full';
}

/**
 * ErrorFallback - Reusable error display component
 *
 * Provides a consistent error UI following the cosmic/glass design system.
 * Used by error boundaries throughout the application.
 *
 * @example
 * ```tsx
 * <ErrorFallback
 *   title="Something went wrong"
 *   message="We encountered an unexpected error."
 *   onRetry={() => reset()}
 *   onGoHome={() => router.push('/')}
 * />
 * ```
 */
export function ErrorFallback({
  title = 'Something went wrong',
  message = 'We encountered an unexpected error while loading this page.',
  errorDigest,
  onRetry,
  onGoHome,
  variant = 'default',
}: ErrorFallbackProps) {
  const isMinimal = variant === 'minimal';
  const isFull = variant === 'full';

  return (
    <div className={cn('mx-auto w-full max-w-md', isFull && 'max-w-lg')}>
      {/* Glass card container with error accent */}
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl text-center',
          'backdrop-blur-md',
          'from-white/8 bg-gradient-to-br via-transparent to-red-500/5',
          'border',
          isMinimal ? 'p-6' : 'p-8'
        )}
        style={{
          borderColor: 'var(--error-border)',
        }}
      >
        {/* Subtle glow effect behind content */}
        <div className="absolute inset-0 -z-10 opacity-30 blur-3xl" aria-hidden="true">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500/15 via-purple-500/10 to-red-500/15" />
        </div>

        {/* Error icon */}
        {!isMinimal && (
          <div className="mb-6 text-5xl opacity-80" aria-hidden="true">
            <svg
              className="mx-auto h-16 w-16"
              style={{ color: 'var(--error-primary)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
        )}

        {/* Title */}
        <h2
          className={cn('font-medium', isMinimal ? 'mb-2 text-lg' : 'mb-4 text-xl')}
          style={{ color: 'var(--error-primary)' }}
        >
          {title}
        </h2>

        {/* Message */}
        <p
          className={cn('leading-relaxed', isMinimal ? 'mb-4 text-sm' : 'mb-6 text-base')}
          style={{ color: 'var(--cosmic-text-secondary)' }}
        >
          {message}
        </p>

        {/* Error digest for support */}
        {errorDigest && (
          <p
            className="mb-6 inline-block rounded-lg px-3 py-2 font-mono text-xs"
            style={{
              color: 'var(--cosmic-text-muted)',
              background: 'rgba(255, 255, 255, 0.05)',
            }}
          >
            Error ID: {errorDigest}
          </p>
        )}

        {/* Action buttons */}
        <div
          className={cn(
            'flex gap-3',
            isMinimal ? 'flex-row justify-center' : 'flex-col justify-center sm:flex-row'
          )}
        >
          {onRetry && (
            <GlowButton variant="danger" size={isMinimal ? 'sm' : 'md'} onClick={onRetry}>
              Try Again
            </GlowButton>
          )}
          {onGoHome && (
            <GlowButton variant="ghost" size={isMinimal ? 'sm' : 'md'} onClick={onGoHome}>
              Go Home
            </GlowButton>
          )}
        </div>
      </div>
    </div>
  );
}

export default ErrorFallback;
