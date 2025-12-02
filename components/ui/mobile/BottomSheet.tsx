'use client';

import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, animate, PanInfo } from 'framer-motion';
import FocusLock from 'react-focus-lock';

import { cn } from '@/lib/utils';
import { haptic } from '@/lib/utils/haptics';
import { bottomSheetVariants, bottomSheetBackdropVariants } from '@/lib/animations/variants';

/**
 * Height modes for BottomSheet:
 * - 'auto': Content height (max 90vh)
 * - 'half': 50% of viewport
 * - 'full': 90% of viewport (leaves room for status bar)
 */
type BottomSheetHeight = 'auto' | 'half' | 'full';

interface BottomSheetProps {
  /** Whether the sheet is open */
  isOpen: boolean;
  /** Callback when sheet should close */
  onClose: () => void;
  /** Height mode for the sheet */
  height?: BottomSheetHeight;
  /** Optional title displayed at top with drag handle */
  title?: string;
  /** Content to render inside sheet */
  children: React.ReactNode;
  /** Additional classes for the sheet container */
  className?: string;
}

const HEIGHT_MAP: Record<BottomSheetHeight, string> = {
  auto: 'max-h-[90vh]',
  half: 'h-[50vh]',
  full: 'h-[90vh]',
};

// Dismiss thresholds
const DISMISS_THRESHOLD_DISTANCE = 100; // px - drag distance to trigger dismiss
const DISMISS_THRESHOLD_VELOCITY = 500; // px/s - swipe velocity to trigger dismiss

/**
 * BottomSheet - A mobile-native bottom sheet component with swipe-to-dismiss
 *
 * Features:
 * - Slide up from bottom with spring animation
 * - Drag handle at top for swipe gesture affordance
 * - Swipe down to dismiss (velocity + distance based)
 * - Backdrop overlay with click-to-dismiss
 * - Multiple height modes: 'auto' | 'half' | 'full'
 * - Safe area padding for notched devices
 * - AnimatePresence for enter/exit animations
 * - Focus trap for accessibility
 * - Escape key to dismiss
 * - Prevents body scroll when open
 * - Glass morphism styling matching app aesthetic
 *
 * @example
 * <BottomSheet
 *   isOpen={isSheetOpen}
 *   onClose={() => setIsSheetOpen(false)}
 *   height="half"
 *   title="Select Dream"
 * >
 *   <DreamList />
 * </BottomSheet>
 */
export function BottomSheet({
  isOpen,
  onClose,
  height = 'auto',
  title,
  children,
  className,
}: BottomSheetProps) {
  const y = useMotionValue(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  // Reset y position when sheet opens
  useEffect(() => {
    if (isOpen) {
      y.set(0);
    }
  }, [isOpen, y]);

  // Handle drag end - dismiss or snap back
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const shouldDismiss =
        info.offset.y > DISMISS_THRESHOLD_DISTANCE ||
        info.velocity.y > DISMISS_THRESHOLD_VELOCITY;

      if (shouldDismiss) {
        haptic('light');
        onClose();
      } else {
        // Snap back to original position with spring animation
        animate(y, 0, {
          type: 'spring',
          stiffness: 300,
          damping: 30,
        });
      }
    },
    [onClose, y]
  );

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const originalWidth = document.body.style.width;
      const scrollY = window.scrollY;

      // Lock body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${scrollY}px`;

      return () => {
        // Restore body scroll
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.width = originalWidth;
        document.body.style.top = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Handle Escape key to dismiss
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback(() => {
    haptic('light');
    onClose();
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <FocusLock returnFocus>
          {/* Backdrop */}
          <motion.div
            variants={bottomSheetBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleBackdropClick}
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

              // Height based on mode
              HEIGHT_MAP[height],

              // Flex container for layout
              'flex flex-col',

              // Glass morphism styling
              'bg-mirror-void-deep/95 backdrop-blur-xl',
              'border-t border-white/10',
              'rounded-t-3xl',

              // Safe area padding at bottom for notched devices
              'pb-[env(safe-area-inset-bottom)]',

              // Touch handling
              'touch-none',

              // Overflow
              'overflow-hidden',

              className
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'bottom-sheet-title' : undefined}
          >
            {/* Drag Handle */}
            <div
              ref={dragHandleRef}
              className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
            >
              <div className="w-12 h-1.5 bg-white/30 rounded-full" />
            </div>

            {/* Optional Title */}
            {title && (
              <div className="px-6 pb-4 border-b border-white/10 shrink-0">
                <h2
                  id="bottom-sheet-title"
                  className="text-lg font-semibold text-white"
                >
                  {title}
                </h2>
              </div>
            )}

            {/* Content - scrollable if needed */}
            <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
              {children}
            </div>
          </motion.div>
        </FocusLock>
      )}
    </AnimatePresence>
  );
}
