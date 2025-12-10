'use client';

import * as Sentry from '@sentry/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { ErrorFallback } from '@/components/error/ErrorFallback';
import CosmicBackground from '@/components/shared/CosmicBackground';

/**
 * Root Error Boundary
 *
 * Catches unhandled errors in route segments and displays a friendly error UI.
 * This is a Next.js App Router error boundary file.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */
export default function Error({
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
        errorBoundary: 'root',
        digest: error.digest,
      },
      extra: {
        componentStack: error.stack,
      },
    });

    // Also log to console for development
    console.error('[Error Boundary] Route error:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <CosmicBackground animated={false} />

      <div className="relative z-10 w-full">
        <ErrorFallback
          title="Something went wrong"
          message="We encountered an unexpected error while loading this page. Please try again."
          errorDigest={error.digest}
          onRetry={reset}
          onGoHome={() => router.push('/')}
        />
      </div>
    </div>
  );
}
