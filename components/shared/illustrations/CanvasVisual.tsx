/**
 * CanvasVisual - Illustration for visualizations empty state
 * Builder: Builder-3 (Iteration 14)
 *
 * CSS art approach: Canvas with cosmic paint splashes
 * Represents the blank canvas waiting for patterns to emerge
 */

'use client';

import React from 'react';

export function CanvasVisual() {
  return (
    <div className="relative mx-auto mb-4 h-32 w-32" aria-hidden="true">
      {/* Canvas frame */}
      <div className="absolute inset-0 rounded-lg border-4 border-purple-500/20 bg-gradient-to-br from-slate-800 to-slate-900" />

      {/* Paint splashes (colored dots) */}
      <div className="absolute left-6 top-4 h-4 w-4 animate-pulse rounded-full bg-purple-500/60 blur-sm" />
      <div
        className="absolute right-8 top-8 h-3 w-3 animate-pulse rounded-full bg-amber-400/60 blur-sm delay-100"
        style={{ animationDelay: '0.15s' }}
      />
      <div
        className="absolute bottom-6 left-10 h-3 w-3 animate-pulse rounded-full bg-blue-400/60 blur-sm delay-200"
        style={{ animationDelay: '0.3s' }}
      />
      <div
        className="absolute bottom-8 right-6 h-2 w-2 animate-pulse rounded-full bg-pink-400/60 blur-sm delay-300"
        style={{ animationDelay: '0.45s' }}
      />

      {/* Center icon */}
      <span className="absolute inset-0 flex items-center justify-center text-4xl">🎨</span>
    </div>
  );
}
