'use client';

import { CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, Suspense } from 'react';

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
    <div className="from-mirror-dark via-mirror-midnight to-mirror-dark flex min-h-screen items-center justify-center bg-gradient-to-br p-4">
      <AnimatedBackground />

      <GlassCard className="w-full max-w-md p-8 text-center" elevated>
        {/* Success Icon */}
        <div className="mb-6">
          <CheckCircle className="mx-auto h-16 w-16 animate-pulse text-mirror-success" />
        </div>

        {/* Title */}
        <GradientText className="text-h2 mb-3 block font-bold">Payment Successful!</GradientText>

        {/* Message */}
        <p className="text-body mb-4 text-white/80">Welcome to your upgraded experience</p>

        {/* Redirect Notice */}
        <p className="text-body-sm text-white/50">Redirecting to your dashboard...</p>

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
    <div className="from-mirror-dark via-mirror-midnight to-mirror-dark flex min-h-screen items-center justify-center bg-gradient-to-br">
      <AnimatedBackground />
      <GlassCard className="p-8 text-center" elevated>
        <CosmicLoader size="lg" label="Loading..." />
        <p className="text-body mt-4 text-white/80">Loading...</p>
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
