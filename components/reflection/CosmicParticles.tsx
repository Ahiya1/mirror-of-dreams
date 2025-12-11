'use client';

import React, { useMemo } from 'react';

interface CosmicParticlesProps {
  /** Number of particles to render (default: 20) */
  count?: number;
}

/**
 * Floating Cosmic Particles
 *
 * Renders ambient floating particles that drift upward across the screen.
 * Creates a subtle cosmic atmosphere for the reflection experience.
 *
 * Features:
 * - Randomly positioned particles
 * - Variable animation timing for organic feel
 * - Respects prefers-reduced-motion via CSS
 */
export function CosmicParticles({ count = 20 }: CosmicParticlesProps) {
  // Memoize particle positions to prevent repositioning on every render
  const particlePositions = useMemo(() => {
    return Array.from({ length: count }, () => ({
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 20}s`,
      animationDuration: `${15 + Math.random() * 10}s`,
    }));
  }, [count]);

  return (
    <div className="cosmic-particles">
      {particlePositions.map((pos, i) => (
        <div key={i} className="particle" style={pos} />
      ))}
    </div>
  );
}
