'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, PanInfo, useReducedMotion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Check, Sparkles } from 'lucide-react';

// Internal utilities
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/utils/haptics';

// Hooks
import { useKeyboardHeight } from '@/lib/hooks';

// Context for navigation
import { useHideBottomNav } from '@/contexts/NavigationContext';

// Internal components
import { GlassCard, GlowButton, CosmicLoader, GlassInput } from '@/components/ui/glass';
import { ProgressOrbs } from '@/components/ui/glass/ProgressOrbs';
import { ToneSelectionCard } from '@/components/reflection/ToneSelectionCard';

// Animation variants
import { stepTransitionVariants, gazingOverlayVariants, statusTextVariants } from '@/lib/animations/variants';

// Types
import type { ToneId } from '@/lib/utils/constants';

// Question limits (matching desktop)
import { QUESTION_LIMITS } from '@/lib/utils/constants';

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
type WizardStep = typeof WIZARD_STEPS[number];

// Question content
const QUESTIONS = [
  {
    id: 'dream' as keyof FormData,
    number: 1,
    text: 'What is this dream?',
    guide: 'Take a moment to describe your dream in vivid detail...',
    placeholder: 'Your thoughts are safe here... what\'s present for you right now?',
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
    text: 'What relationship do you seek with your dream?',
    guide: 'How does this dream connect to who you are becoming?',
    placeholder: 'How does this dream connect to who you\'re becoming?',
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
  career: '\uD83D\uDCBC',        // Briefcase
  health: '\uD83C\uDFC3',        // Runner
  relationships: '\u2764\uFE0F', // Heart
  creativity: '\uD83C\uDFA8',    // Art palette
  finance: '\uD83D\uDCB0',       // Money bag
  personal: '\u2728',            // Sparkles
  spiritual: '\uD83D\uDE4F',     // Praying hands
  education: '\uD83D\uDCDA',     // Books
  entrepreneurial: '\uD83D\uDE80', // Rocket
  financial: '\uD83D\uDCB0',     // Money bag
  personal_growth: '\uD83C\uDF31', // Seedling
  creative: '\uD83C\uDFA8',      // Art palette
  other: '\u2B50',               // Star
  default: '\uD83C\uDF1F',       // Glowing star
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
  const selectedDream = dreams.find(d => d.id === selectedDreamId);

  // Dirty form detection
  const isDirty = useMemo(() => {
    return Object.values(formData).some(value => value.trim().length > 0);
  }, [formData]);

  // Get question text - using simpler generic questions
  const getQuestionText = (questionIndex: number): string => {
    return QUESTIONS[questionIndex].text;
  };

  // Navigation helpers
  const goToNextStep = useCallback(() => {
    if (currentStepIndex < WIZARD_STEPS.length - 1) {
      setDirection(1);
      setCurrentStepIndex(prev => prev + 1);
      haptic('light');
    }
  }, [currentStepIndex]);

  const goToPreviousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setDirection(-1);
      setCurrentStepIndex(prev => prev - 1);
      haptic('light');
    }
  }, [currentStepIndex]);

  // Swipe handler
  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isTextareaFocused) return;

    const SWIPE_THRESHOLD = 50;
    const VELOCITY_THRESHOLD = 300;

    const shouldAdvance =
      info.offset.x < -SWIPE_THRESHOLD ||
      info.velocity.x < -VELOCITY_THRESHOLD;

    const shouldGoBack =
      info.offset.x > SWIPE_THRESHOLD ||
      info.velocity.x > VELOCITY_THRESHOLD;

    if (shouldAdvance && canGoNext()) {
      goToNextStep();
    } else if (shouldGoBack) {
      goToPreviousStep();
    }
  }, [isTextareaFocused, goToNextStep, goToPreviousStep]);

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
      setStatusIndex(prev => (prev + 1) % STATUS_MESSAGES.length);
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
  const handleDreamSelection = useCallback((dream: Dream) => {
    haptic('light');
    onDreamSelect(dream);
    setShowDreamSheet(false);
    // Auto-advance to first question
    setTimeout(() => {
      goToNextStep();
    }, 300);
  }, [onDreamSelect, goToNextStep]);

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'dreamSelect':
        return (
          <div className="flex flex-col h-full px-6 pt-4 pb-safe">
            <h2 className="text-2xl font-light text-white text-center mb-8">
              Which dream are you reflecting on?
            </h2>

            <div className="flex-1 overflow-y-auto space-y-3">
              {dreams.length > 0 ? (
                <>
                  {dreams.map((dream) => {
                    const isSelected = dream.id === selectedDreamId;
                    const emoji = CATEGORY_EMOJI[dream.category || 'default'] || CATEGORY_EMOJI.default;

                    return (
                      <motion.button
                        key={dream.id}
                        onClick={() => handleDreamSelection(dream)}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          'w-full flex items-center gap-4 p-4',
                          'min-h-[60px]',
                          'rounded-2xl',
                          'transition-colors duration-200',
                          isSelected
                            ? 'bg-purple-500/20 border border-purple-500/50'
                            : 'bg-white/5 border border-white/10 active:bg-white/10'
                        )}
                      >
                        <span className="text-2xl" role="img" aria-label={dream.category || 'dream'}>
                          {emoji}
                        </span>
                        <div className="flex-1 text-left">
                          <h3 className="text-white font-medium truncate">
                            {dream.title}
                          </h3>
                          {dream.description && (
                            <p className="text-white/60 text-sm truncate mt-0.5">
                              {dream.description}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-white/70 mb-6">No active dreams yet.</p>
                  <GlowButton
                    variant="primary"
                    size="md"
                    onClick={() => router.push('/dreams')}
                  >
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
            className="flex flex-col h-full px-6 pt-4"
            style={{
              paddingBottom: keyboardHeight > 0 ? keyboardHeight + 16 : 'env(safe-area-inset-bottom, 16px)',
            }}
          >
            {/* Question Header */}
            <div className="mb-6">
              <p className="text-sm text-purple-400 mb-2">
                Question {question.number} of {QUESTIONS.length}
              </p>
              <h2 className="text-2xl font-light text-white leading-relaxed mb-3">
                {getQuestionText(questionIndex)}
              </h2>
              <p className="text-white/60 text-sm leading-relaxed">
                {question.guide}
              </p>
            </div>

            {/* Textarea */}
            <div
              className="flex-1 min-h-0"
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
            <div className="flex items-center justify-between pt-4 pb-2">
              <GlowButton
                variant="secondary"
                size="lg"
                onClick={goToPreviousStep}
                className="min-w-[100px]"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
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
                <ChevronRight className="w-5 h-5 ml-1" />
              </GlowButton>
            </div>
          </div>
        );

      case 'tone':
        return (
          <div className="flex flex-col h-full px-6 pt-4 pb-safe">
            <h2 className="text-2xl font-light text-white text-center mb-6">
              Choose your reflection tone
            </h2>

            <div className="flex-1 overflow-y-auto">
              <ToneSelectionCard
                selectedTone={selectedTone}
                onSelect={onToneSelect}
              />
            </div>

            {/* Submit Button */}
            <div className="pt-6 pb-4">
              <div className="flex items-center justify-between mb-4">
                <GlowButton
                  variant="secondary"
                  size="lg"
                  onClick={goToPreviousStep}
                  className="min-w-[100px]"
                >
                  <ChevronLeft className="w-5 h-5 mr-1" />
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
                      <Sparkles className="w-5 h-5 ml-2" />
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
    <div className="fixed inset-0 z-50 bg-mirror-void-deep flex flex-col">
      {/* Header with close button and progress */}
      <div className="flex items-center justify-between px-4 pt-safe pb-4 border-b border-white/10">
        <button
          onClick={handleCloseAttempt}
          className="p-2 -m-2 text-white/60 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        <ProgressOrbs
          currentStep={currentStepIndex}
          steps={WIZARD_STEPS.length}
        />

        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Step Content with swipe */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStepIndex}
            custom={direction}
            variants={!prefersReducedMotion ? stepTransitionVariants : undefined}
            initial={!prefersReducedMotion ? "enter" : undefined}
            animate={!prefersReducedMotion ? "center" : undefined}
            exit={!prefersReducedMotion ? "exit" : undefined}
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

      {/* Gazing Overlay */}
      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            variants={gazingOverlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-mirror-void-deep/98 backdrop-blur-xl"
          >
            <motion.div
              animate={
                !prefersReducedMotion
                  ? { scale: [1, 1.05, 1] }
                  : undefined
              }
              transition={
                !prefersReducedMotion
                  ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                  : undefined
              }
            >
              <CosmicLoader size="lg" />
            </motion.div>

            <div className="mt-8 h-16 flex items-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={statusIndex}
                  variants={statusTextVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="text-white/90 text-xl font-light text-center px-6"
                >
                  {STATUS_MESSAGES[statusIndex]}
                </motion.p>
              </AnimatePresence>
            </div>

            <p className="text-white/50 text-sm mt-2">
              This may take a few moments
            </p>
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
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-mirror-void-deep/95 border border-white/10 rounded-2xl p-6 max-w-sm w-full"
            >
              <h3 className="text-xl font-semibold text-white mb-3">
                Leave reflection?
              </h3>
              <p className="text-white/70 mb-6 leading-relaxed">
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
