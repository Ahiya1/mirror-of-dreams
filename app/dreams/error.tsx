'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { ErrorFallback } from '@/components/error/ErrorFallback';

/**
 * Dreams Error Boundary
 *
 * Catches errors in /dreams/* routes and displays a contextual error UI.
 */
export default function DreamsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log error to console (future: integrate with Sentry)
    console.error('[Dreams Error] Route error:', {
      message: error.message,
      digest: error.digest,
      route: '/dreams',
    });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <ErrorFallback
        title="Dream interrupted"
        message="We had trouble loading this dream. Your dream journal is safe - let's try viewing it again."
        errorDigest={error.digest}
        onRetry={reset}
        onGoHome={() => router.push('/dashboard')}
      />
    </div>
  );
}
