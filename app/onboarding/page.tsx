/**
 * Onboarding Page - 4-step wizard for new users
 * Iteration: 27 (Iteration 2 of Plan 17)
 * Builder: Builder-1
 *
 * Updated: Added Clarify explanation step (step 3 of 4)
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GlassCard,
  GlowButton,
  ProgressOrbs,
  GradientText,
  AnimatedBackground,
  CosmicLoader,
} from '@/components/ui/glass';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';

interface OnboardingStep {
  title: string;
  content: string;
  visual: string; // Emoji
}

const steps: OnboardingStep[] = [
  {
    title: 'Welcome to Mirror of Dreams',
    content:
      'This is not a productivity tool. This is a consciousness companion.\n\nYour dreams hold the mirror to who you\'re becoming. We reflect your journey back to you—soft, sharp, and true.',
    visual: '🌙',
  },
  {
    title: 'How Reflections Work',
    content:
      'Every few days, answer 5 deep questions about your dream:\n\n1. What is your dream?\n2. What is your plan?\n3. Have you set a date?\n4. What\'s your relationship with this dream?\n5. What are you willing to give in return?\n\nAfter 4 reflections, your Mirror reveals the patterns you couldn\'t see.',
    visual: '✨',
  },
  {
    title: 'Clarify: Your Exploration Space',
    content:
      'Before committing to a dream, use Clarify to explore your thoughts and discover what truly resonates with you.\n\nHave conversations with our AI guide to clarify your aspirations. When you\'re ready, transform your insights into actionable dreams.',
    visual: '🔮',
  },
  {
    title: 'Your Free Tier',
    content:
      'Your free tier includes:\n✓ 2 dreams to explore\n✓ 4 reflections per month\n✓ 1 evolution report per month (after 4 reflections)\n✓ 1 visualization per month\n\nNeed more? Optimal tier gives you:\n✓ 7 dreams\n✓ 30 reflections per month\n✓ 6 evolution reports & visualizations\n\nStart free. Upgrade only if you fall in love.',
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark">
        <CosmicLoader size="lg" />
      </div>
    );
  }

  // Don't render onboarding if user needs to verify email
  if (!user.emailVerified && !user.isAdmin && !user.isCreator && !user.isDemo) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark p-4">
      <AnimatedBackground />

      <GlassCard className="max-w-2xl w-full p-8" elevated>
        {/* Progress Indicator */}
        <ProgressOrbs
          steps={steps.length}
          currentStep={step}
          className="mb-8 justify-center"
        />

        {/* Step Content with Animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            {/* Visual Emoji */}
            <div className="text-6xl mb-4">{steps[step].visual}</div>

            {/* Title */}
            <GradientText className="text-3xl font-bold mb-4">
              {steps[step].title}
            </GradientText>

            {/* Content */}
            <p className="text-lg text-white/80 whitespace-pre-line">
              {steps[step].content}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex gap-4 justify-center">
          <GlowButton
            variant="ghost"
            onClick={handleSkip}
            disabled={completeOnboarding.isPending}
          >
            Skip
          </GlowButton>
          <GlowButton
            variant="primary"
            onClick={handleNext}
            disabled={completeOnboarding.isPending}
          >
            {completeOnboarding.isPending
              ? 'Completing...'
              : step < steps.length - 1
              ? 'Next'
              : 'Continue to Dashboard'}
          </GlowButton>
        </div>
      </GlassCard>
    </div>
  );
}
