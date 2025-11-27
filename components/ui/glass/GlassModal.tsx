'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { modalOverlayVariants, modalContentVariants } from '@/lib/animations/variants';
import { GlassCard } from './GlassCard';
import type { GlassModalProps } from '@/types/glass-components';

/**
 * GlassModal - Modal dialog with glass overlay and animated entrance
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
  return (
    <AnimatePresence>
      {isOpen && (
        <>
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
            >
              <GlassCard
                elevated
                className={className}
              >
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 text-white" />
                </button>

                {/* Title */}
                {title && (
                  <h2 className="text-2xl font-bold text-white mb-4 pr-10">
                    {title}
                  </h2>
                )}

                {/* Content */}
                <div className="text-white/80">{children}</div>
              </GlassCard>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
