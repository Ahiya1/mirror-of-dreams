'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import {
  GlassCard,
  GlowButton,
  GradientText,
  CosmicLoader,
  AnimatedBackground,
} from '@/components/ui/glass';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark p-4">
      <AnimatedBackground />

      <GlassCard className="max-w-md w-full p-8 text-center" elevated>
        {/* Success Icon */}
        <div className="mb-6">
          <CheckCircle className="w-16 h-16 text-mirror-success mx-auto animate-pulse" />
        </div>

        {/* Title */}
        <GradientText className="text-h2 font-bold block mb-3">
          Payment Successful!
        </GradientText>

        {/* Message */}
        <p className="text-body text-white/80 mb-4">
          Welcome to your upgraded experience
        </p>

        {/* Redirect Notice */}
        <p className="text-body-sm text-white/50">
          Redirecting to your dashboard...
        </p>

        {/* Visual Loading Indicator */}
        <div className="mt-6">
          <CosmicLoader size="sm" label="Redirecting..." />
        </div>
      </GlassCard>
    </div>
  );
}

// Loading fallback
function SubscriptionSuccessLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark">
      <AnimatedBackground />
      <GlassCard className="p-8 text-center" elevated>
        <CosmicLoader size="lg" label="Loading..." />
        <p className="text-body text-white/80 mt-4">Loading...</p>
      </GlassCard>
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
