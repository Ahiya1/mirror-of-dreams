// components/dreams/EvolutionHistory.tsx - Timeline of dream evolutions

'use client';

import { Sparkles, ArrowRight } from 'lucide-react';
import React from 'react';

import { GlassCard } from '@/components/ui/glass';

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
      <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
        <Sparkles className="text-mirror-purple h-5 w-5" />
        Evolution History ({events.length})
      </h3>

      <div className="relative">
        {/* Timeline line */}
        <div className="from-mirror-purple via-mirror-indigo to-mirror-purple/20 absolute bottom-0 left-4 top-0 w-0.5 bg-gradient-to-b" />

        <div className="space-y-6">
          {events.map((event, index) => (
            <div key={event.id} className="relative pl-10">
              {/* Timeline dot */}
              <div className="bg-mirror-purple border-mirror-dark absolute left-2.5 top-2 h-3 w-3 rounded-full border-2" />

              <GlassCard className="p-4">
                {/* Date */}
                <div className="mb-3 text-xs text-white/50">
                  {new Date(event.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>

                {/* Title Change */}
                <div className="mb-2 flex items-center gap-2 text-sm">
                  <span className="text-white/60 line-through">{event.old_title}</span>
                  <ArrowRight className="text-mirror-purple h-4 w-4 flex-shrink-0" />
                  <span className="font-medium text-white">{event.new_title}</span>
                </div>

                {/* Description Change (if any) */}
                {event.old_description !== event.new_description && (
                  <div className="mb-2 text-xs text-white/50">Description updated</div>
                )}

                {/* Evolution Reflection */}
                <div className="mt-3 border-t border-white/10 pt-3">
                  <p className="text-sm italic leading-relaxed text-white/80">
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
