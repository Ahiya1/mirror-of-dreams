'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { haptic } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils';
import type { ToneId } from '@/lib/utils/constants';
import { TONE_DESCRIPTIONS } from '@/lib/utils/constants';

interface ToneOption {
  id: ToneId;
  name: string;
  description: string;
  icon: string;
}

const TONE_OPTIONS: ToneOption[] = [
  {
    id: 'fusion',
    name: 'Sacred Fusion',
    description: TONE_DESCRIPTIONS.fusion,
    icon: '\u2728', // Sparkles
  },
  {
    id: 'gentle',
    name: 'Gentle Clarity',
    description: TONE_DESCRIPTIONS.gentle,
    icon: '\uD83C\uDF38', // Cherry blossom
  },
  {
    id: 'intense',
    name: 'Luminous Intensity',
    description: TONE_DESCRIPTIONS.intense,
    icon: '\u26A1', // Lightning
  },
];

interface ToneStepProps {
  selectedTone: ToneId | null;
  onSelect: (tone: ToneId) => void;
  onPrevious: () => void;
  onSubmit: () => void;
  canGoPrevious: boolean;
  isSubmitting: boolean;
}

/**
 * ToneStep - Full-screen tone selection for mobile wizard
 *
 * Features:
 * - Large touch targets for tone selection
 * - Haptic feedback on selection
 * - Vertical stacked layout optimized for mobile
 */
export function ToneStep({
  selectedTone,
  onSelect,
  onPrevious,
  onSubmit,
  canGoPrevious,
  isSubmitting,
}: ToneStepProps) {
  const prefersReducedMotion = useReducedMotion();

  const handleSelect = (tone: ToneId) => {
    haptic('light');
    onSelect(tone);
  };

  return (
    <div className="flex flex-col h-full px-6 pt-4 pb-[env(safe-area-inset-bottom,16px)]">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-light bg-gradient-to-r from-mirror-purple via-mirror-violet to-mirror-blue bg-clip-text text-transparent mb-2">
          Choose Your Reflection Tone
        </h2>
        <p className="text-white/70 text-sm">
          How shall the mirror speak to you?
        </p>
      </div>

      {/* Tone Options */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        {TONE_OPTIONS.map((tone) => {
          const isSelected = selectedTone === tone.id;

          return (
            <motion.button
              key={tone.id}
              type="button"
              onClick={() => handleSelect(tone.id)}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
              className={cn(
                'w-full text-left rounded-2xl p-5',
                'transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-mirror-purple focus:ring-offset-2 focus:ring-offset-transparent',
                isSelected
                  ? 'bg-purple-500/20 border-2 border-purple-500/50'
                  : 'bg-white/5 border-2 border-white/10 active:bg-white/10'
              )}
              aria-pressed={isSelected}
              aria-label={`${tone.name}: ${tone.description}`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <span className="text-4xl flex-shrink-0" role="img" aria-hidden="true">
                  {tone.icon}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3
                    className={cn(
                      'text-lg font-semibold mb-1 transition-colors',
                      isSelected
                        ? 'bg-gradient-to-r from-mirror-purple to-mirror-blue bg-clip-text text-transparent'
                        : 'text-white/95'
                    )}
                  >
                    {tone.name}
                  </h3>
                  <p className="text-sm text-white/70 leading-relaxed">
                    {tone.description}
                  </p>
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0"
                  >
                    <Check className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 pb-2 gap-4">
        <GlowButton
          variant="secondary"
          size="lg"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className={cn('flex-1', !canGoPrevious && 'opacity-0 pointer-events-none')}
        >
          Back
        </GlowButton>

        <GlowButton
          variant="cosmic"
          size="lg"
          onClick={onSubmit}
          disabled={!selectedTone || isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? 'Gazing...' : 'Gaze into Mirror'}
        </GlowButton>
      </div>
    </div>
  );
}
