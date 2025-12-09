'use client';

import { AnimatePresence, motion, PanInfo, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useRef, useCallback } from 'react';
import FocusLock from 'react-focus-lock';

import { GlassCard } from './GlassCard';

import type { GlassModalProps } from '@/types/glass-components';

import { useIsMobile } from '@/hooks';
import {
  modalOverlayVariants,
  modalContentVariants,
  mobileModalVariants,
} from '@/lib/animations/variants';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/utils/haptics';

/**
 * GlassModal - Modal dialog with glass overlay
 *
 * Mobile (< 768px):
 * - Full-screen rendering
 * - Slide up from bottom animation
 * - Swipe down to dismiss gesture
 * - Drag handle indicator
 *
 * Desktop:
 * - Centered card with fade animation
 * - Standard modal behavior (unchanged)
 *
 * Features:
 * - Focus trap (Tab navigation contained within modal)
 * - Auto-focus close button on open
 * - Escape key closes modal
 * - Return focus to trigger element on close
 * - WCAG 2.4.3 compliant
 * - 44px+ touch targets for accessibility
 *
 * @param isOpen - Modal open state
 * @param onClose - Close handler
 * @param title - Modal title (optional)
 * @param children - Modal content
 * @param className - Additional Tailwind classes
 * @param disableSwipeDismiss - Disable swipe-to-dismiss on mobile (for forms)
 */
export function GlassModal({
  isOpen,
  onClose,
  title,
  children,
  className,
  disableSwipeDismiss = false,
}: GlassModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();

  // Auto-focus close button when modal opens
  useEffect(() => {
    if (isOpen) {
      // Delay to allow modal animation to complete
      const timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Handle swipe-to-dismiss gesture
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      // Dismiss if dragged down more than 100px OR with high velocity (> 500px/s)
      if (info.offset.y > 100 || info.velocity.y > 500) {
        haptic('light');
        onClose();
      }
    },
    [onClose]
  );

  // Handle close with haptic feedback
  const handleClose = useCallback(() => {
    haptic('light');
    onClose();
  }, [onClose]);

  // Determine if swipe dismiss is enabled
  const swipeEnabled = isMobile && !disableSwipeDismiss && !prefersReducedMotion;

  return (
    <AnimatePresence>
      {isOpen && (
        <FocusLock returnFocus>
          {/* Overlay */}
          <motion.div
            variants={prefersReducedMotion ? undefined : modalOverlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleClose}
            className="bg-mirror-dark/80 fixed inset-0 z-[110] backdrop-blur-glass"
          />

          {/* Modal Container */}
          <div
            className={cn(
              'fixed z-[110]',
              isMobile
                ? 'inset-0' // Full screen container on mobile
                : 'inset-0 flex items-center justify-center p-4' // Centered on desktop
            )}
          >
            <motion.div
              variants={
                prefersReducedMotion
                  ? undefined
                  : isMobile
                    ? mobileModalVariants
                    : modalContentVariants
              }
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className={cn(
                isMobile
                  ? 'flex h-full w-full flex-col' // Full screen on mobile
                  : 'w-full max-w-lg' // Card on desktop
              )}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? 'modal-title' : undefined}
              // Enable swipe-to-dismiss on mobile only (unless disabled)
              drag={swipeEnabled ? 'y' : false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={swipeEnabled ? handleDragEnd : undefined}
            >
              {isMobile ? (
                // Mobile: Full-screen glass container
                <div
                  className={cn(
                    'flex flex-1 flex-col',
                    'bg-mirror-void-deep/95 backdrop-blur-xl',
                    'overflow-hidden',
                    className
                  )}
                >
                  {/* Drag handle indicator (only shown when swipe is enabled) */}
                  {!disableSwipeDismiss && (
                    <div className="flex flex-shrink-0 justify-center py-3">
                      <div className="h-1.5 w-12 rounded-full bg-white/30" />
                    </div>
                  )}

                  {/* Close Button - Mobile (44px+ touch target) */}
                  <button
                    ref={closeButtonRef}
                    onClick={handleClose}
                    className={cn(
                      'absolute z-10',
                      disableSwipeDismiss ? 'top-4' : 'top-2',
                      'right-4',
                      'min-h-[44px] min-w-[44px] p-3',
                      'flex items-center justify-center',
                      'rounded-lg bg-white/10 hover:bg-white/20',
                      'transition-colors',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50'
                    )}
                    aria-label="Close modal"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>

                  {/* Title - Mobile */}
                  {title && (
                    <h2
                      id="modal-title"
                      className={cn(
                        'flex-shrink-0 px-6 pb-4 pr-16 text-2xl font-bold text-white',
                        disableSwipeDismiss ? 'pt-4' : 'pt-0'
                      )}
                    >
                      {title}
                    </h2>
                  )}

                  {/* Scrollable Content - Mobile */}
                  <div className="pb-safe flex-1 overflow-y-auto px-6 pb-6">
                    <div className="text-white/80">{children}</div>
                  </div>
                </div>
              ) : (
                // Desktop: GlassCard (existing behavior unchanged)
                <GlassCard elevated className={className}>
                  {/* Close Button - Desktop (44px+ touch target) */}
                  <button
                    ref={closeButtonRef}
                    onClick={handleClose}
                    className={cn(
                      'absolute right-4 top-4',
                      'min-h-[44px] min-w-[44px] p-3',
                      'flex items-center justify-center',
                      'rounded-lg bg-white/10 hover:bg-white/20',
                      'transition-colors',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50'
                    )}
                    aria-label="Close modal"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>

                  {/* Title - Desktop */}
                  {title && (
                    <h2 id="modal-title" className="mb-4 pr-14 text-2xl font-bold text-white">
                      {title}
                    </h2>
                  )}

                  {/* Content - Desktop */}
                  <div className="text-white/80">{children}</div>
                </GlassCard>
              )}
            </motion.div>
          </div>
        </FocusLock>
      )}
    </AnimatePresence>
  );
}
