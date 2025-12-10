'use client';

import { useState, useCallback, useMemo } from 'react';

import type { FormData } from '@/lib/reflection/types';
import type { PanInfo } from 'framer-motion';

import { QUESTIONS, STORAGE_KEY } from '@/lib/reflection/constants';
import { haptic } from '@/lib/utils/haptics';

// Wizard step definitions
export const WIZARD_STEPS = ['dreamSelect', 'q1', 'q2', 'q3', 'q4', 'tone'] as const;
export type WizardStep = (typeof WIZARD_STEPS)[number];

// Swipe thresholds
const SWIPE_THRESHOLD = 50;
const VELOCITY_THRESHOLD = 300;

export interface UseMobileReflectionFlowOptions {
  selectedDreamId: string;
  formData: FormData;
  onClose: () => void;
}

export interface UseMobileReflectionFlowReturn {
  // State
  currentStepIndex: number;
  currentStep: WizardStep;
  direction: number;
  isTextareaFocused: boolean;
  showExitConfirm: boolean;
  isDirty: boolean;
  totalSteps: number;

  // Actions
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  canGoNext: () => boolean;
  handleDragEnd: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
  setIsTextareaFocused: (focused: boolean) => void;
  handleCloseAttempt: () => void;
  confirmExit: () => void;
  cancelExit: () => void;
}

/**
 * useMobileReflectionFlow - Manages wizard state for mobile reflection flow
 *
 * Handles:
 * - Step navigation (current step, direction)
 * - Swipe gesture detection with threshold validation
 * - Form validation per step (canGoNext)
 * - Exit confirmation for dirty forms
 * - Textarea focus state for disabling swipe during input
 */
export function useMobileReflectionFlow({
  selectedDreamId,
  formData,
  onClose,
}: UseMobileReflectionFlowOptions): UseMobileReflectionFlowReturn {
  // Step state
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Derived state
  const currentStep = WIZARD_STEPS[currentStepIndex];
  const totalSteps = WIZARD_STEPS.length;

  // Dirty form detection - checks if any form field has content
  const isDirty = useMemo(() => {
    return Object.values(formData).some((value) => value.trim().length > 0);
  }, [formData]);

  // Can advance check - validates per-step requirements
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

  // Navigation - advance to next step
  const goToNextStep = useCallback(() => {
    setCurrentStepIndex((prev) => {
      if (prev < totalSteps - 1) {
        setDirection(1);
        haptic('light');
        return prev + 1;
      }
      return prev;
    });
  }, [totalSteps]);

  // Navigation - go to previous step
  const goToPreviousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setDirection(-1);
      setCurrentStepIndex((prev) => prev - 1);
      haptic('light');
    }
  }, [currentStepIndex]);

  // Swipe handler - processes drag gestures for navigation
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      // Disable swipe when textarea is focused to allow text selection
      if (isTextareaFocused) return;

      const shouldAdvance =
        info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -VELOCITY_THRESHOLD;
      const shouldGoBack = info.offset.x > SWIPE_THRESHOLD || info.velocity.x > VELOCITY_THRESHOLD;

      if (shouldAdvance && canGoNext()) {
        goToNextStep();
      } else if (shouldGoBack && currentStepIndex > 0) {
        goToPreviousStep();
      }
    },
    [isTextareaFocused, canGoNext, goToNextStep, goToPreviousStep, currentStepIndex]
  );

  // Exit handling - shows confirmation for dirty forms
  const handleCloseAttempt = useCallback(() => {
    if (isDirty) {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  // Confirm exit - clears localStorage and closes
  const confirmExit = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    onClose();
  }, [onClose]);

  // Cancel exit - hides confirmation modal
  const cancelExit = useCallback(() => {
    setShowExitConfirm(false);
  }, []);

  return {
    // State
    currentStepIndex,
    currentStep,
    direction,
    isTextareaFocused,
    showExitConfirm,
    isDirty,
    totalSteps,

    // Actions
    goToNextStep,
    goToPreviousStep,
    canGoNext,
    handleDragEnd,
    setIsTextareaFocused,
    handleCloseAttempt,
    confirmExit,
    cancelExit,
  };
}
