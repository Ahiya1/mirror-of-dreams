'use client';

import { useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { GlassInput } from '@/components/ui/glass/GlassInput';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { cn } from '@/lib/utils';

interface QuestionStepProps {
  questionNumber: number;
  totalQuestions: number;
  questionText: string;
  guidingText: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  onFocus: () => void;
  onBlur: () => void;
  keyboardHeight?: number;
}

export interface QuestionStepRef {
  focus: () => void;
}

/**
 * QuestionStep - Full-screen single question display for mobile wizard
 *
 * Features:
 * - Large textarea with word count
 * - Question text and guiding placeholder
 * - Keyboard-aware positioning via keyboardHeight prop
 * - Auto-scroll textarea into view on focus
 */
export const QuestionStep = forwardRef<QuestionStepRef, QuestionStepProps>(
  function QuestionStep(
    {
      questionNumber,
      totalQuestions,
      questionText,
      guidingText,
      placeholder,
      value,
      onChange,
      maxLength,
      onNext,
      onPrevious,
      canGoNext,
      canGoPrevious,
      onFocus,
      onBlur,
      keyboardHeight = 0,
    },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Expose focus method to parent
    useImperativeHandle(ref, () => ({
      focus: () => {
        const textarea = containerRef.current?.querySelector('textarea');
        textarea?.focus();
      },
    }));

    // Auto-scroll container when keyboard is visible
    useEffect(() => {
      if (keyboardHeight > 0 && containerRef.current) {
        const timer = setTimeout(() => {
          containerRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }, 100);
        return () => clearTimeout(timer);
      }
    }, [keyboardHeight]);

    // Determine if we can proceed (require some content)
    const canProceed = value.trim().length > 0;

    return (
      <div
        ref={containerRef}
        className="flex flex-col h-full px-6 pt-4"
        style={{
          paddingBottom: keyboardHeight > 0 ? keyboardHeight + 16 : 'max(env(safe-area-inset-bottom, 16px), 16px)',
        }}
      >
        {/* Question Header */}
        <div className="mb-6 flex-shrink-0">
          <p className="text-sm text-purple-400 mb-2 font-medium">
            Question {questionNumber} of {totalQuestions}
          </p>
          <h2 className="text-2xl font-light text-white leading-relaxed mb-3">
            {questionText}
          </h2>
          <p className="text-white/60 text-sm leading-relaxed italic">
            {guidingText}
          </p>
        </div>

        {/* Textarea - wrapped to capture focus events */}
        <div
          className="flex-1 min-h-0 mb-4"
          onFocusCapture={onFocus}
          onBlurCapture={onBlur}
        >
          <GlassInput
            variant="textarea"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            maxLength={maxLength}
            showCounter
            counterMode="words"
            rows={8}
            className="h-full"
          />
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 pb-2 flex-shrink-0">
          <GlowButton
            variant="secondary"
            size="lg"
            onClick={onPrevious}
            disabled={!canGoPrevious}
            className={cn(!canGoPrevious && 'opacity-0 pointer-events-none')}
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </GlowButton>

          <GlowButton
            variant="primary"
            size="lg"
            onClick={onNext}
            disabled={!canGoNext || !canProceed}
          >
            Next
            <ChevronRight className="w-5 h-5 ml-1" />
          </GlowButton>
        </div>
      </div>
    );
  }
);
