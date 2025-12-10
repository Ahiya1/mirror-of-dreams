'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

import type { Dream } from '@/lib/reflection/types';

import { GlowButton } from '@/components/ui/glass';
import { CATEGORY_EMOJI } from '@/lib/reflection/constants';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/utils/haptics';

interface MobileDreamSelectionViewProps {
  dreams: Dream[];
  selectedDreamId: string;
  onDreamSelect: (dream: Dream) => void;
}

/**
 * MobileDreamSelectionView - Full-screen dream selection step for mobile wizard
 *
 * Features:
 * - Large touch targets for dream selection
 * - Category emoji display
 * - Selection indicator with checkmark
 * - Empty state with CTA to create dreams
 * - Haptic feedback on selection
 */
export function MobileDreamSelectionView({
  dreams,
  selectedDreamId,
  onDreamSelect,
}: MobileDreamSelectionViewProps) {
  const router = useRouter();

  const handleDreamClick = (dream: Dream) => {
    haptic('light');
    onDreamSelect(dream);
  };

  return (
    <div className="pb-safe flex h-full flex-col px-6 pt-4">
      <h2 className="mb-8 text-center text-2xl font-light text-white">
        Which dream are you reflecting on?
      </h2>

      <div className="flex-1 space-y-3 overflow-y-auto">
        {dreams.length > 0 ? (
          dreams.map((dream) => {
            const isSelected = dream.id === selectedDreamId;
            const emoji = CATEGORY_EMOJI[dream.category || 'other'] || CATEGORY_EMOJI.other;

            return (
              <motion.button
                key={dream.id}
                onClick={() => handleDreamClick(dream)}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'flex w-full items-center gap-4 p-4',
                  'min-h-[60px] rounded-2xl',
                  'transition-colors duration-200',
                  isSelected
                    ? 'border border-purple-500/50 bg-purple-500/20'
                    : 'border border-white/10 bg-white/5 active:bg-white/10'
                )}
                data-testid={`dream-card-${dream.id}`}
              >
                <span className="text-2xl" role="img" aria-label={dream.category || 'dream'}>
                  {emoji}
                </span>
                <div className="flex-1 text-left">
                  <h3 className="truncate font-medium text-white">{dream.title}</h3>
                  {dream.description && (
                    <p className="mt-0.5 truncate text-sm text-white/60">{dream.description}</p>
                  )}
                </div>
                {isSelected && (
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500"
                    data-testid="selection-indicator"
                  >
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
              </motion.button>
            );
          })
        ) : (
          <div className="py-8 text-center" data-testid="empty-state">
            <p className="mb-6 text-white/70">No active dreams yet.</p>
            <GlowButton variant="primary" size="md" onClick={() => router.push('/dreams')}>
              Create Your First Dream
            </GlowButton>
          </div>
        )}
      </div>
    </div>
  );
}
