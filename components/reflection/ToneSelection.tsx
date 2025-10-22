'use client';

import React from 'react';
import { TONES } from '@/lib/utils/constants';
import type { ToneId } from '@/lib/utils/constants';

interface ToneSelectionProps {
  selectedTone: ToneId;
  onSelect: (tone: ToneId) => void;
  disabled?: boolean;
}

const ToneSelection: React.FC<ToneSelectionProps> = ({
  selectedTone,
  onSelect,
  disabled = false,
}) => {
  const handleToneSelect = (toneId: ToneId) => {
    if (disabled || toneId === selectedTone) return;

    // Haptic feedback for mobile
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }

    onSelect(toneId);
  };

  const handleKeyDown = (
    event: React.KeyboardEvent,
    toneId: ToneId
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToneSelect(toneId);
    }
  };

  return (
    <div className="tone-selection">
      <div className="tone-label">
        <span>Choose the voice of your reflection</span>
      </div>

      <div
        className="tone-buttons"
        role="radiogroup"
        aria-label="Reflection tone selection"
        aria-required="true"
      >
        {TONES.map((tone) => (
          <button
            key={tone.id}
            type="button"
            className={`cosmic-button ${
              selectedTone === tone.id ? `cosmic-button--${tone.id}` : ''
            }`}
            onClick={() => handleToneSelect(tone.id)}
            onKeyDown={(e) => handleKeyDown(e, tone.id)}
            disabled={disabled}
            aria-pressed={selectedTone === tone.id}
            aria-label={`${tone.label}: ${tone.description}`}
            role="radio"
            aria-checked={selectedTone === tone.id}
          >
            <span className="tone-button-text">{tone.label}</span>
            {selectedTone === tone.id && (
              <span className="tone-button-indicator" aria-hidden="true">
                ✨
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="tone-description" aria-live="polite" aria-atomic="true">
        {TONES.find((t) => t.id === selectedTone)?.description || ''}
      </div>
    </div>
  );
};

export default ToneSelection;
