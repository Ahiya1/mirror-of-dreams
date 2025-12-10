'use client';

import React from 'react';

import type { FormData, Dream } from '@/lib/reflection/types';
import type { ToneId } from '@/lib/utils/constants';

import { ProgressBar } from '@/components/reflection/ProgressBar';
import { ReflectionQuestionCard } from '@/components/reflection/ReflectionQuestionCard';
import { ToneSelectionCard } from '@/components/reflection/ToneSelectionCard';
import { GlowButton, CosmicLoader } from '@/components/ui/glass';
import { QUESTIONS } from '@/lib/reflection/constants';
import { REFLECTION_MICRO_COPY } from '@/lib/utils/constants';

interface ReflectionFormViewProps {
  selectedDream: Dream | null;
  formData: FormData;
  onFieldChange: (field: keyof FormData, value: string) => void;
  selectedTone: ToneId;
  onToneSelect: (tone: ToneId) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

/**
 * Reflection form view with all questions and tone selection
 *
 * Features:
 * - Dream context banner
 * - Progress indicator
 * - All 4 reflection questions
 * - Tone selection
 * - Submit button with loading state
 */
export function ReflectionFormView({
  selectedDream,
  formData,
  onFieldChange,
  selectedTone,
  onToneSelect,
  onSubmit,
  isSubmitting,
}: ReflectionFormViewProps) {
  return (
    <div className="one-page-form">
      {/* Welcome Message */}
      <div className="mb-6 text-center">
        <p className="text-base font-light italic text-white/80 md:text-lg">
          {REFLECTION_MICRO_COPY.welcome}
        </p>
      </div>

      {/* Dream Context Banner */}
      {selectedDream && (
        <div className="dream-context-banner">
          <h2>Reflecting on: {selectedDream.title}</h2>
          <div className="dream-meta">
            {selectedDream.category && (
              <span className="category-badge">{selectedDream.category}</span>
            )}
            {selectedDream.daysLeft !== null && selectedDream.daysLeft !== undefined && (
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

      {/* All 4 Questions */}
      <div className="questions-container">
        {QUESTIONS.map((question) => (
          <ReflectionQuestionCard
            key={question.id}
            questionNumber={question.number}
            totalQuestions={4}
            questionText={question.text}
            guidingText={question.guide}
            placeholder={question.placeholder}
            value={formData[question.id]}
            onChange={(value) => onFieldChange(question.id, value)}
            maxLength={question.limit}
          />
        ))}
      </div>

      {/* Tone Selection */}
      <div className="mb-8">
        <ToneSelectionCard selectedTone={selectedTone} onSelect={onToneSelect} />
      </div>

      {/* Ready message */}
      <div className="mb-6 text-center">
        <p className="text-sm italic text-white/70">{REFLECTION_MICRO_COPY.readyToSubmit}</p>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center">
        <GlowButton
          variant="cosmic"
          size="lg"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="submit-button-breathe min-w-[280px] text-lg font-medium"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-3">
              <CosmicLoader size="sm" />
              Gazing...
            </span>
          ) : (
            'Gaze into the Mirror'
          )}
        </GlowButton>
      </div>
    </div>
  );
}
