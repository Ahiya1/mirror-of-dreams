'use client';

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
    // Log error to console (future: integrate with Sentry)
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
