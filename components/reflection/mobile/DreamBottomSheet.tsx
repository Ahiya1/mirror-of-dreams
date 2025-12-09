'use client';

import { motion, AnimatePresence, useMotionValue, animate, PanInfo } from 'framer-motion';
import { Plus, Check, Sparkles } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { bottomSheetVariants, bottomSheetBackdropVariants } from '@/lib/animations/variants';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/utils/haptics';

// Category emoji mapping (using Unicode escape sequences for reliability)
const CATEGORY_EMOJI: Record<string, string> = {
  career: '\uD83D\uDCBC', // Briefcase
  health: '\uD83C\uDFC3', // Runner
  relationships: '\u2764\uFE0F', // Heart
  creativity: '\uD83C\uDFA8', // Art palette
  finance: '\uD83D\uDCB0', // Money bag
  personal: '\u2728', // Sparkles
  spiritual: '\uD83D\uDE4F', // Praying hands
  education: '\uD83D\uDCDA', // Books
  personal_growth: '\uD83C\uDF31', // Seedling
  creative: '\uD83C\uDFA8', // Art palette
  entrepreneurial: '\uD83D\uDE80', // Rocket
  financial: '\uD83D\uDCB0', // Money bag
  other: '\u2B50', // Star
  default: '\uD83C\uDF1F', // Glowing star
};

interface Dream {
  id: string;
  title: string;
  description?: string;
  targetDate?: string | null;
  daysLeft?: number | null;
  category?: string;
}

interface DreamBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  dreams: Dream[];
  selectedDreamId: string | null;
  onSelectDream: (dream: Dream) => void;
  onCreateDream: () => void;
}

const DISMISS_THRESHOLD_DISTANCE = 100; // px
const DISMISS_THRESHOLD_VELOCITY = 500; // px/s

/**
 * DreamBottomSheet - Bottom sheet for dream selection on mobile
 *
 * Features:
 * - Swipe-to-dismiss gesture
 * - Large touch targets (60px+) for each dream
 * - Category emoji display
 * - Selected dream highlighting
 * - "Create Dream" option at bottom
 */
export function DreamBottomSheet({
  isOpen,
  onClose,
  dreams,
  selectedDreamId,
  onSelectDream,
  onCreateDream,
}: DreamBottomSheetProps) {
  const y = useMotionValue(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Reset y position when sheet opens
  useEffect(() => {
    if (isOpen) {
      y.set(0);
    }
  }, [isOpen, y]);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle drag end - dismiss or snap back
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const shouldDismiss =
      info.offset.y > DISMISS_THRESHOLD_DISTANCE || info.velocity.y > DISMISS_THRESHOLD_VELOCITY;

    if (shouldDismiss) {
      onClose();
    } else {
      // Snap back to original position
      animate(y, 0, {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      });
    }
  };

  const handleSelect = (dream: Dream) => {
    haptic('light');
    onSelectDream(dream);
    onClose();
  };

  const handleCreateDream = () => {
    haptic('light');
    onCreateDream();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={bottomSheetBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            variants={bottomSheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            style={{ y }}
            className={cn(
              // Positioning
              'fixed inset-x-0 bottom-0 z-50',

              // Height - half viewport
              'h-[60vh] max-h-[600px]',

              // Styling
              'bg-mirror-void-deep/95 backdrop-blur-xl',
              'border-t border-white/10',
              'rounded-t-3xl',

              // Safe area
              'pb-[env(safe-area-inset-bottom)]',

              // Touch
              'touch-none',

              // Overflow
              'overflow-hidden',

              // Flex layout
              'flex flex-col'
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dream-sheet-title"
          >
            {/* Drag Handle */}
            <div className="flex flex-shrink-0 justify-center pb-2 pt-3">
              <div className="h-1.5 w-12 rounded-full bg-white/30" />
            </div>

            {/* Title */}
            <div className="flex-shrink-0 border-b border-white/10 px-6 pb-4">
              <h2 id="dream-sheet-title" className="text-lg font-semibold text-white">
                Choose a Dream
              </h2>
            </div>

            {/* Dream List - scrollable */}
            <div className="flex-1 space-y-2 overflow-y-auto overscroll-contain px-4 py-4">
              {dreams.length > 0 ? (
                <>
                  {dreams.map((dream) => {
                    const isSelected = dream.id === selectedDreamId;
                    const emoji =
                      CATEGORY_EMOJI[dream.category || 'default'] || CATEGORY_EMOJI.default;

                    return (
                      <motion.button
                        key={dream.id}
                        onClick={() => handleSelect(dream)}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          // Layout
                          'flex w-full items-center gap-4 p-4',
                          // Touch target: minimum 60px height
                          'min-h-[60px]',
                          // Styling
                          'rounded-2xl',
                          'transition-colors duration-200',
                          isSelected
                            ? 'border border-purple-500/50 bg-purple-500/20'
                            : 'border border-white/10 bg-white/5 active:bg-white/10'
                        )}
                      >
                        {/* Emoji */}
                        <span
                          className="flex-shrink-0 text-2xl"
                          role="img"
                          aria-label={dream.category || 'dream'}
                        >
                          {emoji}
                        </span>

                        {/* Dream Info */}
                        <div className="min-w-0 flex-1 text-left">
                          <h3 className="truncate font-medium text-white">{dream.title}</h3>
                          {dream.daysLeft !== null && dream.daysLeft !== undefined && (
                            <p className="mt-0.5 truncate text-sm text-white/60">
                              {dream.daysLeft < 0
                                ? `${Math.abs(dream.daysLeft)} days overdue`
                                : dream.daysLeft === 0
                                  ? 'Today!'
                                  : `${dream.daysLeft} days left`}
                            </p>
                          )}
                        </div>

                        {/* Selection Indicator */}
                        {isSelected && (
                          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-500">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </>
              ) : (
                <div className="py-8 text-center">
                  <p className="mb-4 text-white/70">No dreams yet</p>
                </div>
              )}

              {/* Create New Dream Option */}
              <motion.button
                onClick={handleCreateDream}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'flex w-full items-center gap-4 p-4',
                  'min-h-[60px]',
                  'rounded-2xl',
                  'bg-gradient-to-r from-purple-500/20 to-pink-500/20',
                  'border border-purple-500/30',
                  'active:opacity-80'
                )}
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/30">
                  <Plus className="h-5 w-5 text-purple-400" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-medium text-purple-400">Create New Dream</h3>
                  <p className="text-sm text-white/60">Start fresh with a new aspiration</p>
                </div>
                <Sparkles className="h-5 w-5 flex-shrink-0 text-purple-400/60" />
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
