'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * PayPal Success Redirect Handler Content
 *
 * This component handles the return URL from PayPal after successful subscription.
 * Immediately redirects to pricing page with success query parameter.
 */
function SubscriptionSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get any additional parameters from PayPal (like subscription_id, token, etc.)
    const subscriptionId = searchParams.get('subscription_id');
    const token = searchParams.get('token');

    // Build redirect URL with subscription=success
    let redirectUrl = '/pricing?subscription=success';

    // Optionally preserve PayPal parameters for debugging/logging
    if (subscriptionId) {
      redirectUrl += `&subscription_id=${subscriptionId}`;
    }
    if (token) {
      redirectUrl += `&token=${token}`;
    }

    // Redirect to pricing page with success parameter
    router.replace(redirectUrl);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-white/80">Processing your subscription...</p>
      </div>
    </div>
  );
}

// Loading fallback
function SubscriptionSuccessLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-white/80">Loading...</p>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={<SubscriptionSuccessLoading />}>
      <SubscriptionSuccessContent />
    </Suspense>
  );
}
