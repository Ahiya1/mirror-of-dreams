'use client';

import * as Sentry from '@sentry/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { ErrorFallback } from '@/components/error/ErrorFallback';

/**
 * Clarify Error Boundary
 *
 * Catches errors in /clarify/* routes and displays a contextual error UI.
 */
export default function ClarifyError({
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
        errorBoundary: 'clarify',
        digest: error.digest,
      },
      extra: {
        componentStack: error.stack,
        route: '/clarify',
      },
    });

    // Also log to console for development
    console.error('[Clarify Error] Route error:', {
      message: error.message,
      digest: error.digest,
      route: '/clarify',
    });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <ErrorFallback
        title="Conversation paused"
        message="We had trouble continuing our conversation. Your insights are valued - let's pick up where we left off."
        errorDigest={error.digest}
        onRetry={reset}
        onGoHome={() => router.push('/dashboard')}
      />
    </div>
  );
}
