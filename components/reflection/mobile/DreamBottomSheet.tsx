'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, animate, PanInfo } from 'framer-motion';
import { Plus, Check, Sparkles } from 'lucide-react';
import { haptic } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils';
import { bottomSheetVariants, bottomSheetBackdropVariants } from '@/lib/animations/variants';

// Category emoji mapping (using Unicode escape sequences for reliability)
const CATEGORY_EMOJI: Record<string, string> = {
  career: '\uD83D\uDCBC',        // Briefcase
  health: '\uD83C\uDFC3',        // Runner
  relationships: '\u2764\uFE0F', // Heart
  creativity: '\uD83C\uDFA8',    // Art palette
  finance: '\uD83D\uDCB0',       // Money bag
  personal: '\u2728',            // Sparkles
  spiritual: '\uD83D\uDE4F',     // Praying hands
  education: '\uD83D\uDCDA',     // Books
  personal_growth: '\uD83C\uDF31', // Seedling
  creative: '\uD83C\uDFA8',      // Art palette
  entrepreneurial: '\uD83D\uDE80', // Rocket
  financial: '\uD83D\uDCB0',     // Money bag
  other: '\u2B50',               // Star
  default: '\uD83C\uDF1F',       // Glowing star
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
      info.offset.y > DISMISS_THRESHOLD_DISTANCE ||
      info.velocity.y > DISMISS_THRESHOLD_VELOCITY;

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
              'fixed bottom-0 inset-x-0 z-50',

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
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
              <div className="w-12 h-1.5 bg-white/30 rounded-full" />
            </div>

            {/* Title */}
            <div className="px-6 pb-4 border-b border-white/10 flex-shrink-0">
              <h2
                id="dream-sheet-title"
                className="text-lg font-semibold text-white"
              >
                Choose a Dream
              </h2>
            </div>

            {/* Dream List - scrollable */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-2">
              {dreams.length > 0 ? (
                <>
                  {dreams.map((dream) => {
                    const isSelected = dream.id === selectedDreamId;
                    const emoji =
                      CATEGORY_EMOJI[dream.category || 'default'] ||
                      CATEGORY_EMOJI.default;

                    return (
                      <motion.button
                        key={dream.id}
                        onClick={() => handleSelect(dream)}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          // Layout
                          'w-full flex items-center gap-4 p-4',
                          // Touch target: minimum 60px height
                          'min-h-[60px]',
                          // Styling
                          'rounded-2xl',
                          'transition-colors duration-200',
                          isSelected
                            ? 'bg-purple-500/20 border border-purple-500/50'
                            : 'bg-white/5 border border-white/10 active:bg-white/10'
                        )}
                      >
                        {/* Emoji */}
                        <span
                          className="text-2xl flex-shrink-0"
                          role="img"
                          aria-label={dream.category || 'dream'}
                        >
                          {emoji}
                        </span>

                        {/* Dream Info */}
                        <div className="flex-1 text-left min-w-0">
                          <h3 className="text-white font-medium truncate">
                            {dream.title}
                          </h3>
                          {dream.daysLeft !== null && dream.daysLeft !== undefined && (
                            <p className="text-white/60 text-sm truncate mt-0.5">
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
                          <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-white/70 mb-4">No dreams yet</p>
                </div>
              )}

              {/* Create New Dream Option */}
              <motion.button
                onClick={handleCreateDream}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'w-full flex items-center gap-4 p-4',
                  'min-h-[60px]',
                  'rounded-2xl',
                  'bg-gradient-to-r from-purple-500/20 to-pink-500/20',
                  'border border-purple-500/30',
                  'active:opacity-80'
                )}
              >
                <div className="w-10 h-10 bg-purple-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <Plus className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-purple-400 font-medium">Create New Dream</h3>
                  <p className="text-white/60 text-sm">
                    Start fresh with a new aspiration
                  </p>
                </div>
                <Sparkles className="w-5 h-5 text-purple-400/60 flex-shrink-0" />
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
