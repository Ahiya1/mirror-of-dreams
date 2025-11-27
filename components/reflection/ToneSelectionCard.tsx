'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/glass';
import { cn } from '@/lib/utils';
import type { ToneId } from '@/lib/utils/constants';

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
    description: 'Balanced wisdom where all voices become one',
    icon: '✨',
  },
  {
    id: 'gentle',
    name: 'Gentle Clarity',
    description: 'Soft wisdom that illuminates gently',
    icon: '🌸',
  },
  {
    id: 'intense',
    name: 'Luminous Intensity',
    description: 'Piercing truth that burns away illusions',
    icon: '⚡',
  },
];

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
export const ToneSelectionCard: React.FC<ToneSelectionCardProps> = ({
  selectedTone,
  onSelect,
}) => {
  return (
    <div className="tone-selection-cards">
      {/* Section header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-light bg-gradient-to-r from-mirror-purple via-mirror-violet to-mirror-blue bg-clip-text text-transparent mb-2">
          Choose Your Reflection Tone
        </h2>
        <p className="text-white/70 text-sm md:text-base">
          How shall the mirror speak to you?
        </p>
      </div>

      {/* Tone cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TONE_OPTIONS.map((tone) => {
          const isSelected = selectedTone === tone.id;

          return (
            <button
              key={tone.id}
              type="button"
              onClick={() => onSelect(tone.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(tone.id);
                }
              }}
              className="text-left w-full focus:outline-none focus:ring-2 focus:ring-mirror-purple focus:ring-offset-2 focus:ring-offset-transparent rounded-xl"
              aria-pressed={isSelected}
              aria-label={`${tone.name}: ${tone.description}`}
            >
              <GlassCard
                elevated={isSelected}
                interactive
                className={cn(
                  'cursor-pointer transition-all duration-300 h-full',
                  isSelected && 'border-mirror-purple/60 bg-mirror-purple/10 shadow-lg shadow-mirror-purple/20'
                )}
              >
                <div className="text-center py-6 px-4 space-y-4">
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
                        ? 'bg-gradient-to-r from-mirror-purple to-mirror-blue bg-clip-text text-transparent'
                        : 'text-white/95'
                    )}
                  >
                    {tone.name}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-white/60 leading-relaxed">
                    {tone.description}
                  </p>

                  {/* Selection indicator */}
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-center gap-2 text-mirror-purple text-sm font-medium"
                    >
                      <svg
                        className="w-4 h-4"
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
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ToneSelectionCard;
