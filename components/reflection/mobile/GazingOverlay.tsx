'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CosmicLoader } from '@/components/ui/glass/CosmicLoader';
import { gazingOverlayVariants, statusTextVariants } from '@/lib/animations/variants';

const STATUS_MESSAGES = [
  'Gazing into the mirror...',
  'Reflecting on your journey...',
  'Crafting your insight...',
  'Weaving wisdom...',
];

const STATUS_INTERVAL = 3000; // ms

interface GazingOverlayProps {
  isVisible: boolean;
}

/**
 * GazingOverlay - Full-screen immersive loading state
 *
 * Shows during reflection submission with:
 * - Cosmic loader animation
 * - Cycling status messages
 * - Breathing scale effect
 */
export function GazingOverlay({ isVisible }: GazingOverlayProps) {
  const [statusIndex, setStatusIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  // Cycle through status messages
  useEffect(() => {
    if (!isVisible) {
      setStatusIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setStatusIndex(prev => (prev + 1) % STATUS_MESSAGES.length);
    }, STATUS_INTERVAL);

    return () => clearInterval(interval);
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={gazingOverlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-mirror-void-deep/98 backdrop-blur-xl"
        >
          {/* Cosmic Loader with breathing animation */}
          <motion.div
            animate={
              prefersReducedMotion
                ? undefined
                : {
                    scale: [1, 1.05, 1],
                  }
            }
            transition={
              prefersReducedMotion
                ? undefined
                : {
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }
            }
          >
            <CosmicLoader size="lg" label="Creating your reflection" />
          </motion.div>

          {/* Status Text */}
          <div className="mt-8 h-16 flex items-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={statusIndex}
                variants={prefersReducedMotion ? undefined : statusTextVariants}
                initial={prefersReducedMotion ? undefined : 'hidden'}
                animate={prefersReducedMotion ? undefined : 'visible'}
                exit={prefersReducedMotion ? undefined : 'exit'}
                className="text-white/90 text-xl font-light text-center px-6"
              >
                {STATUS_MESSAGES[statusIndex]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Subtle helper text */}
          <p className="text-white/50 text-sm mt-2">
            This may take a few moments
          </p>

          {/* Background breathing glow effect */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={
              prefersReducedMotion
                ? undefined
                : {
                    opacity: [0.3, 0.5, 0.3],
                  }
            }
            transition={
              prefersReducedMotion
                ? undefined
                : {
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }
            }
            style={{
              background:
                'radial-gradient(circle at center, rgba(139, 92, 246, 0.15) 0%, transparent 60%)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
