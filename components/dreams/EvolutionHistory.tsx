// components/dreams/EvolutionHistory.tsx - Timeline of dream evolutions

'use client';

import React from 'react';
import { GlassCard } from '@/components/ui/glass';
import { Sparkles, ArrowRight } from 'lucide-react';

interface EvolutionEvent {
  id: string;
  created_at: string;
  old_title: string;
  old_description: string | null;
  new_title: string;
  new_description: string | null;
  evolution_reflection: string;
}

interface EvolutionHistoryProps {
  events: EvolutionEvent[];
  className?: string;
}

export function EvolutionHistory({ events, className = '' }: EvolutionHistoryProps) {
  if (events.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-mirror-purple" />
        Evolution History ({events.length})
      </h3>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-mirror-purple via-mirror-indigo to-mirror-purple/20" />

        <div className="space-y-6">
          {events.map((event, index) => (
            <div key={event.id} className="relative pl-10">
              {/* Timeline dot */}
              <div className="absolute left-2.5 top-2 w-3 h-3 rounded-full bg-mirror-purple border-2 border-mirror-dark" />

              <GlassCard className="p-4">
                {/* Date */}
                <div className="text-xs text-white/50 mb-3">
                  {new Date(event.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>

                {/* Title Change */}
                <div className="flex items-center gap-2 text-sm mb-2">
                  <span className="text-white/60 line-through">{event.old_title}</span>
                  <ArrowRight className="w-4 h-4 text-mirror-purple flex-shrink-0" />
                  <span className="text-white font-medium">{event.new_title}</span>
                </div>

                {/* Description Change (if any) */}
                {(event.old_description !== event.new_description) && (
                  <div className="text-xs text-white/50 mb-2">
                    Description updated
                  </div>
                )}

                {/* Evolution Reflection */}
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-white/80 text-sm italic leading-relaxed">
                    "{event.evolution_reflection}"
                  </p>
                </div>
              </GlassCard>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
