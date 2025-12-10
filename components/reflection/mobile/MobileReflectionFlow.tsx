'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import React, { useCallback, useEffect } from 'react';

import { ExitConfirmation } from './ExitConfirmation';
import { GazingOverlay } from './GazingOverlay';
import { QuestionStep } from './QuestionStep';
import { ToneStep } from './ToneStep';
import { MobileDreamSelectionView } from './views/MobileDreamSelectionView';

import type { FormData, Dream } from '@/lib/reflection/types';
import type { ToneId } from '@/lib/utils/constants';

import { ProgressOrbs } from '@/components/ui/glass/ProgressOrbs';
import { useHideBottomNav } from '@/contexts/NavigationContext';
import { useKeyboardHeight } from '@/hooks';
import { useMobileReflectionFlow, WIZARD_STEPS } from '@/hooks/useMobileReflectionFlow';
import { stepTransitionVariants } from '@/lib/animations/variants';
import { QUESTIONS, STORAGE_KEY } from '@/lib/reflection/constants';

// Re-export types for backwards compatibility
export type { FormData, Dream };

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

/**
 * MobileReflectionFlow - Full-screen step-by-step reflection wizard for mobile
 *
 * This component provides a native mobile experience for the reflection flow:
 * - One question per screen with swipe navigation
 * - Dream selection step
 * - Keyboard-aware positioning
 * - Exit confirmation for unsaved data
 * - LocalStorage persistence
 *
 * Refactored to use:
 * - useMobileReflectionFlow hook for state management
 * - MobileDreamSelectionView for dream selection
 * - QuestionStep for questions 1-4
 * - ToneStep for tone selection and submission
 * - GazingOverlay for loading state
 * - ExitConfirmation for exit modal
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
  const prefersReducedMotion = useReducedMotion();
  const keyboardHeight = useKeyboardHeight();

  // Hide bottom navigation while this component is mounted
  useHideBottomNav();

  // Wizard state management
  const flow = useMobileReflectionFlow({
    selectedDreamId,
    formData,
    onClose,
  });

  // Browser back/refresh prevention
  useEffect(() => {
    if (!flow.isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [flow.isDirty]);

  // Handle dream selection with auto-advance
  const handleDreamSelection = useCallback(
    (dream: Dream) => {
      onDreamSelect(dream);
      setTimeout(() => {
        flow.goToNextStep();
      }, 300);
    },
    [onDreamSelect, flow]
  );

  // Handle final submit
  const handleFinalSubmit = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    onSubmit();
  }, [onSubmit]);

  // Render step content
  const renderStepContent = () => {
    switch (flow.currentStep) {
      case 'dreamSelect':
        return (
          <MobileDreamSelectionView
            dreams={dreams}
            selectedDreamId={selectedDreamId}
            onDreamSelect={handleDreamSelection}
          />
        );

      case 'q1':
      case 'q2':
      case 'q3':
      case 'q4': {
        const questionIndex = flow.currentStepIndex - 1;
        const question = QUESTIONS[questionIndex];

        return (
          <QuestionStep
            questionNumber={question.number}
            totalQuestions={QUESTIONS.length}
            questionText={question.text}
            guidingText={question.guide}
            placeholder={question.placeholder}
            value={formData[question.id]}
            onChange={(value) => onFieldChange(question.id, value)}
            maxLength={question.limit}
            onNext={flow.goToNextStep}
            onPrevious={flow.goToPreviousStep}
            canGoNext={flow.canGoNext()}
            canGoPrevious={flow.currentStepIndex > 0}
            onFocus={() => flow.setIsTextareaFocused(true)}
            onBlur={() => flow.setIsTextareaFocused(false)}
            keyboardHeight={keyboardHeight}
          />
        );
      }

      case 'tone':
        return (
          <ToneStep
            selectedTone={selectedTone}
            onSelect={onToneSelect}
            onPrevious={flow.goToPreviousStep}
            onSubmit={handleFinalSubmit}
            canGoPrevious={true}
            isSubmitting={isSubmitting}
          />
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
          onClick={flow.handleCloseAttempt}
          className="-m-2 p-2 text-white/60 transition-colors hover:text-white"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>
        <ProgressOrbs currentStep={flow.currentStepIndex} steps={WIZARD_STEPS.length} />
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Step Content with swipe */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait" custom={flow.direction}>
          <motion.div
            key={flow.currentStepIndex}
            custom={flow.direction}
            variants={!prefersReducedMotion ? stepTransitionVariants : undefined}
            initial={!prefersReducedMotion ? 'enter' : undefined}
            animate={!prefersReducedMotion ? 'center' : undefined}
            exit={!prefersReducedMotion ? 'exit' : undefined}
            drag={flow.isTextareaFocused ? false : 'x'}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.5}
            onDragEnd={flow.handleDragEnd}
            className="absolute inset-0"
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Gazing Overlay - uses 'simple' variant for mobile */}
      <GazingOverlay isVisible={isSubmitting} variant="simple" />

      {/* Exit Confirmation Modal */}
      <ExitConfirmation
        isOpen={flow.showExitConfirm}
        onConfirm={flow.confirmExit}
        onCancel={flow.cancelExit}
      />
    </div>
  );
}

export default MobileReflectionFlow;
