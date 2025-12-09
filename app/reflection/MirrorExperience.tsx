'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useEffect, useMemo, useCallback } from 'react';

// Internal utilities
import type { ToneId } from '@/lib/utils/constants';

import { MobileReflectionFlow } from '@/components/reflection/mobile/MobileReflectionFlow';
import { ProgressBar } from '@/components/reflection/ProgressBar';
import { ReflectionQuestionCard } from '@/components/reflection/ReflectionQuestionCard';
import { ToneSelectionCard } from '@/components/reflection/ToneSelectionCard';
import { AIResponseRenderer } from '@/components/reflections/AIResponseRenderer';
import CosmicBackground from '@/components/shared/CosmicBackground';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import { GlassCard, GlowButton, CosmicLoader, GlassInput } from '@/components/ui/glass';
import { useToast } from '@/contexts/ToastContext';
import { useIsMobile } from '@/hooks';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import { QUESTION_LIMITS, REFLECTION_MICRO_COPY } from '@/lib/utils/constants';
import { checkReflectionLimits } from '@/lib/utils/limits';

// Internal hooks

// Internal contexts

// Internal components

// Types and constants

// LocalStorage persistence
const STORAGE_KEY = 'MIRROR_REFLECTION_DRAFT';
const STORAGE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface FormData {
  dream: string;
  plan: string;
  relationship: string;
  offering: string;
}

interface Dream {
  id: string;
  title: string;
  description?: string;
  targetDate?: string | null;
  daysLeft?: number | null;
  category?: string;
}

type ViewMode = 'questionnaire' | 'output';

// Guiding text for each question - sets contemplative tone
const QUESTION_GUIDES = {
  dream: 'Take a moment to describe your dream in vivid detail...',
  plan: 'What concrete steps will you take on this journey?',
  relationship: 'How does this dream connect to who you are becoming?',
  offering: 'What are you willing to give, sacrifice, or commit?',
};

// Warm placeholder text - creates sacred, welcoming space
const WARM_PLACEHOLDERS = {
  dream: "Your thoughts are safe here... what's present for you right now?",
  plan: 'What step feels right to take next?',
  relationship: "How does this dream connect to who you're becoming?",
  offering: 'What gift is this dream offering you?',
};

/**
 * Mesmerizing single-page Mirror Experience
 * Enhanced with depth, atmosphere, and immersive transitions
 */
export default function MirrorExperience() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const toast = useToast();
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

  // Redirect to signin if not authenticated, or to verify-required if not verified
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
      } else if (user && !user.emailVerified && !user.isCreator && !user.isAdmin && !user.isDemo) {
        router.push('/auth/verify-required');
      }
    }
  }, [isAuthenticated, authLoading, user, router]);

  // Determine view mode from URL
  const reflectionId = searchParams.get('id');
  const dreamIdFromUrl = searchParams.get('dreamId'); // Pre-selected dream from URL
  const initialMode: ViewMode = reflectionId ? 'output' : 'questionnaire';

  const [viewMode, setViewMode] = useState<ViewMode>(initialMode);
  const [selectedDreamId, setSelectedDreamId] = useState<string>(dreamIdFromUrl || '');
  const [selectedDream, setSelectedDream] = useState<Dream | null>(null);
  const [selectedTone, setSelectedTone] = useState<ToneId>('fusion');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusText, setStatusText] = useState('Gazing into the mirror...');
  const [mirrorGlow, setMirrorGlow] = useState(false);
  // Store newly created reflection to show directly (no page navigation needed)
  const [newReflection, setNewReflection] = useState<{ id: string; content: string } | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeData, setUpgradeData] = useState<{
    reason: 'monthly_limit' | 'daily_limit';
    resetTime?: Date;
  }>({ reason: 'monthly_limit' });

  // Fetch user's dreams for selection
  const { data: dreams } = trpc.dreams.list.useQuery(
    {
      status: 'active',
      includeStats: true,
    },
    { enabled: viewMode === 'questionnaire' }
  );

  const [formData, setFormData] = useState<FormData>({
    dream: '',
    plan: '',
    relationship: '',
    offering: '',
  });

  // Fetch reflection if viewing output
  const { data: reflection, isLoading: reflectionLoading } = trpc.reflections.getById.useQuery(
    { id: reflectionId! },
    { enabled: !!reflectionId && viewMode === 'output' }
  );

  // Memoize gentle star positions to prevent repositioning on every render
  const gentleStarPositions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      left: `${10 + Math.random() * 80}%`,
      top: `${10 + Math.random() * 80}%`,
      animationDelay: `${-i * 0.8}s`,
    }));
  }, []); // Empty deps - positions computed once on mount

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
        // Fade out overlay and show reflection (no navigation)
        setIsSubmitting(false);
        setViewMode('output');
        // Update URL without navigation (for bookmarking/sharing)
        window.history.replaceState(null, '', `/reflection?id=${data.reflectionId}`);
      }, 1200);
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  // Sync viewMode with URL params (handles direct URL access and browser navigation)
  useEffect(() => {
    // Only sync if we don't have a newReflection (which means we just created one)
    if (newReflection) return;
    const targetMode: ViewMode = reflectionId ? 'output' : 'questionnaire';
    if (viewMode !== targetMode) {
      setViewMode(targetMode);
    }
  }, [reflectionId, newReflection]);

  // Update selected dream when dreams load or selection changes
  useEffect(() => {
    if (dreams && selectedDreamId) {
      const dream = dreams.find((d: any) => d.id === selectedDreamId);
      if (dream) {
        setSelectedDream(dream);
      }
    }
  }, [dreams, selectedDreamId]);

  // Load saved form data from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { data, timestamp, dreamId: savedDreamId, tone: savedTone } = JSON.parse(saved);
        // Check if still valid (5 minutes)
        if (Date.now() - timestamp < STORAGE_EXPIRY_MS) {
          setFormData(data);
          if (savedDreamId) setSelectedDreamId(savedDreamId);
          if (savedTone) setSelectedTone(savedTone);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }, []);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Only save if there's actual content
    const hasContent = Object.values(formData).some((v) => v.trim().length > 0);
    if (hasContent || selectedDreamId) {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            data: formData,
            dreamId: selectedDreamId,
            tone: selectedTone,
            timestamp: Date.now(),
          })
        );
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  }, [formData, selectedDreamId, selectedTone]);

  const handleFieldChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDreamSelect = (dreamId: string) => {
    const dream = dreams?.find((d: any) => d.id === dreamId);
    setSelectedDream(dream || null);
    setSelectedDreamId(dreamId);
  };

  const validateForm = (): boolean => {
    if (!selectedDreamId) {
      toast.warning('Please select a dream');
      return false;
    }

    if (!formData.dream.trim()) {
      toast.warning('Please elaborate on your dream');
      return false;
    }

    if (!formData.plan.trim()) {
      toast.warning('Please describe your plan');
      return false;
    }

    if (!formData.relationship.trim()) {
      toast.warning('Please share your relationship with this dream');
      return false;
    }

    if (!formData.offering.trim()) {
      toast.warning("Please describe what you're willing to give");
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
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

    // Update status text after 3 seconds
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
  };

  const questions = [
    {
      id: 'dream' as keyof FormData,
      number: 1,
      text: 'What is your dream?',
      guide: QUESTION_GUIDES.dream,
      placeholder: WARM_PLACEHOLDERS.dream,
      limit: QUESTION_LIMITS.dream,
    },
    {
      id: 'plan' as keyof FormData,
      number: 2,
      text: 'What is your plan to bring it to life?',
      guide: QUESTION_GUIDES.plan,
      placeholder: WARM_PLACEHOLDERS.plan,
      limit: QUESTION_LIMITS.plan,
    },
    {
      id: 'relationship' as keyof FormData,
      number: 3,
      text: 'What is your relationship with this dream?',
      guide: QUESTION_GUIDES.relationship,
      placeholder: WARM_PLACEHOLDERS.relationship,
      limit: QUESTION_LIMITS.relationship,
    },
    {
      id: 'offering' as keyof FormData,
      number: 4,
      text: 'What are you willing to offer in service of this dream?',
      guide: QUESTION_GUIDES.offering,
      placeholder: WARM_PLACEHOLDERS.offering,
      limit: QUESTION_LIMITS.sacrifice,
    },
  ];

  // Category emoji mapping for dreams
  const categoryEmoji: Record<string, string> = {
    health: '🏃',
    career: '💼',
    relationships: '❤️',
    financial: '💰',
    personal_growth: '🌱',
    creative: '🎨',
    spiritual: '🙏',
    entrepreneurial: '🚀',
    educational: '📚',
    other: '⭐',
  };

  // Loading state - show loader while checking auth
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

  // Auth/verification guard - return null while redirect happens
  if (
    !isAuthenticated ||
    (user && !user.emailVerified && !user.isCreator && !user.isAdmin && !user.isDemo)
  ) {
    return null;
  }

  // Demo user CTA - show signup prompt instead of questionnaire
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
              {/* Mirror icon */}
              <div className="mb-6">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-purple-500/40 bg-gradient-to-br from-purple-500/30 to-pink-500/30">
                  <span className="text-4xl">🪞</span>
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

              {/* What you get */}
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

              {/* CTA buttons */}
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

              {/* Already have account */}
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

  // Mobile users get the step-by-step wizard for questionnaire mode
  if (isMobile && viewMode === 'questionnaire') {
    return (
      <MobileReflectionFlow
        dreams={dreams || []}
        selectedDreamId={selectedDreamId}
        onDreamSelect={(dream) => {
          setSelectedDreamId(dream.id);
          setSelectedDream(dream);
        }}
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

  // Desktop users get the existing experience (unchanged)
  return (
    <div className="reflection-experience">
      {/* Darker cosmic background with vignette */}
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
            <div
              className="intense-swirl"
              style={{
                left: '15%',
                top: '20%',
              }}
            />
            <div
              className="intense-swirl"
              style={{
                right: '10%',
                bottom: '15%',
                animationDelay: '-9s',
              }}
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
            {/* Centered narrow content (800px) */}
            <GlassCard
              elevated
              className={cn(
                'reflection-card',
                mirrorGlow && 'border-mirror-gold/60 shadow-[0_0_120px_rgba(251,191,36,0.4)]'
              )}
            >
              <div className="mirror-surface">
                {!selectedDreamId ? (
                  /* Dream selection view */
                  <div className="question-view">
                    <h2 className="mb-8 bg-gradient-to-r from-mirror-amethyst via-mirror-amethyst-light to-cosmic-blue bg-clip-text text-center text-2xl font-light text-transparent md:text-3xl">
                      Which dream are you reflecting on?
                    </h2>

                    <div className="dream-selection-list">
                      {dreams && dreams.length > 0 ? (
                        dreams.map((dream: any) => {
                          const emoji = categoryEmoji[dream.category || 'other'] || '⭐';
                          const isSelected = selectedDreamId === dream.id;

                          return (
                            <div
                              key={dream.id}
                              onClick={() => handleDreamSelect(dream.id)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleDreamSelect(dream.id);
                                }
                              }}
                            >
                              <GlassCard
                                elevated={isSelected}
                                interactive
                                className={cn(
                                  'cursor-pointer transition-all',
                                  isSelected && 'border-mirror-amethyst/60'
                                )}
                              >
                                <div className="flex items-center gap-4">
                                  <span className="flex-shrink-0 text-4xl">{emoji}</span>
                                  <div className="min-w-0 flex-1">
                                    <h3 className="mb-1 text-lg font-medium text-white">
                                      {dream.title}
                                    </h3>
                                    {dream.daysLeft !== null && dream.daysLeft !== undefined && (
                                      <p className="text-sm text-mirror-amethyst-light">
                                        {dream.daysLeft < 0
                                          ? `${Math.abs(dream.daysLeft)}d overdue`
                                          : dream.daysLeft === 0
                                            ? 'Today!'
                                            : `${dream.daysLeft}d left`}
                                      </p>
                                    )}
                                  </div>
                                  {isSelected && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="flex-shrink-0 text-mirror-amethyst"
                                    >
                                      <Check className="h-6 w-6" />
                                    </motion.div>
                                  )}
                                </div>
                              </GlassCard>
                            </div>
                          );
                        })
                      ) : (
                        <GlassCard elevated className="text-center">
                          <p className="mb-6 text-white/70">No active dreams yet.</p>
                          <GlowButton
                            variant="primary"
                            size="md"
                            onClick={() => router.push('/dreams')}
                          >
                            Create Your First Dream
                          </GlowButton>
                        </GlassCard>
                      )}
                    </div>
                  </div>
                ) : (
                  /* One-Page Reflection Form */
                  <div className="one-page-form">
                    {/* Welcome Message */}
                    <div className="mb-6 text-center">
                      <p className="text-base font-light italic text-white/80 md:text-lg">
                        {REFLECTION_MICRO_COPY.welcome}
                      </p>
                    </div>

                    {/* Enhanced Dream Context Banner - Sacred Display */}
                    {selectedDream && (
                      <div className="dream-context-banner">
                        <h2>Reflecting on: {selectedDream.title}</h2>
                        <div className="dream-meta">
                          {selectedDream.category && (
                            <span className="category-badge">{selectedDream.category}</span>
                          )}
                          {selectedDream.daysLeft !== null &&
                            selectedDream.daysLeft !== undefined && (
                              <span className="days-remaining">
                                {selectedDream.daysLeft < 0
                                  ? `${Math.abs(selectedDream.daysLeft)} days overdue`
                                  : selectedDream.daysLeft === 0
                                    ? 'Today!'
                                    : `${selectedDream.daysLeft} days remaining`}
                              </span>
                            )}
                        </div>
                      </div>
                    )}

                    {/* Progress Indicator */}
                    <div className="mb-8">
                      <ProgressBar currentStep={1} totalSteps={4} />
                    </div>

                    {/* All 4 Questions with enhanced sacred styling */}
                    <div className="questions-container">
                      {questions.map((question) => (
                        <ReflectionQuestionCard
                          key={question.id}
                          questionNumber={question.number}
                          totalQuestions={4}
                          questionText={question.text}
                          guidingText={question.guide}
                          placeholder={question.placeholder}
                          value={formData[question.id]}
                          onChange={(value) => handleFieldChange(question.id, value)}
                          maxLength={question.limit}
                        />
                      ))}
                    </div>

                    {/* Enhanced Tone Selection */}
                    <div className="mb-8">
                      <ToneSelectionCard selectedTone={selectedTone} onSelect={setSelectedTone} />
                    </div>

                    {/* Ready message before submit */}
                    <div className="mb-6 text-center">
                      <p className="text-sm italic text-white/70">
                        {REFLECTION_MICRO_COPY.readyToSubmit}
                      </p>
                    </div>

                    {/* "Gaze into the Mirror" Submit Button with breathing animation */}
                    <div className="flex justify-center">
                      <GlowButton
                        variant="cosmic"
                        size="lg"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="submit-button-breathe min-w-[280px] text-lg font-medium"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center gap-3">
                            <CosmicLoader size="sm" />
                            Gazing...
                          </span>
                        ) : (
                          <>✨ Gaze into the Mirror ✨</>
                        )}
                      </GlowButton>
                    </div>
                  </div>
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
            {/* Show loading only when fetching from URL (not when we have newReflection) */}
            {!newReflection && reflectionLoading ? (
              <div className="flex flex-col items-center justify-center gap-6 py-20">
                <CosmicLoader size="lg" />
                <p className="text-lg text-white/70">Loading reflection...</p>
              </div>
            ) : newReflection || reflection ? (
              <GlassCard elevated className="reflection-card">
                <div className="mirror-surface">
                  <div className="reflection-content">
                    <h1 className="text-h1 mb-8 bg-gradient-to-r from-[#fbbf24] to-[#9333ea] bg-clip-text text-center font-semibold text-transparent">
                      Your Reflection
                    </h1>
                    <div className="reflection-text">
                      {/* Use newReflection if just created, otherwise fetched reflection */}
                      <AIResponseRenderer
                        content={newReflection?.content || reflection?.aiResponse || ''}
                      />
                    </div>
                    <div className="mt-8 flex justify-center">
                      <GlowButton
                        variant="primary"
                        size="lg"
                        onClick={() => {
                          setViewMode('questionnaire');
                          setSelectedDreamId('');
                          setSelectedDream(null);
                          setNewReflection(null);
                          setFormData({
                            dream: '',
                            plan: '',
                            relationship: '',
                            offering: '',
                          });
                          router.push('/reflection');
                        }}
                      >
                        Create New Reflection
                      </GlowButton>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Magical Mirror Gazing Overlay */}
      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.8 }}
            className="gazing-overlay"
          >
            {/* Deep space background */}
            <div className="gazing-cosmos">
              {/* Distant stars */}
              {[...Array(50)].map((_, i) => (
                <motion.div
                  key={`star-${i}`}
                  className="gazing-star"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    width: `${1 + Math.random() * 2}px`,
                    height: `${1 + Math.random() * 2}px`,
                  }}
                  animate={
                    !prefersReducedMotion
                      ? {
                          opacity: [0.2, 0.8, 0.2],
                          scale: [0.8, 1.2, 0.8],
                        }
                      : undefined
                  }
                  transition={{
                    duration: 2 + Math.random() * 3,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}

              {/* Floating light particles */}
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={`particle-${i}`}
                  className="gazing-particle"
                  style={{
                    left: `${20 + Math.random() * 60}%`,
                    top: `${20 + Math.random() * 60}%`,
                  }}
                  animate={
                    !prefersReducedMotion
                      ? {
                          x: [0, (Math.random() - 0.5) * 100, 0],
                          y: [0, -50 - Math.random() * 50, 0],
                          opacity: [0, 0.6, 0],
                          scale: [0, 1, 0],
                        }
                      : undefined
                  }
                  transition={{
                    duration: 4 + Math.random() * 3,
                    repeat: Infinity,
                    delay: Math.random() * 4,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>

            {/* Central mirror portal */}
            <div className="gazing-center">
              {/* Outer glow rings */}
              <motion.div
                className="mirror-ring mirror-ring-outer"
                animate={
                  !prefersReducedMotion
                    ? {
                        rotate: 360,
                        scale: [1, 1.05, 1],
                      }
                    : undefined
                }
                transition={{
                  rotate: { duration: 30, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
                }}
              />
              <motion.div
                className="mirror-ring mirror-ring-middle"
                animate={
                  !prefersReducedMotion
                    ? {
                        rotate: -360,
                        scale: [1.05, 1, 1.05],
                      }
                    : undefined
                }
                transition={{
                  rotate: { duration: 25, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
                }}
              />

              {/* The mirror itself */}
              <motion.div
                className="mirror-portal"
                animate={
                  !prefersReducedMotion
                    ? {
                        scale: [1, 1.02, 1],
                      }
                    : undefined
                }
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                {/* Mirror surface shimmer */}
                <div className="mirror-surface-effect" />

                {/* Inner reflection */}
                <motion.div
                  className="mirror-reflection-inner"
                  animate={
                    !prefersReducedMotion
                      ? {
                          opacity: [0.3, 0.6, 0.3],
                          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                        }
                      : undefined
                  }
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />

                {/* Central glow */}
                <motion.div
                  className="mirror-glow-center"
                  animate={
                    !prefersReducedMotion
                      ? {
                          opacity: [0.4, 0.8, 0.4],
                          scale: [0.8, 1.1, 0.8],
                        }
                      : undefined
                  }
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </motion.div>
            </div>

            {/* Status text */}
            <motion.div
              className="gazing-text"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <motion.p
                className="gazing-status"
                animate={
                  !prefersReducedMotion
                    ? {
                        opacity: [0.7, 1, 0.7],
                      }
                    : undefined
                }
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                {statusText}
              </motion.p>
              <p className="gazing-subtitle">Your reflection is taking form...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .reflection-experience {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow-x: hidden; /* Prevent horizontal wobble from animated elements */
          overflow-y: auto;
          /* Darker background for depth */
          background: radial-gradient(
            ellipse at center,
            rgba(15, 23, 42, 0.95) 0%,
            rgba(2, 6, 23, 1) 100%
          );
        }

        /* Vignette effect for focus */
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
          /* Centered narrow content (800px) */
          max-width: 800px;
          padding: var(--space-xl);
        }

        .reflection-card {
          padding: 3rem;
          border-radius: 30px;
          transition:
            border-color 0.8s ease,
            box-shadow 0.8s ease;
        }

        .mirror-surface {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 20px;
          padding: var(--space-2xl);
          min-height: 500px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .question-view,
        .one-page-form,
        .reflection-output {
          width: 100%;
          animation: fade-in 0.6s ease-out;
        }

        /* Mobile-optimized scrollable form */
        .one-page-form {
          max-height: calc(100vh - 250px);
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding-right: 8px;
        }

        .one-page-form::-webkit-scrollbar {
          width: 8px;
        }

        .one-page-form::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }

        .one-page-form::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.3);
          border-radius: 4px;
        }

        .one-page-form::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.5);
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .reflection-content {
          text-align: left;
          max-width: 700px;
        }

        .reflection-text {
          font-size: var(--text-lg);
          line-height: 1.8;
          color: rgba(255, 255, 255, 0.95);
          margin-bottom: var(--space-2xl);
          white-space: pre-wrap;
          text-align: justify;
          hyphens: auto;
        }

        .reflection-text strong {
          font-weight: 600;
          background: linear-gradient(135deg, #fbbf24, #9333ea);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .reflection-text em {
          font-style: italic;
          color: rgba(255, 255, 255, 0.8);
        }

        /* Dream selection styles */
        .dream-selection-list {
          max-width: 600px;
          margin: var(--space-xl) auto;
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          max-height: 400px;
          overflow-y: auto;
          padding: var(--space-2);
        }

        @media (max-width: 768px) {
          .reflection-card {
            padding: 2rem;
          }

          .mirror-surface {
            padding: var(--space-lg);
          }
        }

        /* Respect reduced motion preference */
        @media (prefers-reduced-motion: reduce) {
          .fusion-breath,
          .gentle-star,
          .intense-swirl,
          .particle {
            animation: none;
            opacity: 0.3;
          }
        }

        /* ============================================
           MAGICAL GAZING OVERLAY STYLES
           ============================================ */
        .gazing-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: radial-gradient(
            ellipse at center,
            rgba(15, 10, 30, 0.98) 0%,
            rgba(5, 2, 15, 1) 100%
          );
          overflow: hidden;
        }

        .gazing-cosmos {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .gazing-star {
          position: absolute;
          background: white;
          border-radius: 50%;
          box-shadow: 0 0 6px rgba(255, 255, 255, 0.8);
        }

        .gazing-particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: radial-gradient(
            circle,
            rgba(168, 85, 247, 0.9) 0%,
            rgba(236, 72, 153, 0.6) 50%,
            transparent 100%
          );
          border-radius: 50%;
          filter: blur(1px);
        }

        .gazing-center {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 280px;
          height: 280px;
        }

        .mirror-ring {
          position: absolute;
          border-radius: 50%;
          border: 1px solid transparent;
        }

        .mirror-ring-outer {
          width: 280px;
          height: 280px;
          background: conic-gradient(
            from 0deg,
            transparent 0%,
            rgba(168, 85, 247, 0.3) 25%,
            transparent 50%,
            rgba(251, 191, 36, 0.3) 75%,
            transparent 100%
          );
          filter: blur(8px);
        }

        .mirror-ring-middle {
          width: 220px;
          height: 220px;
          background: conic-gradient(
            from 180deg,
            transparent 0%,
            rgba(236, 72, 153, 0.4) 25%,
            transparent 50%,
            rgba(168, 85, 247, 0.4) 75%,
            transparent 100%
          );
          filter: blur(4px);
        }

        .mirror-portal {
          position: relative;
          width: 160px;
          height: 160px;
          border-radius: 50%;
          background: radial-gradient(
            circle at 30% 30%,
            rgba(40, 30, 60, 0.9) 0%,
            rgba(20, 15, 35, 0.95) 50%,
            rgba(10, 5, 20, 1) 100%
          );
          box-shadow:
            0 0 60px rgba(168, 85, 247, 0.4),
            0 0 100px rgba(168, 85, 247, 0.2),
            inset 0 0 40px rgba(0, 0, 0, 0.5),
            inset 0 0 80px rgba(168, 85, 247, 0.1);
          border: 1px solid rgba(168, 85, 247, 0.3);
          overflow: hidden;
        }

        .mirror-surface-effect {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.1) 0%,
            transparent 50%,
            rgba(255, 255, 255, 0.05) 100%
          );
        }

        .mirror-reflection-inner {
          position: absolute;
          inset: 20%;
          border-radius: 50%;
          background: linear-gradient(
            135deg,
            rgba(168, 85, 247, 0.2) 0%,
            rgba(236, 72, 153, 0.1) 50%,
            rgba(251, 191, 36, 0.15) 100%
          );
          background-size: 200% 200%;
          filter: blur(10px);
        }

        .mirror-glow-center {
          position: absolute;
          inset: 30%;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.15) 0%,
            rgba(168, 85, 247, 0.1) 50%,
            transparent 100%
          );
        }

        .gazing-text {
          position: relative;
          text-align: center;
          margin-top: 3rem;
          z-index: 10;
        }

        .gazing-status {
          font-size: 1.5rem;
          font-weight: 300;
          color: rgba(255, 255, 255, 0.95);
          letter-spacing: 0.05em;
          margin-bottom: 0.75rem;
          text-shadow: 0 0 30px rgba(168, 85, 247, 0.5);
        }

        .gazing-subtitle {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.5);
          font-weight: 300;
          letter-spacing: 0.1em;
        }

        @media (max-width: 768px) {
          .gazing-center {
            width: 220px;
            height: 220px;
          }

          .mirror-ring-outer {
            width: 220px;
            height: 220px;
          }

          .mirror-ring-middle {
            width: 170px;
            height: 170px;
          }

          .mirror-portal {
            width: 120px;
            height: 120px;
          }

          .gazing-status {
            font-size: 1.25rem;
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
