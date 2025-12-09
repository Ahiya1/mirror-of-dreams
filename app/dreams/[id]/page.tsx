// app/dreams/[id]/page.tsx - Dream detail page with Evolution & Visualization generation

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
import { EvolutionModal } from '@/components/dreams/EvolutionModal';
import { EvolutionHistory } from '@/components/dreams/EvolutionHistory';

const MIN_REFLECTIONS_FOR_GENERATION = 4;

export default function DreamDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isGeneratingEvolution, setIsGeneratingEvolution] = useState(false);
  const [isGeneratingVisualization, setIsGeneratingVisualization] = useState(false);
  const [isEvolutionModalOpen, setIsEvolutionModalOpen] = useState(false);

  // Fetch dream
  const { data: dream, isLoading, refetch } = trpc.dreams.get.useQuery({ id: params.id });

  // Fetch reflections for this dream
  const { data: reflections } = trpc.reflections.list.useQuery({
    page: 1,
    limit: 100,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  // Fetch evolution history
  const { data: evolutionHistory } = trpc.lifecycle.getEvolutionHistory.useQuery(
    { dreamId: params.id },
    { enabled: !!dream && dream.status === 'active' }
  );

  // Filter reflections by dreamId (camelCase from API response)
  const dreamReflections = reflections?.items?.filter(
    (r: any) => r.dreamId === params.id
  ) || [];

  const reflectionCount = dreamReflections.length;
  const isEligibleForGeneration = reflectionCount >= MIN_REFLECTIONS_FOR_GENERATION;
  const remainingReflections = Math.max(0, MIN_REFLECTIONS_FOR_GENERATION - reflectionCount);

  const deleteDream = trpc.dreams.delete.useMutation();
  const updateStatus = trpc.dreams.updateStatus.useMutation();

  // Evolution generation mutation
  const generateEvolution = trpc.evolution.generateDreamEvolution.useMutation({
    onSuccess: (data) => {
      setIsGeneratingEvolution(false);
      router.push(`/evolution/${data.evolutionId}`);
    },
    onError: (error) => {
      setIsGeneratingEvolution(false);
      // Error will be shown by tRPC error handling
    },
  });

  // Visualization generation mutation
  const generateVisualization = trpc.visualizations.generate.useMutation({
    onSuccess: (data) => {
      setIsGeneratingVisualization(false);
      router.push(`/visualizations/${data.visualization.id}`);
    },
    onError: (error) => {
      setIsGeneratingVisualization(false);
      // Error will be shown by tRPC error handling
    },
  });

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this dream? This cannot be undone.')) {
      return;
    }

    try {
      await deleteDream.mutateAsync({ id: params.id });
      router.push('/dreams');
    } catch (error: any) {
      // Error will be shown by tRPC error handling
    }
  };

  const handleStatusChange = async (status: 'active' | 'achieved' | 'archived' | 'released') => {
    try {
      await updateStatus.mutateAsync({ id: params.id, status });
      refetch();
    } catch (error: any) {
      // Error will be shown by tRPC error handling
    }
  };

  const handleGenerateEvolution = () => {
    setIsGeneratingEvolution(true);
    generateEvolution.mutate({ dreamId: params.id });
  };

  const handleGenerateVisualization = () => {
    setIsGeneratingVisualization(true);
    generateVisualization.mutate({
      dreamId: params.id,
      style: 'achievement',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark">
        <AnimatedBackground intensity="subtle" />
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <CosmicLoader size="lg" label="Loading dream..." />
          <p className="text-body text-white/80">Loading dream...</p>
        </div>
      </div>
    );
  }

  if (!dream) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark">
        <AnimatedBackground intensity="subtle" />
        <div className="flex items-center justify-center min-h-[50vh]">
          <GlassCard className="p-8 text-center" elevated>
            <p className="text-h3 text-white">Dream not found</p>
            <GlowButton
              variant="ghost"
              onClick={() => router.push('/dreams')}
              className="mt-4"
            >
              Back to Dreams
            </GlowButton>
          </GlassCard>
        </div>
      </div>
    );
  }

  const statusEmojiMap: Record<string, string> = {
    active: '\u2728',
    achieved: '\uD83C\uDF89',
    archived: '\uD83D\uDCE6',
    released: '\uD83D\uDD4A\uFE0F',
  };
  const statusEmoji = statusEmojiMap[dream.status as string] || '\u2728';

  const categoryEmojiMap: Record<string, string> = {
    health: '\uD83C\uDFC3',
    career: '\uD83D\uDCBC',
    relationships: '\u2764\uFE0F',
    financial: '\uD83D\uDCB0',
    personal_growth: '\uD83C\uDF31',
    creative: '\uD83C\uDFA8',
    spiritual: '\uD83D\uDE4F',
    entrepreneurial: '\uD83D\uDE80',
    educational: '\uD83D\uDCDA',
    other: '\u2B50',
  };
  const categoryEmoji = categoryEmojiMap[dream.category as string] || '\u2B50';

  // Status badge styles using design system tokens
  const statusStyles: Record<string, string> = {
    active: 'bg-mirror-purple/20 text-mirror-purple-light border-mirror-purple/30',
    achieved: 'bg-mirror-success/20 text-mirror-success border-mirror-success/30',
    archived: 'bg-white/10 text-white/60 border-white/20',
    released: 'bg-mirror-info/20 text-mirror-info border-mirror-info/30',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark">
      <AnimatedBackground intensity="subtle" />
      <AppNavigation currentPage="dreams" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-[calc(var(--nav-height)+var(--demo-banner-height,0px)+1rem)] pb-8">
        {/* Back Button */}
        <GlowButton
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dreams')}
          className="mb-6"
        >
          Back to Dreams
        </GlowButton>

        {/* Header Card */}
        <GlassCard className="mb-6" elevated>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            {/* Left: Title & Meta */}
            <div className="flex gap-4 flex-1">
              <div className="text-5xl">{categoryEmoji}</div>
              <div>
                <h1 className="text-h2 font-bold text-white mb-2">{dream.title}</h1>
                <div className="flex flex-wrap gap-3 items-center">
                  <span className={`px-3 py-1 rounded-full text-body-sm font-medium border ${statusStyles[dream.status as string] || statusStyles.active}`}>
                    {statusEmoji} {dream.status}
                  </span>
                  {dream.daysLeft !== null && dream.daysLeft !== undefined && (
                    <span className="text-body-sm text-white/70">
                      {dream.daysLeft < 0
                        ? `${Math.abs(dream.daysLeft)} days overdue`
                        : dream.daysLeft === 0
                        ? 'Today!'
                        : `${dream.daysLeft} days left`}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex gap-3 sm:flex-shrink-0">
              {dream.status === 'active' && (
                <GlowButton
                  variant="secondary"
                  onClick={() => setIsEvolutionModalOpen(true)}
                >
                  Evolve Dream
                </GlowButton>
              )}
              <GlowButton
                variant="primary"
                onClick={() => router.push(`/reflection?dreamId=${params.id}`)}
              >
                Reflect
              </GlowButton>
              <GlowButton
                variant="danger"
                onClick={handleDelete}
              >
                Delete
              </GlowButton>
            </div>
          </div>
        </GlassCard>

        {/* Description */}
        {dream.description && (
          <GlassCard className="mb-6">
            <h2 className="text-h3 font-semibold text-white mb-3">Description</h2>
            <p className="text-body text-white/80 leading-relaxed">{dream.description}</p>
          </GlassCard>
        )}

        {/* Evolution Report Generation Section */}
        <GlassCard className="mb-6 border-mirror-purple/20" elevated>
          <h2 className="text-h3 font-semibold mb-4">
            <GradientText gradient="cosmic">
              Evolution Report
            </GradientText>
          </h2>

          {isGeneratingEvolution ? (
            <div className="flex flex-col items-center py-8 gap-6">
              <CosmicLoader size="lg" label="Generating evolution report..." />
              <div className="text-center space-y-2">
                <p className="text-body text-mirror-purple-light font-medium">
                  Analyzing your journey across time...
                </p>
                <p className="text-body-sm text-mirror-purple/80">
                  This takes approximately 30-45 seconds
                </p>
                <p className="text-body-sm text-white/60 italic">
                  Don't close this tab
                </p>
              </div>
            </div>
          ) : isEligibleForGeneration ? (
            <div className="space-y-4">
              <p className="text-body text-white/90">
                You have {reflectionCount} reflections. Generate an evolution report to see your growth patterns.
              </p>
              <GlowButton
                variant="cosmic"
                size="lg"
                onClick={handleGenerateEvolution}
                className="w-full"
              >
                Generate Evolution Report
              </GlowButton>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-body text-mirror-purple-light">
                You have {reflectionCount} reflection{reflectionCount !== 1 ? 's' : ''}.
                Create {remainingReflections} more to unlock evolution reports.
              </p>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-mirror-purple via-mirror-indigo to-mirror-violet rounded-full transition-all duration-500"
                  style={{ width: `${(reflectionCount / MIN_REFLECTIONS_FOR_GENERATION) * 100}%` }}
                />
              </div>
              <p className="text-body-sm text-white/70 text-center">
                {reflectionCount} of {MIN_REFLECTIONS_FOR_GENERATION} reflections needed
              </p>
            </div>
          )}
        </GlassCard>

        {/* Visualization Generation Section */}
        <GlassCard className="mb-6 border-mirror-purple/20" elevated>
          <h2 className="text-h3 font-semibold mb-4">
            <GradientText gradient="cosmic">
              Visualization
            </GradientText>
          </h2>

          {isGeneratingVisualization ? (
            <div className="flex flex-col items-center py-8 gap-6">
              <CosmicLoader size="lg" label="Generating visualization..." />
              <div className="text-center space-y-2">
                <p className="text-body text-mirror-purple-light font-medium">
                  Crafting your achievement narrative...
                </p>
                <p className="text-body-sm text-mirror-purple/80">
                  This takes approximately 25-35 seconds
                </p>
                <p className="text-body-sm text-white/60 italic">
                  Don't close this tab
                </p>
              </div>
            </div>
          ) : isEligibleForGeneration ? (
            <div className="space-y-4">
              <p className="text-body text-white/90">
                Generate a visualization to experience your dream as already achieved.
              </p>
              <GlowButton
                variant="cosmic"
                size="lg"
                onClick={handleGenerateVisualization}
                className="w-full"
              >
                Generate Visualization
              </GlowButton>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-body text-mirror-purple-light">
                You have {reflectionCount} reflection{reflectionCount !== 1 ? 's' : ''}.
                Create {remainingReflections} more to unlock visualizations.
              </p>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-mirror-purple via-mirror-indigo to-mirror-violet rounded-full transition-all duration-500"
                  style={{ width: `${(reflectionCount / MIN_REFLECTIONS_FOR_GENERATION) * 100}%` }}
                />
              </div>
              <p className="text-body-sm text-white/70 text-center">
                {reflectionCount} of {MIN_REFLECTIONS_FOR_GENERATION} reflections needed
              </p>
            </div>
          )}
        </GlassCard>

        {/* Status Actions */}
        <GlassCard className="mb-6">
          <h2 className="text-h3 font-semibold text-white mb-4">Update Status</h2>
          <div className="flex flex-wrap gap-3">
            <GlowButton
              variant={dream.status === 'active' ? 'primary' : 'ghost'}
              onClick={() => handleStatusChange('active')}
              disabled={dream.status === 'active'}
            >
              Active
            </GlowButton>
            <GlowButton
              variant={dream.status === 'achieved' ? 'success' : 'ghost'}
              onClick={() => {
                if (dream.status === 'achieved') {
                  router.push(`/dreams/${params.id}/ceremony`);
                } else if (dream.status === 'active') {
                  router.push(`/dreams/${params.id}/ceremony`);
                }
              }}
              disabled={dream.status !== 'active' && dream.status !== 'achieved'}
            >
              {dream.status === 'achieved' ? 'View Ceremony' : 'Mark Achieved'}
            </GlowButton>
            <GlowButton
              variant={dream.status === 'archived' ? 'secondary' : 'ghost'}
              onClick={() => handleStatusChange('archived')}
              disabled={dream.status === 'archived'}
            >
              Archive
            </GlowButton>
            <GlowButton
              variant={dream.status === 'released' ? 'info' : 'ghost'}
              onClick={() => {
                if (dream.status === 'released') {
                  router.push(`/dreams/${params.id}/ritual`);
                } else if (dream.status === 'active') {
                  router.push(`/dreams/${params.id}/ritual`);
                }
              }}
              disabled={dream.status !== 'active' && dream.status !== 'released'}
            >
              {dream.status === 'released' ? 'View Ritual' : 'Release Dream'}
            </GlowButton>
          </div>
        </GlassCard>

        {/* Evolution History */}
        {evolutionHistory && evolutionHistory.events.length > 0 && (
          <GlassCard className="mb-6">
            <EvolutionHistory events={evolutionHistory.events} />
          </GlassCard>
        )}

        {/* Reflections */}
        <GlassCard>
          <h2 className="text-h3 font-semibold text-white mb-4">
            Reflections ({reflectionCount})
          </h2>
          {dreamReflections.length > 0 ? (
            <div className="space-y-4">
              {dreamReflections.map((reflection: any) => (
                <GlassCard
                  key={reflection.id}
                  interactive
                  onClick={() => router.push(`/reflections/${reflection.id}`)}
                  className="p-4"
                >
                  <div className="text-body-sm text-white/60 mb-2">
                    {new Date(reflection.created_at).toLocaleDateString()}
                  </div>
                  <div className="text-body text-white/90 mb-2 line-clamp-2">
                    {reflection.dream?.substring(0, 150)}...
                  </div>
                  <div className="flex gap-4 text-body-sm">
                    <span className="text-mirror-purple-light capitalize">{reflection.tone}</span>
                    <span className="text-white/60">{reflection.word_count} words</span>
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-body text-white/60 mb-4">
                No reflections yet. Create your first reflection for this dream!
              </p>
              <GlowButton
                variant="primary"
                onClick={() => router.push(`/reflection?dreamId=${params.id}`)}
              >
                Create First Reflection
              </GlowButton>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Evolution Modal */}
      {dream && dream.status === 'active' && (
        <EvolutionModal
          isOpen={isEvolutionModalOpen}
          onClose={() => setIsEvolutionModalOpen(false)}
          onSuccess={() => refetch()}
          dream={{
            id: dream.id,
            title: dream.title,
            description: dream.description,
            target_date: dream.target_date,
            category: dream.category,
          }}
        />
      )}
    </div>
  );
}
