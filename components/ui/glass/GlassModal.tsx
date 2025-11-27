'use client';

import { AnimatePresence, motion } from 'framer-motion';
import FocusLock from 'react-focus-lock';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { modalOverlayVariants, modalContentVariants } from '@/lib/animations/variants';
import { GlassCard } from './GlassCard';
import type { GlassModalProps } from '@/types/glass-components';

/**
 * GlassModal - Modal dialog with glass overlay, animated entrance, and focus trap
 *
 * Features:
 * - Focus trap (Tab navigation contained within modal)
 * - Auto-focus close button on open
 * - Escape key closes modal
 * - Return focus to trigger element on close
 * - WCAG 2.4.3 compliant
 *
 * @param isOpen - Modal open state
 * @param onClose - Close handler
 * @param title - Modal title (optional)
 * @param children - Modal content
 * @param className - Additional Tailwind classes
 */
export function GlassModal({
  isOpen,
  onClose,
  title,
  children,
  className,
}: GlassModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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

  return (
    <AnimatePresence>
      {isOpen && (
        <FocusLock returnFocus>
          {/* Overlay */}
          <motion.div
            variants={modalOverlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 z-50 bg-mirror-dark/80 backdrop-blur-glass"
          />

          {/* Modal Content */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              variants={modalContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg"
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? 'modal-title' : undefined}
            >
              <GlassCard
                elevated
                className={className}
              >
                {/* Close Button */}
                <button
                  ref={closeButtonRef}
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 text-white" />
                </button>

                {/* Title */}
                {title && (
                  <h2 id="modal-title" className="text-2xl font-bold text-white mb-4 pr-10">
                    {title}
                  </h2>
                )}

                {/* Content */}
                <div className="text-white/80">{children}</div>
              </GlassCard>
            </motion.div>
          </div>
        </FocusLock>
      )}
    </AnimatePresence>
  );
}
