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
    <div className="relative w-32 h-32 mx-auto mb-4" aria-hidden="true">
      {/* Canvas frame */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border-4 border-purple-500/20" />

      {/* Paint splashes (colored dots) */}
      <div className="absolute top-4 left-6 w-4 h-4 rounded-full bg-purple-500/60 blur-sm animate-pulse" />
      <div className="absolute top-8 right-8 w-3 h-3 rounded-full bg-amber-400/60 blur-sm animate-pulse delay-100" style={{ animationDelay: '0.15s' }} />
      <div className="absolute bottom-6 left-10 w-3 h-3 rounded-full bg-blue-400/60 blur-sm animate-pulse delay-200" style={{ animationDelay: '0.3s' }} />
      <div className="absolute bottom-8 right-6 w-2 h-2 rounded-full bg-pink-400/60 blur-sm animate-pulse delay-300" style={{ animationDelay: '0.45s' }} />

      {/* Center icon */}
      <span className="absolute inset-0 flex items-center justify-center text-4xl">
        🎨
      </span>
    </div>
  );
}
