'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/20 mx-auto mb-4"></div>
        <p className="text-white/80">Redirecting...</p>
      </div>
    </div>
  );
}

// Loading fallback
function SubscriptionCancelLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/20 mx-auto mb-4"></div>
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
