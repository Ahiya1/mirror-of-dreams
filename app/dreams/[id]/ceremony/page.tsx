// app/dreams/[id]/ceremony/page.tsx - Achievement Ceremony display page

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import {
  GlassCard,
  GlowButton,
  GradientText,
  CosmicLoader,
  AnimatedBackground,
} from '@/components/ui/glass';
import { AppNavigation } from '@/components/shared/AppNavigation';
import { Trophy, Sparkles, Heart, Pen } from 'lucide-react';
import { AIResponseRenderer } from '@/components/reflections/AIResponseRenderer';

export default function CeremonyPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [personalNote, setPersonalNote] = useState('');
  const [noteError, setNoteError] = useState('');

  // Fetch ceremony
  const { data: ceremony, isLoading, error, refetch } = trpc.lifecycle.getCeremony.useQuery(
    { dreamId: params.id },
    { retry: false }
  );

  const updateNoteMutation = trpc.lifecycle.updateCeremonyNote.useMutation({
    onSuccess: () => {
      setIsAddingNote(false);
      refetch();
    },
    onError: (err) => {
      setNoteError(err.message);
    },
  });

  const handleSaveNote = async () => {
    if (personalNote.length > 2000) {
      setNoteError('Note must be 2000 characters or less');
      return;
    }
    await updateNoteMutation.mutateAsync({
      dreamId: params.id,
      personalNote,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark">
        <AnimatedBackground intensity="subtle" />
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <CosmicLoader size="lg" label="Loading ceremony..." />
        </div>
      </div>
    );
  }

  if (error || !ceremony) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark">
        <AnimatedBackground intensity="subtle" />
        <AppNavigation currentPage="dreams" />
        <div className="flex items-center justify-center min-h-[50vh]">
          <GlassCard className="p-8 text-center" elevated>
            <p className="text-h3 text-white mb-4">Ceremony not found</p>
            <p className="text-white/60 mb-4">This dream may not have an achievement ceremony yet.</p>
            <GlowButton
              variant="ghost"
              onClick={() => router.push(`/dreams/${params.id}`)}
            >
              Back to Dream
            </GlowButton>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark">
      <AnimatedBackground intensity="medium" />
      <AppNavigation currentPage="dreams" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-[calc(var(--nav-height)+var(--demo-banner-height,0px)+1rem)] pb-8">
        {/* Back Button */}
        <GlowButton
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/dreams/${params.id}`)}
          className="mb-6"
        >
          Back to Dream
        </GlowButton>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-mirror-gold to-mirror-warning mb-4">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-h1 font-bold mb-2">
            <GradientText gradient="cosmic">Achievement Ceremony</GradientText>
          </h1>
          <p className="text-white/70 text-lg">{ceremony.dream_title}</p>
          <p className="text-white/50 text-sm mt-2">
            Achieved on {new Date(ceremony.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* AI-Generated Synthesis (if available) */}
        {ceremony.journey_synthesis ? (
          <div className="space-y-6">
            {/* Who You Were */}
            {ceremony.who_you_were && (
              <GlassCard elevated className="border-mirror-purple/20">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-mirror-purple" />
                  <h2 className="text-h3 font-semibold text-white">Who You Were</h2>
                </div>
                <AIResponseRenderer content={ceremony.who_you_were} />
              </GlassCard>
            )}

            {/* Who You Became */}
            {ceremony.who_you_became && (
              <GlassCard elevated className="border-mirror-success/20">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-5 h-5 text-mirror-success" />
                  <h2 className="text-h3 font-semibold text-white">Who You Became</h2>
                </div>
                <AIResponseRenderer content={ceremony.who_you_became} />
              </GlassCard>
            )}

            {/* Journey Synthesis */}
            <GlassCard elevated className="border-mirror-gold/20">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-5 h-5 text-mirror-gold" />
                <h2 className="text-h3 font-semibold text-white">Your Journey</h2>
              </div>
              <AIResponseRenderer content={ceremony.journey_synthesis} />
            </GlassCard>
          </div>
        ) : (
          <GlassCard elevated className="text-center py-8">
            <p className="text-white/70 mb-2">
              This ceremony was created without reflections to analyze.
            </p>
            <p className="text-white/50 text-sm">
              Future ceremonies with reflections will include an AI-generated journey synthesis.
            </p>
          </GlassCard>
        )}

        {/* Personal Note Section */}
        <GlassCard elevated className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Pen className="w-5 h-5 text-mirror-purple" />
              <h2 className="text-h3 font-semibold text-white">Your Closing Words</h2>
            </div>
            {!isAddingNote && !ceremony.personal_note && (
              <GlowButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPersonalNote(ceremony.personal_note || '');
                  setIsAddingNote(true);
                }}
              >
                Add Note
              </GlowButton>
            )}
          </div>

          {isAddingNote ? (
            <div className="space-y-4">
              <textarea
                value={personalNote}
                onChange={(e) => setPersonalNote(e.target.value)}
                placeholder="What would you like to say to your future self about this achievement?"
                maxLength={2000}
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-white/5 backdrop-blur-glass-sm border-2 border-white/10 text-white placeholder:text-white/40 transition-all duration-300 focus:outline-none focus:border-mirror-purple/60 focus:shadow-glow resize-none"
              />
              {noteError && (
                <p className="text-sm text-mirror-error">{noteError}</p>
              )}
              <div className="flex gap-3 justify-end">
                <GlowButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingNote(false)}
                >
                  Cancel
                </GlowButton>
                <GlowButton
                  variant="primary"
                  size="sm"
                  onClick={handleSaveNote}
                  disabled={updateNoteMutation.isPending}
                >
                  {updateNoteMutation.isPending ? 'Saving...' : 'Save Note'}
                </GlowButton>
              </div>
            </div>
          ) : ceremony.personal_note ? (
            <div>
              <p className="text-white/80 italic leading-relaxed whitespace-pre-wrap">
                "{ceremony.personal_note}"
              </p>
              <GlowButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPersonalNote(ceremony.personal_note || '');
                  setIsAddingNote(true);
                }}
                className="mt-4"
              >
                Edit Note
              </GlowButton>
            </div>
          ) : (
            <p className="text-white/50 italic">
              No closing words added yet.
            </p>
          )}
        </GlassCard>

        {/* Metadata */}
        <div className="mt-6 text-center text-white/40 text-sm">
          Based on {ceremony.reflection_count} reflection{ceremony.reflection_count !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
