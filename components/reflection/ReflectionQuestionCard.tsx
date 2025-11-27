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
      <p className="text-sm text-white/60 mb-2 font-light italic">
        {guidingText}
      </p>

      {/* Question text */}
      <h3 className="text-lg md:text-xl mb-4 font-light bg-gradient-to-r from-mirror-purple via-mirror-violet to-mirror-blue bg-clip-text text-transparent">
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
        rows={6}
        className="w-full"
      />
    </div>
  );
};

export default ReflectionQuestionCard;
