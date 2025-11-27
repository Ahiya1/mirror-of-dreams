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
  const features = [
    {
      id: 'ai-reflections',
      icon: '✨',
      title: 'AI-Powered Reflections',
      description: 'Your personal mirror analyzes patterns and provides insights into your subconscious.',
    },
    {
      id: 'track-dreams',
      icon: '📖',
      title: 'Track Your Dreams',
      description: 'Organize and revisit your dream journal anytime, anywhere.',
    },
    {
      id: 'visualize-evolution',
      icon: '📈',
      title: 'Visualize Your Evolution',
      description: 'See how your dreams and thoughts evolve over time with interactive charts.',
    },
    {
      id: 'sacred-space',
      icon: '🌙',
      title: 'Sacred Space',
      description: 'Premium experience designed for deep introspection and self-discovery.',
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

        {/* Features Section */}
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
                Why Mirror of Dreams?
              </span>
            </motion.h2>

            {/* Feature Cards Grid */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 },
                },
              }}
            >
              {features.map((feature) => (
                <motion.div
                  key={feature.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                  }}
                >
                  <LandingFeatureCard {...feature} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 sm:px-8 border-t border-white/10">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-white/60 text-sm">
              © 2025 Mirror of Dreams. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <a
                href="/about"
                className="text-white/60 hover:text-white/90 transition-colors"
              >
                About
              </a>
              <a
                href="/privacy"
                className="text-white/60 hover:text-white/90 transition-colors"
              >
                Privacy
              </a>
              <a
                href="/terms"
                className="text-white/60 hover:text-white/90 transition-colors"
              >
                Terms
              </a>
              <a
                href="/contact"
                className="text-white/60 hover:text-white/90 transition-colors"
              >
                Contact
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
