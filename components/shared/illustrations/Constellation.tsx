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
    <div className="relative mx-auto mb-4 h-24 w-32" aria-hidden="true">
      {/* Stars positioned absolutely */}
      <div className="absolute left-4 top-2 h-2 w-2 animate-pulse rounded-full bg-amber-400" />
      <div
        className="absolute right-6 top-8 h-3 w-3 animate-pulse rounded-full bg-purple-400 delay-100"
        style={{ animationDelay: '0.1s' }}
      />
      <div
        className="absolute bottom-4 left-1/2 h-2 w-2 animate-pulse rounded-full bg-white/80 delay-200"
        style={{ animationDelay: '0.2s' }}
      />

      {/* Connecting lines */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 128 96">
        <line x1="16" y1="8" x2="104" y2="32" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        <line x1="104" y1="32" x2="64" y2="80" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      </svg>
    </div>
  );
}
