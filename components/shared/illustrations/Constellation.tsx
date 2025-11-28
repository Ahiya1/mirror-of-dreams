/**
 * Constellation - Illustration for dreams list empty state
 * Builder: Builder-3 (Iteration 14)
 *
 * CSS art approach: Stars connected by lines forming a constellation
 * Represents dreams as stars waiting to be connected
 */

'use client';

import React from 'react';

export function Constellation() {
  return (
    <div className="relative w-32 h-24 mx-auto mb-4" aria-hidden="true">
      {/* Stars positioned absolutely */}
      <div className="absolute top-2 left-4 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
      <div className="absolute top-8 right-6 w-3 h-3 rounded-full bg-purple-400 animate-pulse delay-100" style={{ animationDelay: '0.1s' }} />
      <div className="absolute bottom-4 left-1/2 w-2 h-2 rounded-full bg-white/80 animate-pulse delay-200" style={{ animationDelay: '0.2s' }} />

      {/* Connecting lines */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 128 96">
        <line x1="16" y1="8" x2="104" y2="32" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        <line x1="104" y1="32" x2="64" y2="80" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      </svg>
    </div>
  );
}
