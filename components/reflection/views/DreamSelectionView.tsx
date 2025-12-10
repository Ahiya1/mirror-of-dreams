'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';

import type { Dream } from '@/lib/reflection/types';

import { GlassCard, GlowButton } from '@/components/ui/glass';
import { CATEGORY_EMOJI } from '@/lib/reflection/constants';
import { cn } from '@/lib/utils';

interface DreamSelectionViewProps {
  dreams: Dream[];
  selectedDreamId: string;
  onDreamSelect: (dreamId: string) => void;
}

/**
 * Dream selection view for reflection questionnaire
 *
 * Features:
 * - List of active dreams with category emoji
 * - Days left indicator
 * - Selected state with checkmark
 * - Empty state with CTA to create dream
 */
export function DreamSelectionView({
  dreams,
  selectedDreamId,
  onDreamSelect,
}: DreamSelectionViewProps) {
  const router = useRouter();

  return (
    <div className="question-view">
      <h2 className="mb-8 bg-gradient-to-r from-mirror-amethyst via-mirror-amethyst-light to-cosmic-blue bg-clip-text text-center text-2xl font-light text-transparent md:text-3xl">
        Which dream are you reflecting on?
      </h2>

      <div className="dream-selection-list">
        {dreams && dreams.length > 0 ? (
          dreams.map((dream) => {
            const emoji = CATEGORY_EMOJI[dream.category || 'other'] || '\u2B50';
            const isSelected = selectedDreamId === dream.id;

            return (
              <div
                key={dream.id}
                onClick={() => onDreamSelect(dream.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onDreamSelect(dream.id);
                  }
                }}
              >
                <GlassCard
                  elevated={isSelected}
                  interactive
                  className={cn(
                    'cursor-pointer transition-all',
                    isSelected && 'border-mirror-amethyst/60'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <span className="flex-shrink-0 text-4xl">{emoji}</span>
                    <div className="min-w-0 flex-1">
                      <h3 className="mb-1 text-lg font-medium text-white">{dream.title}</h3>
                      {dream.daysLeft !== null && dream.daysLeft !== undefined && (
                        <p className="text-sm text-mirror-amethyst-light">
                          {dream.daysLeft < 0
                            ? `${Math.abs(dream.daysLeft)}d overdue`
                            : dream.daysLeft === 0
                              ? 'Today!'
                              : `${dream.daysLeft}d left`}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex-shrink-0 text-mirror-amethyst"
                      >
                        <Check className="h-6 w-6" />
                      </motion.div>
                    )}
                  </div>
                </GlassCard>
              </div>
            );
          })
        ) : (
          <GlassCard elevated className="text-center">
            <p className="mb-6 text-white/70">No active dreams yet.</p>
            <GlowButton variant="primary" size="md" onClick={() => router.push('/dreams')}>
              Create Your First Dream
            </GlowButton>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
