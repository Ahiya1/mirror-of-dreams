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
      const { token, user } = await loginDemo.mutateAsync();

      // Store token
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
      }

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
      className="text-center max-w-4xl mx-auto px-4"
    >
      {/* Headline */}
      <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6">
        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 bg-clip-text text-transparent">
          Transform Your Dreams into Reality Through AI-Powered Reflection
        </span>
      </h1>

      {/* Subheadline */}
      <p className="text-xl sm:text-2xl text-white/70 mb-12 leading-relaxed">
        Your personal AI mirror analyzes your reflections, reveals hidden patterns,
        and guides your evolution — one dream at a time
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <GlowButton
          variant="primary"
          size="lg"
          onClick={handleSeeDemoClick}
          disabled={isLoggingIn || loginDemo.isPending}
        >
          {isLoggingIn || loginDemo.isPending ? 'Loading Demo...' : 'See Demo'}
        </GlowButton>
        <GlowButton
          variant="secondary"
          size="lg"
          onClick={() => router.push('/auth/signup')}
        >
          Start Free
        </GlowButton>
      </div>
    </motion.div>
  );
}
