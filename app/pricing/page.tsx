'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

import type { BillingPeriod } from '@/lib/utils/constants';

import { AppNavigation } from '@/components/shared/AppNavigation';
import CosmicBackground from '@/components/shared/CosmicBackground';
import LandingNavigation from '@/components/shared/LandingNavigation';
import { PricingCard } from '@/components/subscription/PricingCard';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/hooks/useAuth';
import { TIER_LIMITS, TIER_PRICING, DAILY_LIMITS, DREAM_LIMITS } from '@/lib/utils/constants';

// Separate component that uses searchParams
function PricingPageContent() {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const searchParams = useSearchParams();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');

  // Handle PayPal return redirects
  useEffect(() => {
    const subscription = searchParams.get('subscription');

    if (subscription === 'success') {
      toast.success('Subscription activated! Welcome to your new tier.');
      // Clean up URL
      window.history.replaceState({}, '', '/pricing');
    } else if (subscription === 'canceled') {
      toast.info('Checkout canceled. Your current plan is still active.');
      window.history.replaceState({}, '', '/pricing');
    } else if (subscription === 'error') {
      const errorMessage = searchParams.get('message') || 'Payment failed';
      toast.error(errorMessage);
      window.history.replaceState({}, '', '/pricing');
    }
  }, [searchParams, toast]);

  const tiers = [
    {
      tier: 'free' as const,
      name: 'Wanderer',
      monthlyPrice: 0,
      yearlyPrice: 0,
      description: 'Perfect for beginning your journey',
      features: [
        { name: `${TIER_LIMITS.free} conversations per month`, included: true },
        { name: `Hold ${DREAM_LIMITS.free} dreams at once`, included: true },
        { name: "Your companion's presence", included: true },
        { name: 'All conversation styles', included: true },
        { name: 'Journey insights', included: false },
        { name: 'Pattern visualizations', included: false },
        { name: 'Daily conversation limits', included: false },
        { name: 'Priority support', included: false },
      ],
    },
    {
      tier: 'pro' as const,
      name: 'Seeker',
      monthlyPrice: TIER_PRICING.pro.monthly,
      yearlyPrice: TIER_PRICING.pro.yearly,
      description: 'For those ready to go deeper',
      popular: true,
      features: [
        { name: `${TIER_LIMITS.pro} conversations per month`, included: true },
        { name: `${DAILY_LIMITS.pro} conversation per day`, included: true },
        { name: `Hold ${DREAM_LIMITS.pro} dreams at once`, included: true },
        { name: 'Deeper companion presence', included: true },
        { name: 'All conversation styles', included: true },
        { name: 'Journey insights', included: true },
        { name: 'Pattern visualizations', included: true },
        { name: 'Priority support', included: true },
      ],
    },
    {
      tier: 'unlimited' as const,
      name: 'Devoted',
      monthlyPrice: TIER_PRICING.unlimited.monthly,
      yearlyPrice: TIER_PRICING.unlimited.yearly,
      description: 'For the committed inner traveler',
      features: [
        { name: `${TIER_LIMITS.unlimited} conversations per month`, included: true },
        { name: `${DAILY_LIMITS.unlimited} conversations per day`, included: true },
        { name: 'Hold unlimited dreams', included: true },
        { name: 'Deepest companion presence', included: true },
        { name: 'All conversation styles', included: true },
        { name: 'Journey insights', included: true },
        { name: 'Pattern visualizations', included: true },
        { name: 'Priority support', included: true },
      ],
    },
  ];

  const faqs = [
    {
      question: 'Can I change plans later?',
      answer:
        'Yes! You can upgrade or downgrade at any time. When upgrading, new features are available immediately. When downgrading, changes take effect at the end of your current billing period.',
    },
    {
      question: 'What happens if I exceed my reflection limit?',
      answer:
        "When you reach your monthly limit, you'll be prompted to upgrade. Your existing reflections remain accessible, but you won't be able to create new ones until next month or after upgrading.",
    },
    {
      question: 'Is my data secure?',
      answer:
        'Absolutely. All data is encrypted in transit and at rest. We never share your reflections with third parties. Your dreams are sacred and private.',
    },
    {
      question: "What's your refund policy?",
      answer:
        "We offer a 14-day money-back guarantee. If you're not satisfied with Pro or Unlimited within 14 days of purchase, contact support for a full refund.",
    },
    {
      question: 'Do you offer annual billing?',
      answer:
        'Yes! Annual billing saves 17% compared to monthly. Toggle between monthly and yearly above to see the pricing.',
    },
  ];

  return (
    <div className="relative min-h-screen">
      <CosmicBackground animated intensity={1} />

      {/* Navigation - Show app nav if authenticated, landing nav otherwise */}
      {isAuthenticated ? (
        <AppNavigation currentPage="dashboard" />
      ) : (
        <LandingNavigation transparent />
      )}

      <main className="relative z-10 px-4 pb-20 pt-32">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-h1 mb-4 bg-gradient-to-r from-purple-400 via-amber-300/80 to-purple-400 bg-clip-text text-transparent text-white">
              Find Your Space
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-white/60">
              Choose what feels right for where you are now
            </p>
          </div>

          {/* Billing Period Toggle */}
          <div className="mb-12 flex items-center justify-center gap-4">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`rounded-lg px-6 py-2 font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`rounded-lg px-6 py-2 font-medium transition-all ${
                billingPeriod === 'yearly'
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Yearly
              <span className="ml-2 text-sm text-mirror-success">Save 17%</span>
            </button>
          </div>

          {/* Tier Cards */}
          <div className="mb-20 grid gap-6 md:grid-cols-3 lg:gap-8">
            {tiers.map((tier) => (
              <PricingCard
                key={tier.tier}
                {...tier}
                billingPeriod={billingPeriod}
                currentUserTier={user?.tier}
              />
            ))}
          </div>

          {/* FAQ Section */}
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-8 text-center text-3xl font-bold text-white">
              Frequently Asked Questions
            </h2>

            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <details key={idx} className="group">
                  <summary className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10">
                    <span className="font-medium text-white">{faq.question}</span>
                    <span className="text-white/60 transition-transform group-open:rotate-180">
                      ▼
                    </span>
                  </summary>
                  <div className="p-4 text-white/80">{faq.answer}</div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-24 border-t border-white/10 px-4 py-12 sm:px-6">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-4 font-semibold text-white">Mirror of Dreams</h3>
            <p className="text-sm text-white/60">A sacred space for reflection, powered by AI.</p>
          </div>
          <div>
            <h3 className="mb-4 font-semibold text-white">Product</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/pricing" className="text-white/60 transition-colors hover:text-white">
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-white/60 transition-colors hover:text-white"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-semibold text-white">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-white/60 transition-colors hover:text-white">
                  About
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-semibold text-white">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-white/60 transition-colors hover:text-white">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="text-white/60 transition-colors hover:text-white">
                  Terms
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-7xl border-t border-white/10 pt-8 text-center text-sm text-white/40">
          &copy; {new Date().getFullYear()} Mirror of Dreams. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

// Loading fallback component
function PricingPageLoading() {
  return (
    <div className="relative min-h-screen">
      <CosmicBackground animated intensity={1} />
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-purple-500"></div>
          <p className="text-white/80">Loading pricing...</p>
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function PricingPage() {
  return (
    <Suspense fallback={<PricingPageLoading />}>
      <PricingPageContent />
    </Suspense>
  );
}
