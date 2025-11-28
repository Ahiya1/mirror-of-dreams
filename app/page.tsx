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
import CosmicBackground from '@/components/shared/CosmicBackground';
import LandingNavigation from '@/components/shared/LandingNavigation';
import LandingHero from '@/components/landing/LandingHero';
import LandingFeatureCard from '@/components/landing/LandingFeatureCard';

export default function LandingPage() {
  const useCases = [
    {
      id: 'clarity',
      icon: '🚀',
      title: 'From Vague Aspiration to Clear Action Plan',
      description:
        '"I want to launch a SaaS product" becomes "Build MVP in 30 days, validate with 10 early users, iterate based on feedback." Your AI mirror breaks down dreams into concrete steps.',
      example: 'Real example from demo: Launch My SaaS Product',
    },
    {
      id: 'evolution',
      icon: '📈',
      title: 'See Your Growth Over Time',
      description:
        'Evolution reports analyze your reflections across weeks and months, revealing patterns you can\'t see day-to-day. Watch yourself shift from fear to confidence, from planning to execution.',
      example: 'Unlocked after 4 reflections on a dream',
    },
    {
      id: 'breakthroughs',
      icon: '💡',
      title: 'Break Through Mental Blocks',
      description:
        'Your AI mirror identifies recurring obstacles, asks questions you haven\'t considered, and challenges excuses. It\'s like having a coach available 24/7.',
      example: 'Fusion tone: Gentle encouragement + direct truth',
    },
  ];

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Background (consistent with authenticated app) */}
      <CosmicBackground animated={true} intensity={1} />

      {/* Navigation */}
      <LandingNavigation transparent />

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-4 sm:px-8">
          <LandingHero />
        </section>

        {/* Use Cases Section */}
        <section id="features" className="py-20 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Section Headline */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-4xl sm:text-5xl font-bold text-center mb-16"
            >
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                How Mirror of Dreams Transforms Your Life
              </span>
            </motion.h2>

            {/* Use Case Cards Grid */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
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
                  <p className="text-sm text-purple-400 mt-3 text-center">
                    {useCase.example}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 py-12 px-4 sm:px-6 mt-24">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div>
              <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Mirror of Dreams
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Transform your dreams into reality through AI-powered reflection.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold mb-3 text-white/90">Product</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li>
                  <a href="/pricing" className="hover:text-purple-400 transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#demo" className="hover:text-purple-400 transition-colors">
                    See Demo
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold mb-3 text-white/90">Company</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li>
                  <a href="/about" className="hover:text-purple-400 transition-colors">
                    About
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-3 text-white/90">Legal</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li>
                  <a href="/privacy" className="hover:text-purple-400 transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/terms" className="hover:text-purple-400 transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-white/10 text-center text-sm text-white/40">
            © {new Date().getFullYear()} Mirror of Dreams. All rights reserved.
          </div>
        </footer>
      </main>
    </div>
  );
}
