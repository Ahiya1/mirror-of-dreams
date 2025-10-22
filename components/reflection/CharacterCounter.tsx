'use client';

import React from 'react';

interface CharacterCounterProps {
  current: number;
  max: number;
  warning?: number;
}

const CharacterCounter: React.FC<CharacterCounterProps> = ({
  current,
  max,
  warning = max * 0.85,
}) => {
  const percentage = (current / max) * 100;
  const isWarning = current >= warning;
  const isError = current >= max;

  const className = [
    'character-counter',
    isError && 'error',
    isWarning && !isError && 'warning',
  ]
    .filter(Boolean)
    .join(' ');

  const getProgressColor = () => {
    if (percentage >= 100) return 'rgba(239, 68, 68, 0.8)';
    if (percentage >= 85) return 'rgba(251, 191, 36, 0.8)';
    return 'rgba(110, 231, 183, 0.8)';
  };

  return (
    <div className={className}>
      <div className="count-text">
        <span className="count">{current}</span>
        <span className="separator">/</span>
        <span className="max">{max}</span>
      </div>

      <div className="char-progress">
        <div
          className="char-progress-bar"
          style={{
            width: `${Math.min(percentage, 100)}%`,
            backgroundColor: getProgressColor(),
          }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={`Character count: ${current} of ${max}`}
        />
      </div>

      {isError && (
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          Character limit reached
        </div>
      )}
    </div>
  );
};

export default CharacterCounter;
