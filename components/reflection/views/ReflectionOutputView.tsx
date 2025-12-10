'use client';

import React from 'react';

import { AIResponseRenderer } from '@/components/reflections/AIResponseRenderer';
import { GlassCard, GlowButton, CosmicLoader } from '@/components/ui/glass';

interface ReflectionOutputViewProps {
  content: string;
  isLoading: boolean;
  onCreateNew: () => void;
}

/**
 * Reflection output view displaying AI-generated reflection
 *
 * Features:
 * - Loading state with CosmicLoader
 * - AI response rendering with markdown support
 * - Create new reflection button
 */
export function ReflectionOutputView({
  content,
  isLoading,
  onCreateNew,
}: ReflectionOutputViewProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20">
        <CosmicLoader size="lg" />
        <p className="text-lg text-white/70">Loading reflection...</p>
      </div>
    );
  }

  return (
    <GlassCard elevated className="reflection-card">
      <div className="mirror-surface">
        <div className="reflection-content">
          <h1 className="text-h1 mb-8 bg-gradient-to-r from-[#fbbf24] to-[#9333ea] bg-clip-text text-center font-semibold text-transparent">
            Your Reflection
          </h1>
          <div className="reflection-text">
            <AIResponseRenderer content={content} />
          </div>
          <div className="mt-8 flex justify-center">
            <GlowButton variant="primary" size="lg" onClick={onCreateNew}>
              Create New Reflection
            </GlowButton>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
