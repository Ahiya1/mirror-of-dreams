'use client';

import React from 'react';

import { GlassInput } from '@/components/ui/glass';
import { cn } from '@/lib/utils';

interface ReflectionQuestionCardProps {
  questionNumber: number;
  totalQuestions: number;
  questionText: string;
  guidingText: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
}

/**
 * ReflectionQuestionCard - Guided question presentation
 *
 * Creates contemplative space for each reflection question with:
 * - Question number and guiding text
 * - Spacious textarea input
 * - Subtle character counter
 */
export const ReflectionQuestionCard: React.FC<ReflectionQuestionCardProps> = ({
  questionNumber,
  totalQuestions,
  questionText,
  guidingText,
  placeholder,
  value,
  onChange,
  maxLength,
}) => {
  return (
    <div className="reflection-question-card">
      {/* Guiding text - sets contemplative tone */}
      <p className="mb-2 text-sm font-light italic text-white/60">{guidingText}</p>

      {/* Question text */}
      <h3 className="from-mirror-purple via-mirror-violet to-mirror-blue mb-4 bg-gradient-to-r bg-clip-text text-lg font-light text-transparent md:text-xl">
        {questionNumber}. {questionText}
      </h3>

      {/* Input area */}
      <GlassInput
        variant="textarea"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        showCounter={true}
        counterMode="words"
        rows={6}
        className="w-full"
      />
    </div>
  );
};

export default ReflectionQuestionCard;
