/**
 * BlankJournal - Illustration for reflections empty state
 * Builder: Builder-3 (Iteration 14)
 *
 * CSS art approach: Open journal with cosmic glow
 * Represents the blank page awaiting first reflection
 */

'use client';

import React from 'react';

export function BlankJournal() {
  return (
    <div className="relative mx-auto mb-4 h-28 w-28" aria-hidden="true">
      {/* Outer glow */}
      <div className="absolute inset-0 animate-pulse rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 blur-2xl" />

      {/* Journal pages */}
      <div className="absolute inset-2 rounded-lg border-2 border-purple-500/30 bg-gradient-to-br from-slate-800/80 to-slate-700/80" />

      {/* Journal lines (pages) */}
      <div className="absolute inset-4 flex flex-col items-center justify-center gap-2 opacity-30">
        <div className="h-0.5 w-12 rounded bg-white/40" />
        <div className="h-0.5 w-10 rounded bg-white/40" />
        <div className="h-0.5 w-12 rounded bg-white/40" />
      </div>

      {/* Center icon */}
      <span className="absolute inset-0 flex items-center justify-center text-4xl">📔</span>
    </div>
  );
}
