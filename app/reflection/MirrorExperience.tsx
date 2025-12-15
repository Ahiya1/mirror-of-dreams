'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import React, { useState, useCallback } from 'react';

// Internal utilities
import type { Dream } from '@/lib/reflection/types';

// Components (view, mobile, shared, ui)
import { CosmicParticles } from '@/components/reflection/CosmicParticles';
import { DemoUserCTA } from '@/components/reflection/DemoUserCTA';
import { GazingOverlay } from '@/components/reflection/mobile/GazingOverlay';
import { MobileReflectionFlow } from '@/components/reflection/mobile/MobileReflectionFlow';
import { ToneAmbientEffects } from '@/components/reflection/ToneAmbientEffects';
import { DreamSelectionView } from '@/components/reflection/views/DreamSelectionView';
import { ReflectionFormView } from '@/components/reflection/views/ReflectionFormView';
import { ReflectionOutputView } from '@/components/reflection/views/ReflectionOutputView';
import CosmicBackground from '@/components/shared/CosmicBackground';
import { GlassCard, CosmicLoader } from '@/components/ui/glass';
import { useToast } from '@/contexts/ToastContext';
import { useIsMobile, useReflectionForm, useReflectionViewMode } from '@/hooks';
import { useAuth } from '@/hooks/useAuth';
import { STORAGE_KEY } from '@/lib/reflection/constants';
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
  const utils = trpc.useUtils();

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
  React.useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
      } else if (user && !user.emailVerified && !user.isCreator && !user.isAdmin && !user.isDemo) {
        router.push('/auth/verify-required');
      }
    }
  }, [isAuthenticated, authLoading, user, router]);

  const createReflection = trpc.reflection.create.useMutation({
    onSuccess: (data) => {
      // Clear localStorage on successful submit
      localStorage.removeItem(STORAGE_KEY);
      // Store the reflection content
      setNewReflection({ id: data.reflectionId, content: data.reflection });

      // Invalidate caches so dream pages show the new reflection
      utils.reflections.list.invalidate();
      utils.reflections.checkUsage.invalidate();
      utils.dreams.list.invalidate();

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
    return <DemoUserCTA />;
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
      <ToneAmbientEffects selectedTone={selectedTone} />

      {/* Floating cosmic particles */}
      <CosmicParticles count={20} />

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
