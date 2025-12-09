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
    <div className="relative min-h-screen overflow-x-hidden">
      <CosmicBackground animated={true} intensity={1} />

      {/* Simple navigation */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-bold text-white">
            Mirror of Dreams
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/auth/signin" className="text-white/80 transition-colors hover:text-white">
              Sign In
            </Link>
            <Link href="/auth/signup">
              <GlowButton size="sm">Start Free</GlowButton>
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-16">
        {/* Hero Section */}
        <section className="flex min-h-screen items-center justify-center px-4 sm:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-h1 mb-6 font-bold text-white">About Mirror of Dreams</h1>
            <p className="mx-auto max-w-2xl text-xl text-white/60 sm:text-2xl">
              {PLACEHOLDER_CONTENT.mission}
            </p>
          </div>
        </section>

        {/* Founder Story Section */}
        <section className="px-4 py-20 sm:px-8">
          <div className="mx-auto max-w-4xl">
            <GlassCard elevated>
              <h2 className="mb-6 text-3xl font-bold text-white">Why I Built Mirror of Dreams</h2>
              <div className="prose prose-invert max-w-none">
                <p className="whitespace-pre-line text-lg leading-relaxed text-white/80">
                  {PLACEHOLDER_CONTENT.founderStory}
                </p>
              </div>
            </GlassCard>
          </div>
        </section>

        {/* Product Philosophy Section */}
        <section className="px-4 py-20 sm:px-8">
          <div className="mx-auto max-w-4xl">
            <GlassCard elevated>
              <h2 className="mb-6 text-3xl font-bold text-white">Why Reflection + AI?</h2>
              <div className="prose prose-invert max-w-none">
                <p className="whitespace-pre-line text-lg leading-relaxed text-white/80">
                  {PLACEHOLDER_CONTENT.philosophy}
                </p>
              </div>
            </GlassCard>
          </div>
        </section>

        {/* Values Section */}
        <section className="px-4 py-20 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-12 text-center text-3xl font-bold text-white">Our Values</h2>
            <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
              {PLACEHOLDER_CONTENT.values.map((value, idx) => (
                <GlassCard key={idx} elevated>
                  <h3 className="mb-3 text-xl font-semibold text-white">{value.title}</h3>
                  <p className="text-white/70">{value.description}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 py-20 sm:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-6 text-3xl font-bold text-white">Ready to Begin?</h2>
            <p className="mb-8 text-lg text-white/60">
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
