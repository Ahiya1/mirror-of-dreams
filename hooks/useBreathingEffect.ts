'use client';

import { useState, useEffect, useCallback } from 'react';

type BreathingPreset = 'card' | 'background' | 'focus' | 'meditation' | 'active';

interface BreathingOptions {
  intensity?: number; // Scale intensity (0.02 = 2% scale change)
  opacityChange?: number; // Opacity change amount
  pauseOnHover?: boolean; // Pause animation on hover
}

interface BreathingReturn {
  animation: string;
  animationPlayState: 'running' | 'paused';
  isHovered: boolean;
  setIsHovered: (hovered: boolean) => void;
}

const presets: Record<BreathingPreset, { duration: number; options: BreathingOptions }> = {
  card: { duration: 4000, options: { intensity: 0.015, opacityChange: 0, pauseOnHover: true } },
  background: {
    duration: 8000,
    options: { intensity: 0.01, opacityChange: 0, pauseOnHover: false },
  },
  focus: { duration: 3000, options: { intensity: 0.03, opacityChange: 0, pauseOnHover: true } },
  meditation: {
    duration: 6000,
    options: { intensity: 0.02, opacityChange: 0.05, pauseOnHover: false },
  },
  active: { duration: 2000, options: { intensity: 0.025, opacityChange: 0, pauseOnHover: true } },
};

/**
 * Hook for creating subtle breathing animations
 * @param durationOrPreset - Animation duration in ms or preset name
 * @param options - Animation options (optional if using preset)
 */
export function useBreathingEffect(
  durationOrPreset: number | BreathingPreset = 4000,
  options: BreathingOptions = {}
): BreathingReturn {
  const [isHovered, setIsHovered] = useState(false);

  // Determine duration and options
  let duration: number;
  let finalOptions: BreathingOptions;

  if (typeof durationOrPreset === 'string') {
    const preset = presets[durationOrPreset];
    duration = preset.duration;
    finalOptions = { ...preset.options, ...options };
  } else {
    duration = durationOrPreset;
    finalOptions = {
      intensity: 0.02,
      opacityChange: 0,
      pauseOnHover: true,
      ...options,
    };
  }

  const { pauseOnHover = true } = finalOptions;

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Return no animation if reduced motion is preferred
  if (prefersReducedMotion || duration <= 0) {
    return {
      animation: 'none',
      animationPlayState: 'paused',
      isHovered,
      setIsHovered,
    };
  }

  const shouldPause = pauseOnHover && isHovered;

  return {
    animation: `breathe ${duration}ms ease-in-out infinite`,
    animationPlayState: shouldPause ? 'paused' : 'running',
    isHovered,
    setIsHovered,
  };
}
