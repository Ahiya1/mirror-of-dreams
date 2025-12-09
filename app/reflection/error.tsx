'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { ErrorFallback } from '@/components/error/ErrorFallback';

/**
 * Reflection Error Boundary
 *
 * Catches errors in /reflection/* routes and displays a contextual error UI.
 */
export default function ReflectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log error to console (future: integrate with Sentry)
    console.error('[Reflection Error] Route error:', {
      message: error.message,
      digest: error.digest,
      route: '/reflection',
    });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <ErrorFallback
        title="Reflection interrupted"
        message="Something unexpected happened during your reflection. Take a breath, and when you're ready, try again."
        errorDigest={error.digest}
        onRetry={reset}
        onGoHome={() => router.push('/dashboard')}
      />
    </div>
  );
}
