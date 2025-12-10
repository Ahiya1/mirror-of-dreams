'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';

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
  variant?: 'simple' | 'elaborate';
  statusText?: string;
}

/**
 * GazingOverlay - Full-screen immersive loading state
 *
 * Supports two variants:
 * - 'simple' (default): Mobile-friendly with CosmicLoader and cycling status
 * - 'elaborate': Desktop mirror portal with animated stars and rings
 *
 * Props:
 * - isVisible: Controls overlay visibility
 * - variant: 'simple' | 'elaborate' (default: 'simple')
 * - statusText: Optional custom status text (disables cycling if provided)
 */
export function GazingOverlay({
  isVisible,
  variant = 'simple',
  statusText: customStatusText,
}: GazingOverlayProps) {
  const [statusIndex, setStatusIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  // Generate star positions only once for elaborate variant
  const starPositions = useMemo(() => {
    if (variant !== 'elaborate') return [];
    return Array.from({ length: 50 }, () => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: 1 + Math.random() * 2,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 3,
    }));
  }, [variant]);

  // Generate particle positions only once for elaborate variant
  const particlePositions = useMemo(() => {
    if (variant !== 'elaborate') return [];
    return Array.from({ length: 15 }, () => ({
      left: `${20 + Math.random() * 60}%`,
      top: `${20 + Math.random() * 60}%`,
      delay: Math.random() * 4,
      duration: 4 + Math.random() * 3,
      xOffset: (Math.random() - 0.5) * 100,
      yOffset: -50 - Math.random() * 50,
    }));
  }, [variant]);

  // Cycle through status messages
  useEffect(() => {
    if (!isVisible || customStatusText) {
      setStatusIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, STATUS_INTERVAL);

    return () => clearInterval(interval);
  }, [isVisible, customStatusText]);

  const displayStatusText = customStatusText || STATUS_MESSAGES[statusIndex];

  // Simple variant (mobile)
  if (variant === 'simple') {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            variants={gazingOverlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-mirror-void-deep/98 fixed inset-0 z-[100] flex flex-col items-center justify-center backdrop-blur-xl"
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
            <div className="mt-8 flex h-16 items-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={customStatusText ? 'custom' : statusIndex}
                  variants={prefersReducedMotion ? undefined : statusTextVariants}
                  initial={prefersReducedMotion ? undefined : 'hidden'}
                  animate={prefersReducedMotion ? undefined : 'visible'}
                  exit={prefersReducedMotion ? undefined : 'exit'}
                  className="px-6 text-center text-xl font-light text-white/90"
                >
                  {displayStatusText}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Subtle helper text */}
            <p className="mt-2 text-sm text-white/50">This may take a few moments</p>

            {/* Background breathing glow effect */}
            <motion.div
              className="pointer-events-none absolute inset-0"
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

  // Elaborate variant (desktop mirror portal)
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.8 }}
          className="gazing-overlay"
        >
          {/* Deep space background with stars */}
          <div className="gazing-cosmos">
            {starPositions.map((star, i) => (
              <motion.div
                key={`star-${i}`}
                className="gazing-star"
                style={{
                  left: star.left,
                  top: star.top,
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                }}
                animate={
                  prefersReducedMotion
                    ? undefined
                    : {
                        opacity: [0.2, 0.8, 0.2],
                        scale: [0.8, 1.2, 0.8],
                      }
                }
                transition={{
                  duration: star.duration,
                  repeat: Infinity,
                  delay: star.delay,
                }}
              />
            ))}

            {/* Floating light particles */}
            {particlePositions.map((particle, i) => (
              <motion.div
                key={`particle-${i}`}
                className="gazing-particle"
                style={{ left: particle.left, top: particle.top }}
                animate={
                  prefersReducedMotion
                    ? undefined
                    : {
                        x: [0, particle.xOffset, 0],
                        y: [0, particle.yOffset, 0],
                        opacity: [0, 0.6, 0],
                        scale: [0, 1, 0],
                      }
                }
                transition={{
                  duration: particle.duration,
                  repeat: Infinity,
                  delay: particle.delay,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>

          {/* Central mirror portal */}
          <div className="gazing-center">
            {/* Outer glow rings */}
            <motion.div
              className="mirror-ring mirror-ring-outer"
              animate={
                prefersReducedMotion
                  ? undefined
                  : {
                      rotate: 360,
                      scale: [1, 1.05, 1],
                    }
              }
              transition={{
                rotate: { duration: 30, repeat: Infinity, ease: 'linear' },
                scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
              }}
            />
            <motion.div
              className="mirror-ring mirror-ring-middle"
              animate={
                prefersReducedMotion
                  ? undefined
                  : {
                      rotate: -360,
                      scale: [1.05, 1, 1.05],
                    }
              }
              transition={{
                rotate: { duration: 25, repeat: Infinity, ease: 'linear' },
                scale: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
              }}
            />

            {/* The mirror itself */}
            <motion.div
              className="mirror-portal"
              animate={
                prefersReducedMotion
                  ? undefined
                  : {
                      scale: [1, 1.02, 1],
                    }
              }
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              {/* Mirror surface shimmer */}
              <div className="mirror-surface-effect" />

              {/* Inner reflection */}
              <motion.div
                className="mirror-reflection-inner"
                animate={
                  prefersReducedMotion
                    ? undefined
                    : {
                        opacity: [0.3, 0.6, 0.3],
                        backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                      }
                }
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Central glow */}
              <motion.div
                className="mirror-glow-center"
                animate={
                  prefersReducedMotion
                    ? undefined
                    : {
                        opacity: [0.4, 0.8, 0.4],
                        scale: [0.8, 1.1, 0.8],
                      }
                }
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>
          </div>

          {/* Status text */}
          <motion.div
            className="gazing-text"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <motion.p
              className="gazing-status"
              animate={
                prefersReducedMotion
                  ? undefined
                  : {
                      opacity: [0.7, 1, 0.7],
                    }
              }
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              {displayStatusText}
            </motion.p>
            <p className="gazing-subtitle">Your reflection is taking form...</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
