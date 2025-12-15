'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { BottomNavigation } from '@/components/navigation';
import { AppNavigation } from '@/components/shared/AppNavigation';
import { EmptyState } from '@/components/shared/EmptyState';
import { CanvasVisual } from '@/components/shared/illustrations/CanvasVisual';
import { MarkdownPreview } from '@/components/shared/MarkdownPreview';
import { FeatureLockOverlay } from '@/components/subscription/FeatureLockOverlay';
import {
  GlassCard,
  GlowButton,
  CosmicLoader,
  GradientText,
  GlowBadge,
} from '@/components/ui/glass';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

type VisualizationStyle = 'achievement' | 'spiral' | 'synthesis';

const visualizationStyles = [
  {
    id: 'achievement' as VisualizationStyle,
    name: 'Achievement Path',
    description: 'Linear journey showing progress like climbing steps or waypoints on a path',
    icon: '🏔️',
  },
  {
    id: 'spiral' as VisualizationStyle,
    name: 'Growth Spiral',
    description: 'Circular growth pattern showing deepening understanding in spiraling cycles',
    icon: '🌀',
  },
  {
    id: 'synthesis' as VisualizationStyle,
    name: 'Synthesis Map',
    description: 'Network of interconnected insights like a constellation or web',
    icon: '🌌',
  },
];

export default function VisualizationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [selectedDreamId, setSelectedDreamId] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<VisualizationStyle>('achievement');
  const [generating, setGenerating] = useState(false);

  // Fetch user's dreams for selection
  const { data: dreamsData, isLoading: dreamsLoading } = trpc.dreams.list.useQuery(
    { status: 'active' },
    { enabled: !!user }
  );

  // Fetch visualizations
  const {
    data: visualizationsData,
    isLoading: visualizationsLoading,
    refetch: refetchVisualizations,
  } = trpc.visualizations.list.useQuery({ page: 1, limit: 20 }, { enabled: !!user });

  // Count total reflections for progress indicator
  const { data: reflectionsData } = trpc.reflections.list.useQuery(
    { page: 1, limit: 1 },
    { enabled: !!user }
  );
  const totalReflections = reflectionsData?.total || 0;
  const minReflections = 4;

  // Mutation
  const generateVisualization = trpc.visualizations.generate.useMutation({
    onSuccess: () => {
      refetchVisualizations();
      setGenerating(false);
      setSelectedDreamId('');
    },
    onError: (error) => {
      // Error will be shown by tRPC error handling
      setGenerating(false);
    },
  });

  const handleGenerate = async () => {
    setGenerating(true);
    generateVisualization.mutate({
      dreamId: selectedDreamId || undefined,
      style: selectedStyle,
    });
  };

  const styleDescriptions = {
    achievement: {
      title: 'Achievement Path',
      description: 'Linear journey showing progress like climbing steps or waypoints on a path',
      icon: '🏔️',
    },
    spiral: {
      title: 'Growth Spiral',
      description: 'Circular growth pattern showing deepening understanding in spiraling cycles',
      icon: '🌀',
    },
    synthesis: {
      title: 'Synthesis Map',
      description: 'Network of interconnected insights like a constellation or web',
      icon: '🌌',
    },
  };

  // Loading state - show if auth OR queries are loading
  if (authLoading || dreamsLoading || visualizationsLoading) {
    return (
      <div className="from-mirror-dark via-mirror-midnight to-mirror-dark flex min-h-screen items-center justify-center bg-gradient-to-br p-8">
        <div className="flex flex-col items-center gap-4">
          <CosmicLoader size="lg" label="Loading visualizations" />
          <p className="text-small text-white/60">Loading visualizations...</p>
        </div>
      </div>
    );
  }

  // Redirect to signin if not authenticated
  if (!user) {
    router.push('/auth/signin');
    return null;
  }

  return (
    <div className="from-mirror-dark via-mirror-midnight to-mirror-dark min-h-screen bg-gradient-to-br px-4 pb-[calc(80px+env(safe-area-inset-bottom))] pt-nav sm:px-8 md:pb-8">
      <AppNavigation currentPage="visualizations" />

      <div className="mx-auto max-w-6xl">
        {/* Page Title */}
        <div className="mb-8">
          <GradientText gradient="cosmic" className="text-h1 mb-2">
            Dream Visualizations
          </GradientText>
          <p className="text-body text-white/70">
            Poetic narrative visualizations of your personal growth journey
          </p>
        </div>

        {/* Generation Controls */}
        <GlassCard elevated className="mb-8">
          <GradientText gradient="primary" className="text-h2 mb-6">
            Create New Visualization
          </GradientText>

          {/* Tier Warning */}
          {user.tier === 'free' && !selectedDreamId ? (
            <FeatureLockOverlay
              featureName="Cross-Dream Visualizations"
              description="Unlock powerful cross-dream analysis that reveals connections and patterns across all your dreams."
              requiredTier="pro"
              benefits={[
                'Synthesis across all dreams',
                'Network of interconnected insights',
                'Growth spiral visualizations',
                'Achievement path mapping',
              ]}
              className="mb-6"
            />
          ) : null}

          <div className="space-y-6">
            {/* Style Selection */}
            <div>
              <GradientText gradient="primary" className="mb-4 text-lg font-medium">
                Choose Visualization Style
              </GradientText>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {visualizationStyles.map((style) => (
                  <GlassCard
                    key={style.id}
                    elevated={selectedStyle === style.id}
                    interactive
                    className={cn(
                      'cursor-pointer text-center',
                      selectedStyle === style.id && 'border-mirror-purple shadow-glow-lg'
                    )}
                    onClick={() => setSelectedStyle(style.id)}
                  >
                    <div className="mb-3 text-4xl">{style.icon}</div>
                    <GradientText
                      gradient={selectedStyle === style.id ? 'cosmic' : 'primary'}
                      className="mb-2 text-base font-bold"
                    >
                      {style.name}
                    </GradientText>
                    <p className="text-xs text-white/60">{style.description}</p>
                  </GlassCard>
                ))}
              </div>
            </div>

            {/* Dream Selection */}
            <div>
              <label className="mb-3 block font-medium text-white/80">
                Select Dream (optional - leave blank for cross-dream)
              </label>
              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <GlowButton
                  variant="secondary"
                  size="md"
                  onClick={() => setSelectedDreamId('')}
                  className={cn(
                    'justify-start text-left',
                    selectedDreamId === '' && 'border-mirror-purple shadow-glow'
                  )}
                  disabled={generating}
                >
                  <div className="flex-1">
                    <div className="text-white/90">All Dreams</div>
                    <div className="text-xs text-white/50">Cross-Dream Analysis</div>
                  </div>
                </GlowButton>
                {dreamsData?.map((dream) => (
                  <GlowButton
                    key={dream.id}
                    variant="secondary"
                    size="md"
                    onClick={() => setSelectedDreamId(dream.id)}
                    className={cn(
                      'justify-start text-left',
                      selectedDreamId === dream.id && 'border-mirror-purple shadow-glow'
                    )}
                    disabled={generating}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-white/90">{dream.title}</div>
                      <div className="text-xs text-white/50">
                        {dream.reflection_count || 0} reflections
                      </div>
                    </div>
                  </GlowButton>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <GlowButton
              variant="primary"
              size="lg"
              onClick={handleGenerate}
              disabled={generating}
              className="w-full"
            >
              {generating ? (
                <span className="flex items-center gap-2">
                  <CosmicLoader size="sm" />
                  Creating Visualization...
                </span>
              ) : (
                'Generate Visualization'
              )}
            </GlowButton>
          </div>
        </GlassCard>

        {/* Visualizations List */}
        <GlassCard elevated>
          <GradientText gradient="primary" className="text-h2 mb-6">
            Your Visualizations
          </GradientText>

          {!visualizationsData || visualizationsData.items.length === 0 ? (
            <EmptyState
              illustration={<CanvasVisual />}
              icon="🎨"
              title="Your story is being written"
              description="After 4 reflections, visualizations bloom and reveal your patterns."
              progress={{
                current: Math.min(totalReflections, minReflections),
                total: minReflections,
                label: 'reflections to unlock visualizations',
              }}
              ctaLabel="Add Another Reflection"
              ctaAction={() => router.push('/reflection')}
              variant="compact"
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {visualizationsData.items.map((viz: any) => (
                <GlassCard
                  key={viz.id}
                  interactive
                  className="cursor-pointer"
                  onClick={() => router.push(`/visualizations/${viz.id}`)}
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {styleDescriptions[viz.style as VisualizationStyle]?.icon}
                      </span>
                      <GradientText gradient="cosmic" className="text-lg font-bold">
                        {styleDescriptions[viz.style as VisualizationStyle]?.title}
                      </GradientText>
                    </div>
                    <GlowBadge variant="info">{viz.dreams ? 'Dream' : 'Cross'}</GlowBadge>
                  </div>

                  <p className="mb-3 text-sm text-white/50">
                    {viz.dreams?.title || 'Cross-Dream'} • {viz.reflection_count} reflections
                  </p>

                  <p className="mb-3 line-clamp-3 text-sm text-white/70">
                    <MarkdownPreview
                      content={viz.narrative || ''}
                      maxLength={150}
                      className="text-white/70"
                    />
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40">
                      {new Date(viz.created_at).toLocaleDateString()}
                    </span>
                    <GlowButton variant="ghost" size="sm">
                      View Full
                    </GlowButton>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Bottom Navigation - visible only on mobile (< 768px) */}
      <BottomNavigation />
    </div>
  );
}
