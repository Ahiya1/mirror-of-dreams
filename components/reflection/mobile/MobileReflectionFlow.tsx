'use client';

import { motion, AnimatePresence, PanInfo, useReducedMotion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Check, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { ToneSelectionCard } from '@/components/reflection/ToneSelectionCard';
import { GlowButton, CosmicLoader, GlassInput } from '@/components/ui/glass';
import { ProgressOrbs } from '@/components/ui/glass/ProgressOrbs';
import { useHideBottomNav } from '@/contexts/NavigationContext';
import { useKeyboardHeight } from '@/hooks';
import {
  stepTransitionVariants,
  gazingOverlayVariants,
  statusTextVariants,
} from '@/lib/animations/variants';
import { cn } from '@/lib/utils';
import { QUESTION_LIMITS, type ToneId } from '@/lib/utils/constants';
import { haptic } from '@/lib/utils/haptics';

/**
 * Form data interface matching MirrorExperience
 */
export interface FormData {
  dream: string;
  plan: string;
  relationship: string;
  offering: string;
}

/**
 * Dream interface
 */
export interface Dream {
  id: string;
  title: string;
  description?: string;
  targetDate?: string | null;
  daysLeft?: number | null;
  category?: string;
}

/**
 * Props for MobileReflectionFlow
 */
export interface MobileReflectionFlowProps {
  dreams: Dream[];
  selectedDreamId: string;
  onDreamSelect: (dream: Dream) => void;
  formData: FormData;
  onFieldChange: (field: keyof FormData, value: string) => void;
  selectedTone: ToneId;
  onToneSelect: (tone: ToneId) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  onClose: () => void;
}

// Wizard steps
const WIZARD_STEPS = ['dreamSelect', 'q1', 'q2', 'q3', 'q4', 'tone'] as const;
type WizardStep = (typeof WIZARD_STEPS)[number];

// Question content
const QUESTIONS = [
  {
    id: 'dream' as keyof FormData,
    number: 1,
    text: 'What is your dream?',
    guide: 'Take a moment to describe your dream in vivid detail...',
    placeholder: "Your thoughts are safe here... what's present for you right now?",
    limit: QUESTION_LIMITS.dream,
  },
  {
    id: 'plan' as keyof FormData,
    number: 2,
    text: 'What is your plan to bring it to life?',
    guide: 'What concrete steps will you take on this journey?',
    placeholder: 'What step feels right to take next?',
    limit: QUESTION_LIMITS.plan,
  },
  {
    id: 'relationship' as keyof FormData,
    number: 3,
    text: 'What is your relationship with this dream?',
    guide: 'How does this dream connect to who you are becoming?',
    placeholder: "How does this dream connect to who you're becoming?",
    limit: QUESTION_LIMITS.relationship,
  },
  {
    id: 'offering' as keyof FormData,
    number: 4,
    text: 'What are you willing to offer in service of this dream?',
    guide: 'What are you willing to give, sacrifice, or commit?',
    placeholder: 'What gift is this dream offering you?',
    limit: QUESTION_LIMITS.sacrifice,
  },
];

// Gazing status messages
const STATUS_MESSAGES = [
  'Gazing into the mirror...',
  'Reflecting on your journey...',
  'Crafting your insight...',
  'Weaving wisdom...',
];

const STATUS_INTERVAL = 3000;

// LocalStorage persistence
const STORAGE_KEY = 'MIRROR_REFLECTION_DRAFT';
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// Category emoji mapping (using Unicode escape sequences for reliability)
const CATEGORY_EMOJI: Record<string, string> = {
  career: '\uD83D\uDCBC', // Briefcase
  health: '\uD83C\uDFC3', // Runner
  relationships: '\u2764\uFE0F', // Heart
  creativity: '\uD83C\uDFA8', // Art palette
  finance: '\uD83D\uDCB0', // Money bag
  personal: '\u2728', // Sparkles
  spiritual: '\uD83D\uDE4F', // Praying hands
  education: '\uD83D\uDCDA', // Books
  entrepreneurial: '\uD83D\uDE80', // Rocket
  financial: '\uD83D\uDCB0', // Money bag
  personal_growth: '\uD83C\uDF31', // Seedling
  creative: '\uD83C\uDFA8', // Art palette
  other: '\u2B50', // Star
  default: '\uD83C\uDF1F', // Glowing star
};

/**
 * MobileReflectionFlow - Full-screen step-by-step reflection wizard for mobile
 *
 * This component provides a native mobile experience for the reflection flow:
 * - One question per screen with swipe navigation
 * - Bottom sheet for dream selection
 * - Keyboard-aware positioning
 * - Exit confirmation for unsaved data
 * - LocalStorage persistence
 */
export function MobileReflectionFlow({
  dreams,
  selectedDreamId,
  onDreamSelect,
  formData,
  onFieldChange,
  selectedTone,
  onToneSelect,
  onSubmit,
  isSubmitting,
  onClose,
}: MobileReflectionFlowProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const keyboardHeight = useKeyboardHeight();

  // Hide bottom navigation while this component is mounted
  useHideBottomNav();

  // Step state
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 back, 1 forward
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);

  // UI state
  const [showDreamSheet, setShowDreamSheet] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);

  // Get current step
  const currentStep = WIZARD_STEPS[currentStepIndex];
  const selectedDream = dreams.find((d) => d.id === selectedDreamId);

  // Dirty form detection
  const isDirty = useMemo(() => {
    return Object.values(formData).some((value) => value.trim().length > 0);
  }, [formData]);

  // Get question text - using simpler generic questions
  const getQuestionText = (questionIndex: number): string => {
    return QUESTIONS[questionIndex].text;
  };

  // Navigation helpers
  const goToNextStep = useCallback(() => {
    if (currentStepIndex < WIZARD_STEPS.length - 1) {
      setDirection(1);
      setCurrentStepIndex((prev) => prev + 1);
      haptic('light');
    }
  }, [currentStepIndex]);

  const goToPreviousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setDirection(-1);
      setCurrentStepIndex((prev) => prev - 1);
      haptic('light');
    }
  }, [currentStepIndex]);

  // Swipe handler
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (isTextareaFocused) return;

      const SWIPE_THRESHOLD = 50;
      const VELOCITY_THRESHOLD = 300;

      const shouldAdvance =
        info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -VELOCITY_THRESHOLD;

      const shouldGoBack = info.offset.x > SWIPE_THRESHOLD || info.velocity.x > VELOCITY_THRESHOLD;

      if (shouldAdvance && canGoNext()) {
        goToNextStep();
      } else if (shouldGoBack) {
        goToPreviousStep();
      }
    },
    [isTextareaFocused, goToNextStep, goToPreviousStep]
  );

  // Can advance check
  const canGoNext = useCallback((): boolean => {
    if (currentStep === 'dreamSelect') {
      return !!selectedDreamId;
    }
    if (currentStep === 'tone') {
      return true; // Tone has default selection
    }
    // Question steps require content
    const questionIndex = currentStepIndex - 1;
    if (questionIndex >= 0 && questionIndex < QUESTIONS.length) {
      const field = QUESTIONS[questionIndex].id;
      return formData[field].trim().length > 0;
    }
    return true;
  }, [currentStep, selectedDreamId, currentStepIndex, formData]);

  // Exit handling
  const handleCloseAttempt = useCallback(() => {
    if (isDirty) {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  // Browser back/refresh prevention
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Status text cycling during submission
  useEffect(() => {
    if (!isSubmitting) {
      setStatusIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, STATUS_INTERVAL);

    return () => clearInterval(interval);
  }, [isSubmitting]);

  // Handle final submit
  const handleFinalSubmit = useCallback(() => {
    if (currentStep === 'tone') {
      // Clear localStorage on submit
      localStorage.removeItem(STORAGE_KEY);
      onSubmit();
    }
  }, [currentStep, onSubmit]);

  // Handle dream selection
  const handleDreamSelection = useCallback(
    (dream: Dream) => {
      haptic('light');
      onDreamSelect(dream);
      setShowDreamSheet(false);
      // Auto-advance to first question
      setTimeout(() => {
        goToNextStep();
      }, 300);
    },
    [onDreamSelect, goToNextStep]
  );

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'dreamSelect':
        return (
          <div className="pb-safe flex h-full flex-col px-6 pt-4">
            <h2 className="mb-8 text-center text-2xl font-light text-white">
              Which dream are you reflecting on?
            </h2>

            <div className="flex-1 space-y-3 overflow-y-auto">
              {dreams.length > 0 ? (
                <>
                  {dreams.map((dream) => {
                    const isSelected = dream.id === selectedDreamId;
                    const emoji =
                      CATEGORY_EMOJI[dream.category || 'default'] || CATEGORY_EMOJI.default;

                    return (
                      <motion.button
                        key={dream.id}
                        onClick={() => handleDreamSelection(dream)}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          'flex w-full items-center gap-4 p-4',
                          'min-h-[60px]',
                          'rounded-2xl',
                          'transition-colors duration-200',
                          isSelected
                            ? 'border border-purple-500/50 bg-purple-500/20'
                            : 'border border-white/10 bg-white/5 active:bg-white/10'
                        )}
                      >
                        <span
                          className="text-2xl"
                          role="img"
                          aria-label={dream.category || 'dream'}
                        >
                          {emoji}
                        </span>
                        <div className="flex-1 text-left">
                          <h3 className="truncate font-medium text-white">{dream.title}</h3>
                          {dream.description && (
                            <p className="mt-0.5 truncate text-sm text-white/60">
                              {dream.description}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </>
              ) : (
                <div className="py-8 text-center">
                  <p className="mb-6 text-white/70">No active dreams yet.</p>
                  <GlowButton variant="primary" size="md" onClick={() => router.push('/dreams')}>
                    Create Your First Dream
                  </GlowButton>
                </div>
              )}
            </div>
          </div>
        );

      case 'q1':
      case 'q2':
      case 'q3':
      case 'q4':
        const questionIndex = currentStepIndex - 1;
        const question = QUESTIONS[questionIndex];

        return (
          <div
            className="flex h-full flex-col px-6 pt-4"
            style={{
              paddingBottom:
                keyboardHeight > 0 ? keyboardHeight + 16 : 'env(safe-area-inset-bottom, 16px)',
            }}
          >
            {/* Question Header */}
            <div className="mb-6">
              <p className="mb-2 text-sm text-purple-400">
                Question {question.number} of {QUESTIONS.length}
              </p>
              <h2 className="mb-3 text-2xl font-light leading-relaxed text-white">
                {getQuestionText(questionIndex)}
              </h2>
              <p className="text-sm leading-relaxed text-white/60">{question.guide}</p>
            </div>

            {/* Textarea */}
            <div
              className="min-h-0 flex-1"
              onFocusCapture={() => setIsTextareaFocused(true)}
              onBlurCapture={() => setIsTextareaFocused(false)}
            >
              <GlassInput
                variant="textarea"
                value={formData[question.id]}
                onChange={(value) => onFieldChange(question.id, value)}
                placeholder={question.placeholder}
                maxLength={question.limit}
                showCounter
                counterMode="words"
                rows={8}
                className="h-full"
              />
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pb-2 pt-4">
              <GlowButton
                variant="secondary"
                size="lg"
                onClick={goToPreviousStep}
                className="min-w-[100px]"
              >
                <ChevronLeft className="mr-1 h-5 w-5" />
                Back
              </GlowButton>

              <GlowButton
                variant="primary"
                size="lg"
                onClick={goToNextStep}
                disabled={!canGoNext()}
                className="min-w-[100px]"
              >
                Next
                <ChevronRight className="ml-1 h-5 w-5" />
              </GlowButton>
            </div>
          </div>
        );

      case 'tone':
        return (
          <div className="pb-safe flex h-full flex-col px-6 pt-4">
            <h2 className="mb-6 text-center text-2xl font-light text-white">
              Choose your reflection tone
            </h2>

            <div className="flex-1 overflow-y-auto">
              <ToneSelectionCard selectedTone={selectedTone} onSelect={onToneSelect} />
            </div>

            {/* Submit Button */}
            <div className="pb-4 pt-6">
              <div className="mb-4 flex items-center justify-between">
                <GlowButton
                  variant="secondary"
                  size="lg"
                  onClick={goToPreviousStep}
                  className="min-w-[100px]"
                >
                  <ChevronLeft className="mr-1 h-5 w-5" />
                  Back
                </GlowButton>

                <GlowButton
                  variant="cosmic"
                  size="lg"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="min-w-[180px]"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-3">
                      <CosmicLoader size="sm" />
                      Gazing...
                    </span>
                  ) : (
                    <>
                      Gaze into the Mirror
                      <Sparkles className="ml-2 h-5 w-5" />
                    </>
                  )}
                </GlowButton>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-mirror-void-deep">
      {/* Header with close button and progress */}
      <div className="pt-safe flex items-center justify-between border-b border-white/10 px-4 pb-4">
        <button
          onClick={handleCloseAttempt}
          className="-m-2 p-2 text-white/60 transition-colors hover:text-white"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>
        <ProgressOrbs currentStep={currentStepIndex} steps={WIZARD_STEPS.length} />
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Step Content with swipe */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStepIndex}
            custom={direction}
            variants={!prefersReducedMotion ? stepTransitionVariants : undefined}
            initial={!prefersReducedMotion ? 'enter' : undefined}
            animate={!prefersReducedMotion ? 'center' : undefined}
            exit={!prefersReducedMotion ? 'exit' : undefined}
            drag={isTextareaFocused ? false : 'x'}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.5}
            onDragEnd={handleDragEnd}
            className="absolute inset-0"
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Magical Mirror Gazing Overlay */}
      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            variants={gazingOverlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(15, 10, 30, 0.98) 0%, rgba(5, 2, 15, 1) 100%)',
            }}
          >
            {/* Twinkling stars background */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(40)].map((_, i) => (
                <motion.div
                  key={`star-${i}`}
                  className="absolute rounded-full bg-white"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    width: `${1 + Math.random() * 2}px`,
                    height: `${1 + Math.random() * 2}px`,
                    boxShadow: '0 0 6px rgba(255, 255, 255, 0.8)',
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

              {/* Floating particles */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={`particle-${i}`}
                  className="absolute h-1 w-1 rounded-full"
                  style={{
                    left: `${20 + Math.random() * 60}%`,
                    top: `${20 + Math.random() * 60}%`,
                    background:
                      'radial-gradient(circle, rgba(168, 85, 247, 0.9) 0%, rgba(236, 72, 153, 0.6) 50%, transparent 100%)',
                    filter: 'blur(1px)',
                  }}
                  animate={
                    !prefersReducedMotion
                      ? {
                          x: [0, (Math.random() - 0.5) * 80, 0],
                          y: [0, -40 - Math.random() * 40, 0],
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
            <div className="relative flex h-[200px] w-[200px] items-center justify-center">
              {/* Outer rotating ring */}
              <motion.div
                className="absolute h-[200px] w-[200px] rounded-full"
                style={{
                  background:
                    'conic-gradient(from 0deg, transparent 0%, rgba(168, 85, 247, 0.3) 25%, transparent 50%, rgba(251, 191, 36, 0.3) 75%, transparent 100%)',
                  filter: 'blur(8px)',
                }}
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

              {/* Middle rotating ring */}
              <motion.div
                className="absolute h-[160px] w-[160px] rounded-full"
                style={{
                  background:
                    'conic-gradient(from 180deg, transparent 0%, rgba(236, 72, 153, 0.4) 25%, transparent 50%, rgba(168, 85, 247, 0.4) 75%, transparent 100%)',
                  filter: 'blur(4px)',
                }}
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

              {/* The mirror portal itself */}
              <motion.div
                className="relative h-[120px] w-[120px] overflow-hidden rounded-full"
                style={{
                  background:
                    'radial-gradient(circle at 30% 30%, rgba(40, 30, 60, 0.9) 0%, rgba(20, 15, 35, 0.95) 50%, rgba(10, 5, 20, 1) 100%)',
                  boxShadow:
                    '0 0 60px rgba(168, 85, 247, 0.4), 0 0 100px rgba(168, 85, 247, 0.2), inset 0 0 40px rgba(0, 0, 0, 0.5), inset 0 0 80px rgba(168, 85, 247, 0.1)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                }}
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
                {/* Surface shimmer */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(255, 255, 255, 0.05) 100%)',
                  }}
                />

                {/* Inner glow */}
                <motion.div
                  className="absolute rounded-full"
                  style={{
                    inset: '20%',
                    background:
                      'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(236, 72, 153, 0.1) 50%, rgba(251, 191, 36, 0.15) 100%)',
                    filter: 'blur(10px)',
                  }}
                  animate={
                    !prefersReducedMotion
                      ? {
                          opacity: [0.3, 0.6, 0.3],
                        }
                      : undefined
                  }
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />

                {/* Center pulse */}
                <motion.div
                  className="absolute rounded-full"
                  style={{
                    inset: '30%',
                    background:
                      'radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, rgba(168, 85, 247, 0.1) 50%, transparent 100%)',
                  }}
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
              className="relative z-10 mt-10 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <div className="flex h-12 items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={statusIndex}
                    variants={statusTextVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="px-6 text-center text-xl font-light text-white/95"
                    style={{
                      letterSpacing: '0.05em',
                      textShadow: '0 0 30px rgba(168, 85, 247, 0.5)',
                    }}
                  >
                    {STATUS_MESSAGES[statusIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>

              <p className="mt-2 text-sm text-white/50" style={{ letterSpacing: '0.1em' }}>
                Your reflection is taking form...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl border border-white/10 bg-mirror-void-deep/95 p-6"
            >
              <h3 className="mb-3 text-xl font-semibold text-white">Leave reflection?</h3>
              <p className="mb-6 leading-relaxed text-white/70">
                Your answers will be lost if you leave now. Are you sure you want to exit?
              </p>

              <div className="flex gap-3">
                <GlowButton
                  variant="secondary"
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1"
                >
                  Keep Writing
                </GlowButton>

                <GlowButton
                  variant="primary"
                  onClick={() => {
                    localStorage.removeItem(STORAGE_KEY);
                    onClose();
                  }}
                  className="flex-1"
                >
                  Leave
                </GlowButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MobileReflectionFlow;
