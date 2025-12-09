'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

/**
 * PayPal Cancel Redirect Handler Content
 *
 * This component handles the cancel URL from PayPal when user cancels checkout.
 * Immediately redirects to pricing page with canceled query parameter.
 */
function SubscriptionCancelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get any additional parameters from PayPal
    const token = searchParams.get('token');

    // Build redirect URL with subscription=canceled
    let redirectUrl = '/pricing?subscription=canceled';

    // Optionally preserve token for debugging
    if (token) {
      redirectUrl += `&token=${token}`;
    }

    // Redirect to pricing page with canceled parameter
    router.replace(redirectUrl);
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-white/20"></div>
        <p className="text-white/80">Redirecting...</p>
      </div>
    </div>
  );
}

// Loading fallback
function SubscriptionCancelLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-white/20"></div>
        <p className="text-white/80">Loading...</p>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function SubscriptionCancelPage() {
  return (
    <Suspense fallback={<SubscriptionCancelLoading />}>
      <SubscriptionCancelContent />
    </Suspense>
  );
}
