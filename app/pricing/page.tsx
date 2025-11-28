'use client';

import Link from 'next/link';
import CosmicBackground from '@/components/shared/CosmicBackground';
import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { Check, X } from 'lucide-react';
import { TIER_LIMITS } from '@/lib/utils/constants';

export default function PricingPage() {
  const tiers = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for exploring Mirror of Dreams',
      cta: 'Start Free',
      ctaLink: '/auth/signup',
      popular: false,
      features: [
        { name: `${TIER_LIMITS.free} reflections per month`, included: true },
        { name: '3 active dreams', included: true },
        { name: 'Basic AI insights', included: true },
        { name: 'All reflection tones', included: true },
        { name: 'Evolution reports', included: false },
        { name: 'Visualizations', included: false },
        { name: 'Advanced AI model', included: false },
        { name: 'Priority support', included: false },
      ],
    },
    {
      name: 'Premium',
      price: '$9.99',
      period: 'per month',
      description: 'For committed dreamers and deep reflection',
      cta: 'Start Premium',
      ctaLink: '/auth/signup?plan=premium',
      popular: true,
      features: [
        { name: `${TIER_LIMITS.essential} reflections per month`, included: true },
        { name: '10 active dreams', included: true },
        { name: 'Advanced AI insights', included: true },
        { name: 'All reflection tones', included: true },
        { name: 'Evolution reports', included: true },
        { name: 'Visualizations', included: true },
        { name: 'Advanced AI model', included: true },
        { name: 'Priority support', included: true },
      ],
    },
    {
      name: 'Pro',
      price: '$29.99',
      period: 'per month',
      description: 'Unlimited reflection for transformation',
      cta: 'Start Pro',
      ctaLink: '/auth/signup?plan=pro',
      popular: false,
      features: [
        { name: 'Unlimited reflections', included: true },
        { name: 'Unlimited dreams', included: true },
        { name: 'Premium AI insights', included: true },
        { name: 'All reflection tones', included: true },
        { name: 'Evolution reports', included: true },
        { name: 'Visualizations', included: true },
        { name: 'Advanced AI model', included: true },
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
        "We offer a 14-day money-back guarantee. If you're not satisfied with Premium or Pro within 14 days of purchase, contact support for a full refund.",
    },
    {
      question: 'Do you offer annual billing?',
      answer:
        'Yes! Annual billing saves 17% compared to monthly. You can switch to annual billing from your account settings after signing up.',
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
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Choose Your Path
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Start free and upgrade as your reflection practice deepens
            </p>
          </div>

          {/* Tier Cards */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-20">
            {tiers.map((tier) => (
              <GlassCard
                key={tier.name}
                elevated
                interactive={tier.popular}
                className={`relative ${
                  tier.popular
                    ? 'border-2 border-purple-500/50 shadow-lg shadow-purple-500/20'
                    : ''
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-semibold px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                )}

                <div className="p-6">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {tier.name}
                  </h3>
                  <p className="text-white/60 text-sm mb-6">
                    {tier.description}
                  </p>

                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">
                      {tier.price}
                    </span>
                    <span className="text-white/60 ml-2">{tier.period}</span>
                  </div>

                  <Link href={tier.ctaLink} className="block mb-6">
                    <GlowButton
                      variant={tier.popular ? 'primary' : 'secondary'}
                      className="w-full"
                    >
                      {tier.cta}
                    </GlowButton>
                  </Link>

                  <div className="space-y-3">
                    {tier.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-white/30 flex-shrink-0 mt-0.5" />
                        )}
                        <span
                          className={
                            feature.included ? 'text-white' : 'text-white/40'
                          }
                        >
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
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
