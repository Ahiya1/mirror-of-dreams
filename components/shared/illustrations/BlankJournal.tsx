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
    <div className="relative w-28 h-28 mx-auto mb-4" aria-hidden="true">
      {/* Outer glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg blur-2xl animate-pulse" />

      {/* Journal pages */}
      <div className="absolute inset-2 bg-gradient-to-br from-slate-800/80 to-slate-700/80 rounded-lg border-2 border-purple-500/30" />

      {/* Journal lines (pages) */}
      <div className="absolute inset-4 flex flex-col gap-2 justify-center items-center opacity-30">
        <div className="w-12 h-0.5 bg-white/40 rounded" />
        <div className="w-10 h-0.5 bg-white/40 rounded" />
        <div className="w-12 h-0.5 bg-white/40 rounded" />
      </div>

      {/* Center icon */}
      <span className="absolute inset-0 flex items-center justify-center text-4xl">
        📔
      </span>
    </div>
  );
}
