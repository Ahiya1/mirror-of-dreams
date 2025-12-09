// app/dreams/[id]/ceremony/page.tsx - Achievement Ceremony display page

'use client';

import { Trophy, Sparkles, Heart, Pen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { AIResponseRenderer } from '@/components/reflections/AIResponseRenderer';
import { AppNavigation } from '@/components/shared/AppNavigation';
import {
  GlassCard,
  GlowButton,
  GradientText,
  CosmicLoader,
  AnimatedBackground,
} from '@/components/ui/glass';
import { trpc } from '@/lib/trpc';

export default function CeremonyPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [personalNote, setPersonalNote] = useState('');
  const [noteError, setNoteError] = useState('');

  // Fetch ceremony
  const {
    data: ceremony,
    isLoading,
    error,
    refetch,
  } = trpc.lifecycle.getCeremony.useQuery({ dreamId: params.id }, { retry: false });

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
      <div className="from-mirror-dark via-mirror-midnight to-mirror-dark min-h-screen bg-gradient-to-br">
        <AnimatedBackground intensity="subtle" />
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
          <CosmicLoader size="lg" label="Loading ceremony..." />
        </div>
      </div>
    );
  }

  if (error || !ceremony) {
    return (
      <div className="from-mirror-dark via-mirror-midnight to-mirror-dark min-h-screen bg-gradient-to-br">
        <AnimatedBackground intensity="subtle" />
        <AppNavigation currentPage="dreams" />
        <div className="flex min-h-[50vh] items-center justify-center">
          <GlassCard className="p-8 text-center" elevated>
            <p className="text-h3 mb-4 text-white">Ceremony not found</p>
            <p className="mb-4 text-white/60">
              This dream may not have an achievement ceremony yet.
            </p>
            <GlowButton variant="ghost" onClick={() => router.push(`/dreams/${params.id}`)}>
              Back to Dream
            </GlowButton>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="from-mirror-dark via-mirror-midnight to-mirror-dark min-h-screen bg-gradient-to-br">
      <AnimatedBackground intensity="medium" />
      <AppNavigation currentPage="dreams" />

      <div className="relative z-10 mx-auto max-w-3xl px-4 pb-8 pt-[calc(var(--nav-height)+var(--demo-banner-height,0px)+1rem)] sm:px-6 lg:px-8">
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
        <div className="mb-8 text-center">
          <div className="from-mirror-gold mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br to-mirror-warning">
            <Trophy className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-h1 mb-2 font-bold">
            <GradientText gradient="cosmic">Achievement Ceremony</GradientText>
          </h1>
          <p className="text-lg text-white/70">{ceremony.dream_title}</p>
          <p className="mt-2 text-sm text-white/50">
            Achieved on{' '}
            {new Date(ceremony.created_at).toLocaleDateString('en-US', {
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
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles className="text-mirror-purple h-5 w-5" />
                  <h2 className="text-h3 font-semibold text-white">Who You Were</h2>
                </div>
                <AIResponseRenderer content={ceremony.who_you_were} />
              </GlassCard>
            )}

            {/* Who You Became */}
            {ceremony.who_you_became && (
              <GlassCard elevated className="border-mirror-success/20">
                <div className="mb-4 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-mirror-success" />
                  <h2 className="text-h3 font-semibold text-white">Who You Became</h2>
                </div>
                <AIResponseRenderer content={ceremony.who_you_became} />
              </GlassCard>
            )}

            {/* Journey Synthesis */}
            <GlassCard elevated className="border-mirror-gold/20">
              <div className="mb-4 flex items-center gap-2">
                <Heart className="text-mirror-gold h-5 w-5" />
                <h2 className="text-h3 font-semibold text-white">Your Journey</h2>
              </div>
              <AIResponseRenderer content={ceremony.journey_synthesis} />
            </GlassCard>
          </div>
        ) : (
          <GlassCard elevated className="py-8 text-center">
            <p className="mb-2 text-white/70">
              This ceremony was created without reflections to analyze.
            </p>
            <p className="text-sm text-white/50">
              Future ceremonies with reflections will include an AI-generated journey synthesis.
            </p>
          </GlassCard>
        )}

        {/* Personal Note Section */}
        <GlassCard elevated className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pen className="text-mirror-purple h-5 w-5" />
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
                className="backdrop-blur-glass-sm focus:border-mirror-purple/60 focus:shadow-glow w-full resize-none rounded-xl border-2 border-white/10 bg-white/5 px-4 py-3 text-white transition-all duration-300 placeholder:text-white/40 focus:outline-none"
              />
              {noteError && <p className="text-sm text-mirror-error">{noteError}</p>}
              <div className="flex justify-end gap-3">
                <GlowButton variant="ghost" size="sm" onClick={() => setIsAddingNote(false)}>
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
              <p className="whitespace-pre-wrap italic leading-relaxed text-white/80">
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
            <p className="italic text-white/50">No closing words added yet.</p>
          )}
        </GlassCard>

        {/* Metadata */}
        <div className="mt-6 text-center text-sm text-white/40">
          Based on {ceremony.reflection_count} reflection
          {ceremony.reflection_count !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
