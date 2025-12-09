'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';

import type { ToneId } from '@/lib/utils/constants';

import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlowButton } from '@/components/ui/glass/GlowButton';
import { cn } from '@/lib/utils';
import { TONE_DESCRIPTIONS } from '@/lib/utils/constants';
import { haptic } from '@/lib/utils/haptics';

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
    <div className="flex h-full flex-col px-6 pb-[env(safe-area-inset-bottom,16px)] pt-4">
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="from-mirror-purple via-mirror-violet to-mirror-blue mb-2 bg-gradient-to-r bg-clip-text text-2xl font-light text-transparent">
          Choose Your Reflection Tone
        </h2>
        <p className="text-sm text-white/70">How shall the mirror speak to you?</p>
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
                'w-full rounded-2xl p-5 text-left',
                'transition-all duration-200',
                'focus:ring-mirror-purple focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent',
                isSelected
                  ? 'border-2 border-purple-500/50 bg-purple-500/20'
                  : 'border-2 border-white/10 bg-white/5 active:bg-white/10'
              )}
              aria-pressed={isSelected}
              aria-label={`${tone.name}: ${tone.description}`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <span className="flex-shrink-0 text-4xl" role="img" aria-hidden="true">
                  {tone.icon}
                </span>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <h3
                    className={cn(
                      'mb-1 text-lg font-semibold transition-colors',
                      isSelected
                        ? 'from-mirror-purple to-mirror-blue bg-gradient-to-r bg-clip-text text-transparent'
                        : 'text-white/95'
                    )}
                  >
                    {tone.name}
                  </h3>
                  <p className="text-sm leading-relaxed text-white/70">{tone.description}</p>
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-500"
                  >
                    <Check className="h-4 w-4 text-white" />
                  </motion.div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4 pb-2 pt-4">
        <GlowButton
          variant="secondary"
          size="lg"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className={cn('flex-1', !canGoPrevious && 'pointer-events-none opacity-0')}
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
