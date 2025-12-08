'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

/**
 * PayPal Success Page
 *
 * Shows a success message after PayPal subscription approval,
 * then redirects to the dashboard.
 */
function SubscriptionSuccessContent() {
  const router = useRouter();

  useEffect(() => {
    // Short delay to show success message, then redirect to dashboard
    const timer = setTimeout(() => {
      router.replace('/journey?upgraded=true');
    }, 2500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-950/50 to-black">
      <div className="text-center">
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4 animate-pulse" />
        <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
        <p className="text-white/70 mb-4">Welcome to your upgraded experience</p>
        <p className="text-white/50 text-sm">Redirecting to your dashboard...</p>
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
