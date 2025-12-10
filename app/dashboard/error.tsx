'use client';

import * as Sentry from '@sentry/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { ErrorFallback } from '@/components/error/ErrorFallback';

/**
 * Dashboard Error Boundary
 *
 * Catches errors in /dashboard/* routes and displays a contextual error UI.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Capture error in Sentry with context
    Sentry.captureException(error, {
      tags: {
        errorBoundary: 'dashboard',
        digest: error.digest,
      },
      extra: {
        componentStack: error.stack,
        route: '/dashboard',
      },
    });

    // Also log to console for development
    console.error('[Dashboard Error] Route error:', {
      message: error.message,
      digest: error.digest,
      route: '/dashboard',
    });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <ErrorFallback
        title="Dashboard unavailable"
        message="We had trouble loading your dashboard. Your dreams and reflections are safe - let's try again."
        errorDigest={error.digest}
        onRetry={reset}
        onGoHome={() => router.push('/')}
      />
    </div>
  );
}
