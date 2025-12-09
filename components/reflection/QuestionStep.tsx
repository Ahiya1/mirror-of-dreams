'use client';

import React from 'react';

import CharacterCounter from './CharacterCounter';

import { GlowButton } from '@/components/ui/glass/GlowButton';

interface QuestionStepProps {
  questionNumber: number;
  question: string;
  subtitle?: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  error?: string;
  type?: 'textarea' | 'choice';
  choices?: { value: string; label: string }[];
  selectedChoice?: string;
  onChoiceSelect?: (value: string) => void;
  showDateInput?: boolean;
  dateValue?: string;
  onDateChange?: (value: string) => void;
}

const QuestionStep: React.FC<QuestionStepProps> = ({
  questionNumber,
  question,
  subtitle,
  value,
  onChange,
  maxLength,
  error,
  type = 'textarea',
  choices,
  selectedChoice,
  onChoiceSelect,
  showDateInput,
  dateValue,
  onDateChange,
}) => {
  const inputId = `question-${questionNumber}`;
  const titleId = `${inputId}-title`;
  const subtitleId = `${inputId}-subtitle`;

  if (type === 'choice' && choices) {
    return (
      <div className="glass-card question-card">
        <div style={{ padding: 'var(--space-xl)' }}>
          <div className="question-number">Question {questionNumber}</div>

          <h2 id={titleId} className="question-title">
            {question}
            <span className="sr-only"> (required)</span>
          </h2>

          {subtitle && (
            <p id={subtitleId} className="question-subtitle">
              {subtitle}
            </p>
          )}

          <div
            className="choice-buttons flex flex-wrap gap-3"
            role="radiogroup"
            aria-labelledby={titleId}
            aria-describedby={subtitle ? subtitleId : undefined}
            aria-required="true"
          >
            {choices.map((choice) => (
              <GlowButton
                key={choice.value}
                variant={selectedChoice === choice.value ? 'primary' : 'secondary'}
                size="md"
                onClick={() => onChoiceSelect?.(choice.value)}
                className={selectedChoice === choice.value ? 'ring-2 ring-purple-400/50' : ''}
              >
                {choice.label}
              </GlowButton>
            ))}
          </div>

          {showDateInput && (
            <div
              className="date-container"
              style={{
                opacity: showDateInput ? 1 : 0,
                visibility: showDateInput ? 'visible' : 'hidden',
                height: showDateInput ? 'auto' : 0,
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                marginTop: 'var(--space-lg)',
              }}
            >
              <label htmlFor={`${inputId}-date`} className="date-label">
                Target Date:
              </label>
              <input
                id={`${inputId}-date`}
                type="date"
                value={dateValue || ''}
                onChange={(e) => onDateChange?.(e.target.value)}
                required={showDateInput}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          )}

          {error && (
            <div
              className="validation-error"
              role="alert"
              style={{
                marginTop: 'var(--space-2)',
                color: 'var(--error-primary)',
                fontSize: 'var(--text-sm)',
              }}
            >
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card question-card">
      <div style={{ padding: 'var(--space-xl)' }}>
        <div className="question-number">Question {questionNumber}</div>

        <h2 id={titleId} className="question-title">
          {question}
          <span className="sr-only"> (required)</span>
        </h2>

        {subtitle && (
          <p id={subtitleId} className="question-subtitle">
            {subtitle}
          </p>
        )}

        <textarea
          id={inputId}
          className={`cosmic-textarea ${error ? 'error' : ''}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          rows={6}
          required
          aria-labelledby={titleId}
          aria-describedby={subtitle ? subtitleId : undefined}
          aria-invalid={!!error}
          placeholder="Write your authentic response..."
        />

        {error && (
          <div
            className="validation-error"
            role="alert"
            style={{
              marginTop: 'var(--space-2)',
              color: 'var(--error-primary)',
              fontSize: 'var(--text-sm)',
            }}
          >
            {error}
          </div>
        )}

        <CharacterCounter current={value.length} max={maxLength} />
      </div>
    </div>
  );
};

export default QuestionStep;
