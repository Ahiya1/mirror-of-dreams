'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useMemo, useCallback } from 'react';

// Internal utilities
import type { Dream } from '@/lib/reflection/types';
import type { ToneId } from '@/lib/utils/constants';

// Components (view, mobile, shared, ui)
import { GazingOverlay } from '@/components/reflection/mobile/GazingOverlay';
import { MobileReflectionFlow } from '@/components/reflection/mobile/MobileReflectionFlow';
import { DreamSelectionView } from '@/components/reflection/views/DreamSelectionView';
import { ReflectionFormView } from '@/components/reflection/views/ReflectionFormView';
import { ReflectionOutputView } from '@/components/reflection/views/ReflectionOutputView';
import CosmicBackground from '@/components/shared/CosmicBackground';
import { GlassCard, GlowButton, CosmicLoader } from '@/components/ui/glass';
import { useToast } from '@/contexts/ToastContext';
import { useIsMobile, useReflectionForm, useReflectionViewMode } from '@/hooks';
import { useAuth } from '@/hooks/useAuth';
import { STORAGE_KEY, EMPTY_FORM_DATA } from '@/lib/reflection/constants';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import { checkReflectionLimits } from '@/lib/utils/limits';

// Lazy load UpgradeModal - reduces initial bundle size
const UpgradeModal = dynamic(
  () => import('@/components/subscription/UpgradeModal').then((mod) => mod.UpgradeModal),
  { ssr: false }
);

/**
 * Mesmerizing single-page Mirror Experience
 * Enhanced with depth, atmosphere, and immersive transitions
 */
export default function MirrorExperience() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const toast = useToast();
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

  // View mode and URL sync
  const {
    viewMode,
    setViewMode,
    reflectionId,
    dreamIdFromUrl,
    newReflection,
    setNewReflection,
    resetToQuestionnaire,
  } = useReflectionViewMode();

  // Fetch user's dreams for selection
  const { data: dreams } = trpc.dreams.list.useQuery(
    { status: 'active', includeStats: true },
    { enabled: viewMode === 'questionnaire' }
  );

  // Form state and persistence
  const {
    formData,
    handleFieldChange,
    selectedDreamId,
    selectedDream,
    handleDreamSelect,
    selectedTone,
    setSelectedTone,
    validateForm,
    clearForm,
  } = useReflectionForm({
    dreams: dreams as Dream[] | undefined,
    initialDreamId: dreamIdFromUrl || '',
  });

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusText, setStatusText] = useState('Gazing into the mirror...');
  const [mirrorGlow, setMirrorGlow] = useState(false);

  // Upgrade modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeData, setUpgradeData] = useState<{
    reason: 'monthly_limit' | 'daily_limit';
    resetTime?: Date;
  }>({ reason: 'monthly_limit' });

  // Fetch reflection if viewing output
  const { data: reflection, isLoading: reflectionLoading } = trpc.reflections.getById.useQuery(
    { id: reflectionId! },
    { enabled: !!reflectionId && viewMode === 'output' }
  );

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
      } else if (user && !user.emailVerified && !user.isCreator && !user.isAdmin && !user.isDemo) {
        router.push('/auth/verify-required');
      }
    }
  }, [isAuthenticated, authLoading, user, router]);

  // Memoize gentle star positions to prevent repositioning on every render
  const gentleStarPositions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      left: `${10 + Math.random() * 80}%`,
      top: `${10 + Math.random() * 80}%`,
      animationDelay: `${-i * 0.8}s`,
    }));
  }, []);

  // Memoize cosmic particle positions
  const cosmicParticlePositions = useMemo(() => {
    return Array.from({ length: 20 }, () => ({
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 20}s`,
      animationDuration: `${15 + Math.random() * 10}s`,
    }));
  }, []);

  const createReflection = trpc.reflection.create.useMutation({
    onSuccess: (data) => {
      // Clear localStorage on successful submit
      localStorage.removeItem(STORAGE_KEY);
      // Store the reflection content
      setNewReflection({ id: data.reflectionId, content: data.reflection });
      // Brief "complete" message then fade to output
      setStatusText('Reflection complete!');
      setMirrorGlow(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setViewMode('output');
        window.history.replaceState(null, '', `/reflection?id=${data.reflectionId}`);
      }, 1200);
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  const handleSubmit = useCallback(() => {
    if (!validateForm()) return;

    // Check limits before submission
    if (user) {
      const limitCheck = checkReflectionLimits(user);
      if (!limitCheck.canCreate) {
        setUpgradeData({
          reason: limitCheck.reason!,
          resetTime: limitCheck.resetTime,
        });
        setShowUpgradeModal(true);
        return;
      }
    }

    setIsSubmitting(true);
    setStatusText('Gazing into the mirror...');

    setTimeout(() => {
      setStatusText('Crafting your insight...');
    }, 3000);

    createReflection.mutate({
      dreamId: selectedDreamId,
      dream: formData.dream,
      plan: formData.plan,
      relationship: formData.relationship,
      offering: formData.offering,
      tone: selectedTone,
    });
  }, [validateForm, user, selectedDreamId, formData, selectedTone, createReflection]);

  const handleCreateNew = useCallback(() => {
    clearForm();
    resetToQuestionnaire();
    router.push('/reflection');
  }, [clearForm, resetToQuestionnaire, router]);

  // Loading state
  if (authLoading) {
    return (
      <div className="reflection-experience">
        <CosmicBackground />
        <div className="flex min-h-screen items-center justify-center">
          <CosmicLoader size="lg" />
        </div>
      </div>
    );
  }

  // Auth guard
  if (
    !isAuthenticated ||
    (user && !user.emailVerified && !user.isCreator && !user.isAdmin && !user.isDemo)
  ) {
    return null;
  }

  // Demo user CTA
  if (user?.isDemo && viewMode === 'questionnaire') {
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
              <div className="mb-6">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-purple-500/40 bg-gradient-to-br from-purple-500/30 to-pink-500/30">
                  <span className="text-4xl">{'\uD83E\uDE9E'}</span>
                </div>
              </div>
              <h1 className="mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-3xl font-bold text-transparent">
                Ready to Start Your Journey?
              </h1>
              <p className="mb-6 text-lg leading-relaxed text-white/70">
                You've explored what Mirror of Dreams can offer. Now it's time to create your own
                reflections and discover insights unique to your path.
              </p>
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

  // Mobile flow
  if (isMobile && viewMode === 'questionnaire') {
    return (
      <MobileReflectionFlow
        dreams={(dreams as Dream[]) || []}
        selectedDreamId={selectedDreamId}
        onDreamSelect={(dream) => handleDreamSelect(dream.id)}
        formData={formData}
        onFieldChange={handleFieldChange}
        selectedTone={selectedTone}
        onToneSelect={setSelectedTone}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        onClose={() => router.push('/dashboard')}
      />
    );
  }

  // Desktop experience
  return (
    <div className="reflection-experience">
      <CosmicBackground />
      <div className="reflection-vignette" />

      {/* Tone-based ambient elements */}
      <div className="tone-elements">
        {selectedTone === 'fusion' && (
          <>
            <div
              className="fusion-breath"
              style={{
                left: '20%',
                top: '30%',
                width: 'clamp(220px, 45vw, 300px)',
                height: 'clamp(220px, 45vw, 300px)',
              }}
            />
            <div
              className="fusion-breath"
              style={{
                right: '15%',
                bottom: '25%',
                width: 'clamp(180px, 35vw, 240px)',
                height: 'clamp(180px, 35vw, 240px)',
                animationDelay: '-12s',
              }}
            />
          </>
        )}
        {selectedTone === 'gentle' && (
          <>
            {gentleStarPositions.map((pos, i) => (
              <div key={i} className="gentle-star" style={pos} />
            ))}
          </>
        )}
        {selectedTone === 'intense' && (
          <>
            <div className="intense-swirl" style={{ left: '15%', top: '20%' }} />
            <div
              className="intense-swirl"
              style={{ right: '10%', bottom: '15%', animationDelay: '-9s' }}
            />
          </>
        )}
      </div>

      {/* Floating cosmic particles */}
      <div className="cosmic-particles">
        {cosmicParticlePositions.map((pos, i) => (
          <div key={i} className="particle" style={pos} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'questionnaire' && (
          <motion.div
            key="questionnaire"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
            className="questionnaire-container"
          >
            <GlassCard
              elevated
              className={cn(
                'reflection-card',
                mirrorGlow && 'border-mirror-gold/60 shadow-[0_0_120px_rgba(251,191,36,0.4)]'
              )}
            >
              <div className="mirror-surface">
                {!selectedDreamId ? (
                  <DreamSelectionView
                    dreams={(dreams as Dream[]) || []}
                    selectedDreamId={selectedDreamId}
                    onDreamSelect={handleDreamSelect}
                  />
                ) : (
                  <ReflectionFormView
                    selectedDream={selectedDream}
                    formData={formData}
                    onFieldChange={handleFieldChange}
                    selectedTone={selectedTone}
                    onToneSelect={setSelectedTone}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                  />
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {viewMode === 'output' && (
          <motion.div
            key="output"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.6 }}
            className="output-container"
          >
            <ReflectionOutputView
              content={newReflection?.content || reflection?.aiResponse || ''}
              isLoading={!newReflection && reflectionLoading}
              onCreateNew={handleCreateNew}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gazing Overlay (elaborate variant for desktop) */}
      <GazingOverlay isVisible={isSubmitting} variant="elaborate" statusText={statusText} />

      <style jsx>{`
        .reflection-experience {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow-x: hidden;
          overflow-y: auto;
          background: radial-gradient(
            ellipse at center,
            rgba(15, 23, 42, 0.95) 0%,
            rgba(2, 6, 23, 1) 100%
          );
        }

        .reflection-vignette {
          position: fixed;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.4) 100%);
          z-index: 1;
        }

        .tone-elements {
          position: fixed;
          inset: 0;
          z-index: 1;
          pointer-events: none;
        }

        .fusion-breath {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(251, 191, 36, 0.3) 0%,
            rgba(245, 158, 11, 0.15) 30%,
            rgba(217, 119, 6, 0.08) 60%,
            transparent 80%
          );
          filter: blur(35px);
          animation: fusionBreathe 25s ease-in-out infinite;
        }

        @keyframes fusionBreathe {
          0%,
          100% {
            opacity: 0;
            transform: scale(0.4) translate(0, 0);
          }
          25% {
            opacity: 0.6;
            transform: scale(1.1) translate(30px, -40px);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.4) translate(-15px, 25px);
          }
          75% {
            opacity: 0.5;
            transform: scale(0.9) translate(40px, 15px);
          }
        }

        .gentle-star {
          position: absolute;
          width: 3px;
          height: 3px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 50%;
          box-shadow:
            0 0 8px rgba(255, 255, 255, 0.7),
            0 0 15px rgba(255, 255, 255, 0.4);
          animation: gentleTwinkle 10s ease-in-out infinite;
        }

        @keyframes gentleTwinkle {
          0%,
          100% {
            opacity: 0;
            transform: scale(0.4);
          }
          50% {
            opacity: 1;
            transform: scale(1.3);
          }
        }

        .intense-swirl {
          position: absolute;
          width: clamp(180px, 35vw, 240px);
          height: clamp(180px, 35vw, 240px);
          background: radial-gradient(
            circle at 30% 30%,
            rgba(147, 51, 234, 0.35) 0%,
            rgba(168, 85, 247, 0.18) 30%,
            rgba(139, 92, 246, 0.1) 60%,
            transparent 80%
          );
          filter: blur(30px);
          border-radius: 50%;
          animation: intenseSwirl 18s ease-in-out infinite;
        }

        @keyframes intenseSwirl {
          0%,
          100% {
            opacity: 0;
            transform: rotate(0deg) scale(0.2);
          }
          25% {
            opacity: 0.7;
            transform: rotate(180deg) scale(1.1);
          }
          50% {
            opacity: 0.9;
            transform: rotate(360deg) scale(1.4);
          }
          75% {
            opacity: 0.6;
            transform: rotate(540deg) scale(0.8);
          }
        }

        .cosmic-particles {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 2;
        }

        .particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 70%);
          border-radius: 50%;
          animation: float-up linear infinite;
        }

        @keyframes float-up {
          0% {
            transform: translateY(100vh) scale(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) scale(1);
            opacity: 0;
          }
        }

        .questionnaire-container,
        .output-container {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 800px;
          padding: var(--space-xl);
        }

        @media (prefers-reduced-motion: reduce) {
          .fusion-breath,
          .gentle-star,
          .intense-swirl,
          .particle {
            animation: none;
            opacity: 0.3;
          }
        }
      `}</style>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason={upgradeData.reason}
        resetTime={upgradeData.resetTime}
        currentTier={user?.tier}
      />
    </div>
  );
}
