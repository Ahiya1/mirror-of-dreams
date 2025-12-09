'use client';

import { motion, useReducedMotion } from 'framer-motion';
import React from 'react';

import type { ToneId } from '@/lib/utils/constants';

import { GlassCard } from '@/components/ui/glass';
import { cn } from '@/lib/utils';
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
    icon: '✨',
  },
  {
    id: 'gentle',
    name: 'Gentle Clarity',
    description: TONE_DESCRIPTIONS.gentle,
    icon: '🌸',
  },
  {
    id: 'intense',
    name: 'Luminous Intensity',
    description: TONE_DESCRIPTIONS.intense,
    icon: '⚡',
  },
];

// Tone-specific glow colors for hover effects
const TONE_GLOW_COLORS = {
  fusion: 'rgba(251, 191, 36, 0.3)', // Gold
  gentle: 'rgba(59, 130, 246, 0.3)', // Blue
  intense: 'rgba(168, 85, 247, 0.3)', // Purple
};

interface ToneSelectionCardProps {
  selectedTone: ToneId;
  onSelect: (tone: ToneId) => void;
}

/**
 * ToneSelectionCard - Visual tone selection cards
 *
 * Presents reflection tones as rich, interactive cards with:
 * - Icons for visual identity
 * - Clear descriptions
 * - Selection state with cosmic glow
 */
export const ToneSelectionCard: React.FC<ToneSelectionCardProps> = ({ selectedTone, onSelect }) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="tone-selection-cards">
      {/* Section header */}
      <div className="mb-6 text-center">
        <h2 className="from-mirror-purple via-mirror-violet to-mirror-blue mb-2 bg-gradient-to-r bg-clip-text text-2xl font-light text-transparent md:text-3xl">
          Choose Your Reflection Tone
        </h2>
        <p className="text-sm text-white/70 md:text-base">How shall the mirror speak to you?</p>
      </div>

      {/* Tone cards grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {TONE_OPTIONS.map((tone) => {
          const isSelected = selectedTone === tone.id;
          const glowColor = TONE_GLOW_COLORS[tone.id];

          return (
            <motion.button
              key={tone.id}
              type="button"
              onClick={() => onSelect(tone.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(tone.id);
                }
              }}
              className="focus:ring-mirror-purple w-full rounded-xl text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent"
              aria-pressed={isSelected}
              aria-label={`${tone.name}: ${tone.description}`}
              whileHover={
                prefersReducedMotion
                  ? undefined
                  : {
                      boxShadow: `0 0 30px ${glowColor}`,
                      y: -2,
                    }
              }
              whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
            >
              <GlassCard
                elevated={isSelected}
                interactive
                className={cn(
                  'h-full cursor-pointer transition-all duration-300',
                  isSelected &&
                    'border-mirror-purple/60 bg-mirror-purple/10 shadow-mirror-purple/20 shadow-lg'
                )}
              >
                <div className="space-y-4 px-4 py-6 text-center">
                  {/* Icon */}
                  <motion.div
                    className="text-5xl"
                    animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {tone.icon}
                  </motion.div>

                  {/* Name */}
                  <h3
                    className={cn(
                      'text-lg font-semibold transition-colors',
                      isSelected
                        ? 'from-mirror-purple to-mirror-blue bg-gradient-to-r bg-clip-text text-transparent'
                        : 'text-white/95'
                    )}
                  >
                    {tone.name}
                  </h3>

                  {/* Description */}
                  <p className="text-sm leading-relaxed text-white/70">{tone.description}</p>

                  {/* Selection indicator */}
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className="text-mirror-purple flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Selected
                    </motion.div>
                  )}
                </div>
              </GlassCard>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default ToneSelectionCard;
