'use client';

import React from 'react';

import type { ToneId } from '@/lib/utils/constants';

import { GlowButton } from '@/components/ui/glass/GlowButton';
import { cn } from '@/lib/utils';
import { TONES } from '@/lib/utils/constants';

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

  const handleKeyDown = (event: React.KeyboardEvent, toneId: ToneId) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToneSelect(toneId);
    }
  };

  // Get variant based on tone selection
  const getVariant = (toneId: ToneId): 'primary' | 'secondary' | 'cosmic' => {
    if (selectedTone !== toneId) return 'secondary';
    switch (toneId) {
      case 'gentle':
        return 'primary';
      case 'intense':
        return 'cosmic';
      case 'fusion':
        return 'cosmic';
      default:
        return 'primary';
    }
  };

  return (
    <div className="tone-selection">
      <div className="tone-label">
        <span>Choose the voice of your reflection</span>
      </div>

      <div
        className="tone-buttons flex flex-wrap gap-3"
        role="radiogroup"
        aria-label="Reflection tone selection"
        aria-required="true"
      >
        {TONES.map((tone) => (
          <GlowButton
            key={tone.id}
            variant={getVariant(tone.id)}
            size="md"
            onClick={() => handleToneSelect(tone.id)}
            disabled={disabled}
            className={cn(
              'flex items-center gap-2',
              selectedTone === tone.id && 'ring-2 ring-purple-400/50'
            )}
          >
            <span className="tone-button-text">{tone.label}</span>
            {selectedTone === tone.id && (
              <span className="tone-button-indicator" aria-hidden="true">
                ✨
              </span>
            )}
          </GlowButton>
        ))}
      </div>

      <div className="tone-description" aria-live="polite" aria-atomic="true">
        {TONES.find((t) => t.id === selectedTone)?.description || ''}
      </div>
    </div>
  );
};

export default ToneSelection;
