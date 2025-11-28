/**
 * CosmicSeed - Illustration for "no dreams" empty state
 * Builder: Builder-3 (Iteration 14)
 *
 * CSS art approach: Gradient orbs with pulsing animation
 * Represents a dream seed ready to be planted
 */

'use client';

import React from 'react';

export function CosmicSeed() {
  return (
    <div className="relative w-24 h-24 mx-auto" aria-hidden="true">
      {/* Outer glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/30 to-amber-500/30 animate-pulse blur-xl" />

      {/* Inner orb */}
      <div className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-600 to-amber-500 opacity-80" />

      {/* Center icon */}
      <span className="absolute inset-0 flex items-center justify-center text-3xl">
        🌱
      </span>
    </div>
  );
}
