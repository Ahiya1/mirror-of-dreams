/**
 * LandingHero - Hero section for landing page
 *
 * Builder: Builder-2 (Iteration 3)
 * Updated: Builder-1 (Iteration 12) - Added "See Demo" CTA
 *
 * Features:
 * - Large headline with gradient text
 * - Compelling subheadline
 * - Dual CTAs (See Demo + Start Free)
 * - Responsive layout (mobile stacks vertically)
 * - Fade-in animation
 * - Demo login integration
 */

'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { GlowButton } from '@/components/ui/glass';
import { trpc } from '@/lib/trpc';

export default function LandingHero() {
  const router = useRouter();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const loginDemo = trpc.auth.loginDemo.useMutation();

  const handleSeeDemoClick = async () => {
    setIsLoggingIn(true);
    try {
      await loginDemo.mutateAsync();

      // Token is now set as HTTP-only cookie by server
      // No localStorage needed

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Demo login error:', error);
      setIsLoggingIn(false);
      // Error handling: show toast or alert
      if (typeof window !== 'undefined') {
        alert('Failed to load demo. Please try again or contact support.');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="mx-auto max-w-4xl px-4 text-center"
    >
      {/* Headline */}
      <h1 className="text-h1 mb-6 font-bold">
        <span className="bg-gradient-to-r from-purple-400 via-amber-300/90 to-purple-600 bg-clip-text text-transparent">
          Your dreams know things
        </span>
      </h1>

      {/* Subheadline */}
      <p className="mb-12 text-xl leading-relaxed text-white/70 sm:text-2xl">
        A companion for listening to what your inner life is trying to tell you
      </p>

      {/* CTAs */}
      <div className="flex flex-col justify-center gap-4 sm:flex-row">
        <GlowButton
          variant="warm"
          size="lg"
          onClick={handleSeeDemoClick}
          disabled={isLoggingIn || loginDemo.isPending}
        >
          {isLoggingIn || loginDemo.isPending ? 'Opening the door...' : 'Try It'}
        </GlowButton>
        <GlowButton variant="cosmic" size="lg" onClick={() => router.push('/auth/signup')}>
          Begin
        </GlowButton>
      </div>
    </motion.div>
  );
}
