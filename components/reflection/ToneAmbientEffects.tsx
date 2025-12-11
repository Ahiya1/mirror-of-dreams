'use client';

import React, { useMemo } from 'react';

import type { ToneId } from '@/lib/utils/constants';

interface ToneAmbientEffectsProps {
  /** The currently selected tone */
  selectedTone: ToneId;
}

/**
 * Tone-based Ambient Visual Effects
 *
 * Renders different atmospheric visual elements based on the selected tone:
 * - Fusion: Warm breathing orbs with golden gradient
 * - Gentle: Twinkling star particles
 * - Intense: Swirling purple vortex effects
 *
 * All animations respect prefers-reduced-motion via CSS.
 */
export function ToneAmbientEffects({ selectedTone }: ToneAmbientEffectsProps) {
  // Memoize gentle star positions to prevent repositioning on every render
  const gentleStarPositions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      left: `${10 + Math.random() * 80}%`,
      top: `${10 + Math.random() * 80}%`,
      animationDelay: `${-i * 0.8}s`,
    }));
  }, []);

  return (
    <div className="tone-elements">
      {/* Fusion Tone: Warm breathing orbs */}
      {selectedTone === 'fusion' && (
        <>
          <div
            className="fusion-breath"
            style={{
              left: '20%',
              top: '30%',
              width: 'clamp(220px, 45vw, 300px)',
              height: 'clamp(220px, 45vw, 300px)',
            }}
          />
          <div
            className="fusion-breath"
            style={{
              right: '15%',
              bottom: '25%',
              width: 'clamp(180px, 35vw, 240px)',
              height: 'clamp(180px, 35vw, 240px)',
              animationDelay: '-12s',
            }}
          />
        </>
      )}

      {/* Gentle Tone: Twinkling stars */}
      {selectedTone === 'gentle' && (
        <>
          {gentleStarPositions.map((pos, i) => (
            <div key={i} className="gentle-star" style={pos} />
          ))}
        </>
      )}

      {/* Intense Tone: Swirling vortex */}
      {selectedTone === 'intense' && (
        <>
          <div className="intense-swirl" style={{ left: '15%', top: '20%' }} />
          <div
            className="intense-swirl"
            style={{ right: '10%', bottom: '15%', animationDelay: '-9s' }}
          />
        </>
      )}
    </div>
  );
}
