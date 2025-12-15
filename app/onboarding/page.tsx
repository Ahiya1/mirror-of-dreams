/**
 * Onboarding Page - 4-step wizard for new users
 * Iteration: 27 (Iteration 2 of Plan 17)
 * Builder: Builder-1
 *
 * Updated: Added Clarify explanation step (step 3 of 4)
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import {
  GlassCard,
  GlowButton,
  ProgressOrbs,
  GradientText,
  CosmicLoader,
} from '@/components/ui/glass';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';

interface OnboardingStep {
  title: string;
  content: string;
  visual: string; // Emoji
}

const steps: OnboardingStep[] = [
  {
    title: 'Welcome, Dreamer',
    content:
      "This is your companion for inner listening.\n\nYour dreams know things. We're here to help you listen to what they're trying to tell you—gently, with warmth and presence.",
    visual: '🌙',
  },
  {
    title: 'How Reflections Work',
    content:
      "When you're ready, you'll explore 5 questions about what you're holding:\n\n1. What's the dream you're carrying?\n2. What feels like your next step?\n3. Is there a time horizon?\n4. How do you relate to this dream?\n5. What are you willing to give for it?\n\nOver time, patterns begin to emerge—not because we reveal them, but because you start to see them yourself.",
    visual: '✨',
  },
  {
    title: 'Clarify: Your Exploration Space',
    content:
      "Before naming a dream, explore what's stirring in you.\n\nHave open reflections to discover what truly resonates. When something feels clear, you can give it a name and begin tending to it.",
    visual: '🔮',
  },
  {
    title: 'Your Wanderer Space',
    content:
      "As a Wanderer, you receive:\n✓ 2 dreams to hold\n✓ 2 reflections per month\n✓ Access to your journey insights\n✓ Pattern visualizations\n\nWhen you're ready for more space, Seeker and Devoted paths await.\n\nNo rush. Begin where you are.",
    visual: '🌱',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [step, setStep] = useState(0);

  // All hooks must be called before any conditional returns
  const completeOnboarding = trpc.users.completeOnboarding.useMutation({
    onSuccess: () => {
      router.push('/dashboard');
    },
    onError: () => {
      // Graceful fallback - redirect anyway (user experience > data consistency)
      router.push('/dashboard');
    },
  });

  // Redirect unverified users to verify-required page
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
        return;
      }
      // If user is not verified (and not admin/creator/demo), redirect to verify-required
      if (user && !user.emailVerified && !user.isAdmin && !user.isCreator && !user.isDemo) {
        router.push('/auth/verify-required');
        return;
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      completeOnboarding.mutate();
    }
  };

  const handleSkip = () => {
    completeOnboarding.mutate();
  };

  // Show loading while checking auth
  if (authLoading || !user) {
    return (
      <div className="from-mirror-dark via-mirror-midnight to-mirror-dark flex min-h-screen items-center justify-center bg-gradient-to-br">
        <CosmicLoader size="lg" />
      </div>
    );
  }

  // Don't render onboarding if user needs to verify email
  if (!user.emailVerified && !user.isAdmin && !user.isCreator && !user.isDemo) {
    return null;
  }

  return (
    <div className="from-mirror-dark via-mirror-midnight to-mirror-dark relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br p-4">
      {/* Simple static ambient glow - no heavy animations */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <GlassCard className="relative z-10 w-full max-w-2xl p-8" elevated>
        {/* Progress Indicator */}
        <ProgressOrbs steps={steps.length} currentStep={step} className="mb-8 justify-center" />

        {/* Step Content with Animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1], // Smooth ease-out curve
            }}
            className="mb-8 text-center"
            style={{ willChange: 'opacity, transform' }}
          >
            {/* Visual Emoji */}
            <div className="mb-4 text-6xl">{steps[step].visual}</div>

            {/* Title */}
            <GradientText className="mb-4 text-3xl font-bold">{steps[step].title}</GradientText>

            {/* Content */}
            <p className="whitespace-pre-line text-lg text-white/80">{steps[step].content}</p>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-center gap-4">
          <GlowButton variant="ghost" onClick={handleSkip} disabled={completeOnboarding.isPending}>
            Skip
          </GlowButton>
          <GlowButton variant="warm" onClick={handleNext} disabled={completeOnboarding.isPending}>
            {completeOnboarding.isPending
              ? 'Preparing your space...'
              : step < steps.length - 1
                ? 'Continue'
                : 'Enter Your Space'}
          </GlowButton>
        </div>
      </GlassCard>
    </div>
  );
}
