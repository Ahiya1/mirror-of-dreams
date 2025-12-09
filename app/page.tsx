/**
 * Landing Page
 *
 * Builder: Builder-2 (Iteration 3)
 *
 * Complete rebuild of landing page using design system:
 * - CosmicBackground (replaces MirrorShards)
 * - LandingNavigation (replaces portal Navigation)
 * - Hero section with dual CTAs
 * - 4 feature highlight cards
 * - Footer with links
 * - Responsive design (mobile-first)
 * - Scroll-triggered animations
 */

'use client';

import { motion } from 'framer-motion';

import LandingFeatureCard from '@/components/landing/LandingFeatureCard';
import LandingHero from '@/components/landing/LandingHero';
import CosmicBackground from '@/components/shared/CosmicBackground';
import LandingNavigation from '@/components/shared/LandingNavigation';

export default function LandingPage() {
  const useCases = [
    {
      id: 'witness',
      icon: '🌙',
      title: 'Be Witnessed, Not Fixed',
      description:
        'Share your dreams and reflections with a presence that listens without judgment, advice, or agenda. Sometimes the most profound shifts come from simply being heard.',
      example: 'A companion who walks alongside',
    },
    {
      id: 'patterns',
      icon: '✨',
      title: "Notice What's Emerging",
      description:
        'Over time, patterns reveal themselves—not because someone points them out, but because you begin to see them for yourself through the mirror of your own words.',
      example: 'Your journey, witnessed over time',
    },
    {
      id: 'journey',
      icon: '🌸',
      title: 'Walk Your Own Path',
      description:
        "This is your journey. Your companion walks alongside you, reflecting back what you share, celebrating where you've been and where you're going.",
      example: 'Growth at your own pace',
    },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Background (consistent with authenticated app) */}
      <CosmicBackground animated={true} intensity={1} />

      {/* Navigation */}
      <LandingNavigation transparent />

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="flex min-h-screen items-center justify-center px-4 pb-8 pt-24 sm:px-8 sm:pb-0 sm:pt-0">
          <LandingHero />
        </section>

        {/* Use Cases Section */}
        <section id="features" className="px-4 py-20 sm:px-8">
          <div className="mx-auto max-w-7xl">
            {/* Section Headline */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-16 text-center text-4xl font-bold sm:text-5xl"
            >
              <span className="bg-gradient-to-r from-purple-400 via-amber-300/80 to-purple-400 bg-clip-text text-transparent">
                A Space for Dreamers
              </span>
            </motion.h2>

            {/* Use Case Cards Grid */}
            <motion.div
              className="grid grid-cols-1 gap-8 md:grid-cols-3"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.15 },
                },
              }}
            >
              {useCases.map((useCase) => (
                <motion.div
                  key={useCase.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                  }}
                >
                  <LandingFeatureCard
                    icon={useCase.icon}
                    title={useCase.title}
                    description={useCase.description}
                  />
                  <p className="mt-3 text-center text-sm text-purple-400">{useCase.example}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-24 border-t border-white/10 px-4 py-12 sm:px-6">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-4">
            {/* Brand */}
            <div>
              <h3 className="mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-xl font-bold text-transparent">
                Mirror of Dreams
              </h3>
              <p className="text-sm leading-relaxed text-white/60">
                A sacred space for dreamers who want to listen more deeply to themselves.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="mb-3 font-semibold text-white/90">Product</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li>
                  <a href="/pricing" className="transition-colors hover:text-purple-400">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#demo" className="transition-colors hover:text-purple-400">
                    See Demo
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="mb-3 font-semibold text-white/90">Company</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li>
                  <a href="/about" className="transition-colors hover:text-purple-400">
                    About
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="mb-3 font-semibold text-white/90">Legal</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li>
                  <a href="/privacy" className="transition-colors hover:text-purple-400">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/terms" className="transition-colors hover:text-purple-400">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="mx-auto mt-8 max-w-6xl border-t border-white/10 pt-8 text-center text-sm text-white/40">
            © {new Date().getFullYear()} Mirror of Dreams. All rights reserved.
          </div>
        </footer>
      </main>
    </div>
  );
}
