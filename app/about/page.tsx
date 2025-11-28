/**
 * About Page - Mirror of Dreams
 *
 * CONTENT STATUS: Placeholder content used
 * TODO: Replace placeholder content with Ahiya's founder story, mission, philosophy
 * See PLACEHOLDER_CONTENT object for sections needing real content
 */

'use client';

import Link from 'next/link';
import CosmicBackground from '@/components/shared/CosmicBackground';
import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlowButton } from '@/components/ui/glass/GlowButton';

const PLACEHOLDER_CONTENT = {
  founderStory: `[FOUNDER STORY - 250-350 words]

This section will contain Ahiya's personal narrative about why Mirror of Dreams was created. The story should include:
- The personal experience that led to this product
- The transformation Ahiya hopes to enable for users
- The vision for reflection as a practice

CONTENT STATUS: Pending from Ahiya`,

  mission: `We believe everyone has dreams worth pursuing and the wisdom to achieve them. Mirror of Dreams provides a sacred space for reflection, powered by AI that listens without judgment and recognizes patterns we might miss.`,

  philosophy: `[PRODUCT PHILOSOPHY - 100-150 words]

Why combine human reflection with AI? Because...
[Explanation of the approach, what makes it unique]

CONTENT STATUS: Pending from Ahiya`,

  values: [
    {
      title: 'Privacy-First',
      description: 'Your reflections are sacred and private. We never share your data.',
    },
    {
      title: 'Substance Over Flash',
      description: 'Beautiful design serves depth, not distraction.',
    },
    {
      title: 'Continuous Evolution',
      description: 'We grow alongside your reflection practice.',
    },
  ],
};

export default function AboutPage() {
  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <CosmicBackground animated={true} intensity={1} />

      {/* Simple navigation */}
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
              <GlowButton size="sm">
                Start Free
              </GlowButton>
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-16">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-4 sm:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              About Mirror of Dreams
            </h1>
            <p className="text-xl sm:text-2xl text-white/60 max-w-2xl mx-auto">
              {PLACEHOLDER_CONTENT.mission}
            </p>
          </div>
        </section>

        {/* Founder Story Section */}
        <section className="py-20 px-4 sm:px-8">
          <div className="max-w-4xl mx-auto">
            <GlassCard elevated>
              <h2 className="text-3xl font-bold text-white mb-6">
                Why I Built Mirror of Dreams
              </h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-white/80 text-lg leading-relaxed whitespace-pre-line">
                  {PLACEHOLDER_CONTENT.founderStory}
                </p>
              </div>
            </GlassCard>
          </div>
        </section>

        {/* Product Philosophy Section */}
        <section className="py-20 px-4 sm:px-8">
          <div className="max-w-4xl mx-auto">
            <GlassCard elevated>
              <h2 className="text-3xl font-bold text-white mb-6">
                Why Reflection + AI?
              </h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-white/80 text-lg leading-relaxed whitespace-pre-line">
                  {PLACEHOLDER_CONTENT.philosophy}
                </p>
              </div>
            </GlassCard>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 px-4 sm:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Our Values
            </h2>
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {PLACEHOLDER_CONTENT.values.map((value, idx) => (
                <GlassCard key={idx} elevated>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {value.title}
                  </h3>
                  <p className="text-white/70">
                    {value.description}
                  </p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              Ready to Begin?
            </h2>
            <p className="text-white/60 text-lg mb-8">
              Start your reflection journey today with a free account.
            </p>
            <Link href="/auth/signup">
              <GlowButton variant="cosmic" size="lg">
                Start Your Free Account
              </GlowButton>
            </Link>
          </div>
        </section>
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
                <Link href="/pricing" className="text-white/60 hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-white/60 hover:text-white transition-colors">
                  About
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-white/60 hover:text-white transition-colors">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="text-white/60 hover:text-white transition-colors">
                  Terms
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-white/10 text-center text-white/40 text-sm">
          &copy; {new Date().getFullYear()} Mirror of Dreams. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
