'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import CosmicBackground from '@/components/shared/CosmicBackground';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { PricingCard } from '@/components/subscription/PricingCard';
import { TIER_LIMITS, TIER_PRICING, DAILY_LIMITS, DREAM_LIMITS } from '@/lib/utils/constants';
import type { BillingPeriod } from '@/lib/utils/constants';

// Separate component that uses searchParams
function PricingPageContent() {
  const { user } = useAuth();
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
      name: 'Free',
      monthlyPrice: 0,
      yearlyPrice: 0,
      description: 'Perfect for exploring Mirror of Dreams',
      features: [
        { name: `${TIER_LIMITS.free} reflections per month`, included: true },
        { name: `${DREAM_LIMITS.free} active dreams`, included: true },
        { name: 'Basic AI insights', included: true },
        { name: 'All reflection tones', included: true },
        { name: 'Evolution reports', included: false },
        { name: 'Visualizations', included: false },
        { name: 'Daily reflection limits', included: false },
        { name: 'Priority support', included: false },
      ],
    },
    {
      tier: 'pro' as const,
      name: 'Pro',
      monthlyPrice: TIER_PRICING.pro.monthly,
      yearlyPrice: TIER_PRICING.pro.yearly,
      description: 'For committed dreamers and deep reflection',
      popular: true,
      features: [
        { name: `${TIER_LIMITS.pro} reflections per month`, included: true },
        { name: `${DAILY_LIMITS.pro} reflection per day`, included: true },
        { name: `${DREAM_LIMITS.pro} active dreams`, included: true },
        { name: 'Advanced AI insights', included: true },
        { name: 'All reflection tones', included: true },
        { name: 'Evolution reports', included: true },
        { name: 'Visualizations', included: true },
        { name: 'Priority support', included: true },
      ],
    },
    {
      tier: 'unlimited' as const,
      name: 'Unlimited',
      monthlyPrice: TIER_PRICING.unlimited.monthly,
      yearlyPrice: TIER_PRICING.unlimited.yearly,
      description: 'Maximum reflection capacity for transformation',
      features: [
        { name: `${TIER_LIMITS.unlimited} reflections per month`, included: true },
        { name: `${DAILY_LIMITS.unlimited} reflections per day`, included: true },
        { name: 'Unlimited active dreams', included: true },
        { name: 'Premium AI insights with extended thinking', included: true },
        { name: 'All reflection tones', included: true },
        { name: 'Evolution reports', included: true },
        { name: 'Visualizations', included: true },
        { name: 'Priority support', included: true },
      ],
    },
  ];

  const faqs = [
    {
      question: 'Can I change plans later?',
      answer:
        "Yes! You can upgrade or downgrade at any time. When upgrading, new features are available immediately. When downgrading, changes take effect at the end of your current billing period.",
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
    <div className="min-h-screen relative">
      <CosmicBackground animated intensity={1} />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">
            Mirror of Dreams
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/auth/signin" className="text-white/80 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/auth/signup">
              <GlowButton size="sm">Start Free</GlowButton>
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Choose Your Path
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Start free and upgrade as your reflection practice deepens
            </p>
          </div>

          {/* Billing Period Toggle */}
          <div className="flex justify-center items-center gap-4 mb-12">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                billingPeriod === 'yearly'
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Yearly
              <span className="ml-2 text-green-400 text-sm">Save 17%</span>
            </button>
          </div>

          {/* Tier Cards */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-20">
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
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-white text-center mb-8">
              Frequently Asked Questions
            </h2>

            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <details key={idx} className="group">
                  <summary className="flex items-center justify-between cursor-pointer bg-white/5 hover:bg-white/10 transition-colors rounded-xl p-4 border border-white/10">
                    <span className="text-white font-medium">
                      {faq.question}
                    </span>
                    <span className="text-white/60 group-open:rotate-180 transition-transform">
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
      <footer className="border-t border-white/10 py-12 px-4 sm:px-6 mt-24 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-semibold mb-4">Mirror of Dreams</h3>
            <p className="text-white/60 text-sm">
              A sacred space for reflection, powered by AI.
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/pricing"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/about"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  About
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  Privacy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  Terms
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-white/10 text-center text-white/40 text-sm">
          &copy; {new Date().getFullYear()} Mirror of Dreams. All rights
          reserved.
        </div>
      </footer>
    </div>
  );
}

// Loading fallback component
function PricingPageLoading() {
  return (
    <div className="min-h-screen relative">
      <CosmicBackground animated intensity={1} />
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
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
