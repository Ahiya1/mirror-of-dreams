'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';

import CosmicBackground from '@/components/shared/CosmicBackground';
import { GlassCard, GlowButton } from '@/components/ui/glass';

/**
 * Demo User Call-to-Action Component
 *
 * Displays when a demo user tries to access the reflection experience.
 * Encourages them to create a free account or continue exploring.
 *
 * Features:
 * - Gradient background with cosmic elements
 * - Animated entrance
 * - Clear value proposition
 * - Multiple CTA options
 */
export function DemoUserCTA() {
  const router = useRouter();

  return (
    <div className="reflection-experience">
      <CosmicBackground />
      <div className="reflection-vignette" />
      <div className="flex min-h-screen items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-xl"
        >
          <GlassCard className="p-8 text-center">
            {/* Icon */}
            <div className="mb-6">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-purple-500/40 bg-gradient-to-br from-purple-500/30 to-pink-500/30">
                <span className="text-4xl">{'\uD83E\uDE9E'}</span>
              </div>
            </div>

            {/* Heading */}
            <h1 className="mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-3xl font-bold text-transparent">
              Ready to Start Your Journey?
            </h1>

            {/* Description */}
            <p className="mb-6 text-lg leading-relaxed text-white/70">
              You've explored what Mirror of Dreams can offer. Now it's time to create your own
              reflections and discover insights unique to your path.
            </p>

            {/* Benefits List */}
            <div className="mb-8 rounded-xl bg-white/5 p-4 text-left">
              <p className="mb-3 font-medium text-purple-300">With a free account, you get:</p>
              <ul className="space-y-2 text-white/70">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-mirror-success" />
                  <span>2 reflections per month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-mirror-success" />
                  <span>Track up to 2 dreams</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-mirror-success" />
                  <span>Personal reflection history</span>
                </li>
              </ul>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <GlowButton
                variant="primary"
                size="lg"
                className="flex-1"
                onClick={() => router.push('/auth/signup')}
              >
                Create Free Account
              </GlowButton>
              <GlowButton
                variant="ghost"
                size="lg"
                className="flex-1"
                onClick={() => router.push('/reflections')}
              >
                Continue Exploring
              </GlowButton>
            </div>

            {/* Sign In Link */}
            <p className="mt-6 text-sm text-white/50">
              Already have an account?{' '}
              <button
                onClick={() => router.push('/auth/signin')}
                className="text-purple-400 transition-colors hover:text-purple-300"
              >
                Sign in
              </button>
            </p>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
