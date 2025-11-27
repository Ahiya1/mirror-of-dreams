'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import {
  GlassCard,
  GlowButton,
  CosmicLoader,
  GradientText,
  GlowBadge,
} from '@/components/ui/glass';
import { AppNavigation } from '@/components/shared/AppNavigation';
import { EmptyState } from '@/components/shared/EmptyState';
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
  const { data: dreamsData } = trpc.dreams.list.useQuery(
    { status: 'active' },
    { enabled: !!user }
  );

  // Fetch visualizations
  const { data: visualizationsData, refetch: refetchVisualizations } = trpc.visualizations.list.useQuery(
    { page: 1, limit: 20 },
    { enabled: !!user }
  );

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

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark p-8">
        <div className="flex flex-col items-center gap-4">
          <CosmicLoader size="lg" />
          <p className="text-white/60 text-sm">Loading visualizations...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark pt-nav px-4 sm:px-8 pb-8">
      <AppNavigation currentPage="visualizations" />

      <div className="max-w-6xl mx-auto">
        {/* Page Title */}
        <div className="mb-8">
          <GradientText gradient="cosmic" className="text-3xl sm:text-4xl font-bold mb-2">
            Dream Visualizations
          </GradientText>
          <p className="text-white/70">
            Poetic narrative visualizations of your personal growth journey
          </p>
        </div>

        {/* Generation Controls */}
        <GlassCard elevated className="mb-8">
          <GradientText gradient="primary" className="text-2xl font-bold mb-6">
            Create New Visualization
          </GradientText>

          {/* Tier Warning */}
          {user.tier === 'free' && !selectedDreamId ? (
            <GlassCard
              className="border-l-4 border-yellow-500 mb-6"
            >
              <div className="flex items-center gap-3">
                <GlowBadge variant="warning">
                  !
                </GlowBadge>
                <div className="flex-1">
                  <p className="text-white/90 font-medium text-sm">
                    Cross-dream visualizations require Essential tier or higher. You can still create dream-specific visualizations.
                  </p>
                </div>
              </div>
            </GlassCard>
          ) : null}

          <div className="space-y-6">
            {/* Style Selection */}
            <div>
              <GradientText gradient="primary" className="text-lg font-medium mb-4">
                Choose Visualization Style
              </GradientText>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    <div className="text-4xl mb-3">{style.icon}</div>
                    <GradientText
                      gradient={selectedStyle === style.id ? 'cosmic' : 'primary'}
                      className="text-base font-bold mb-2"
                    >
                      {style.name}
                    </GradientText>
                    <p className="text-white/60 text-xs">
                      {style.description}
                    </p>
                  </GlassCard>
                ))}
              </div>
            </div>

            {/* Dream Selection */}
            <div>
              <label className="block text-white/80 mb-3 font-medium">
                Select Dream (optional - leave blank for cross-dream)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <GlowButton
                  variant="secondary"
                  size="md"
                  onClick={() => setSelectedDreamId('')}
                  className={cn(
                    'text-left justify-start',
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
                      'text-left justify-start',
                      selectedDreamId === dream.id && 'border-mirror-purple shadow-glow'
                    )}
                    disabled={generating}
                  >
                    <div className="flex-1 min-w-0">
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
          <GradientText gradient="primary" className="text-2xl font-bold mb-6">
            Your Visualizations
          </GradientText>

          {!visualizationsData || visualizationsData.items.length === 0 ? (
            <EmptyState
              icon=""
              title="No visualizations yet"
              description="Create your first visualization to experience your dream as already achieved."
              ctaLabel="Generate First Visualization"
              ctaAction={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {visualizationsData.items.map((viz: any) => (
                <GlassCard
                  key={viz.id}
                  interactive
                  className="cursor-pointer"
                  onClick={() => router.push(`/visualizations/${viz.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {styleDescriptions[viz.style as VisualizationStyle]?.icon}
                      </span>
                      <GradientText gradient="cosmic" className="text-lg font-bold">
                        {styleDescriptions[viz.style as VisualizationStyle]?.title}
                      </GradientText>
                    </div>
                    <GlowBadge variant="info">
                      {viz.dreams ? 'Dream' : 'Cross'}
                    </GlowBadge>
                  </div>

                  <p className="text-white/50 text-sm mb-3">
                    {viz.dreams?.title || 'Cross-Dream'} • {viz.reflection_count} reflections
                  </p>

                  <p className="text-white/70 text-sm line-clamp-3 mb-3">
                    {viz.narrative?.substring(0, 150)}...
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
    </div>
  );
}
