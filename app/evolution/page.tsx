'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { BottomNavigation } from '@/components/navigation';
import { AppNavigation } from '@/components/shared/AppNavigation';
import { EmptyState } from '@/components/shared/EmptyState';
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

export default function EvolutionPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [selectedDreamId, setSelectedDreamId] = useState<string>('');
  const [generating, setGenerating] = useState(false);

  // Fetch user's dreams for selection
  const { data: dreamsData, isLoading: dreamsLoading } = trpc.dreams.list.useQuery(
    { status: 'active' },
    { enabled: !!user }
  );

  // Fetch evolution reports
  const {
    data: reportsData,
    isLoading: reportsLoading,
    refetch: refetchReports,
  } = trpc.evolution.list.useQuery({ page: 1, limit: 20 }, { enabled: !!user });

  // Check eligibility
  const { data: eligibility, isLoading: eligibilityLoading } =
    trpc.evolution.checkEligibility.useQuery(undefined, {
      enabled: !!user,
    });

  // Count total reflections for progress indicator
  const { data: reflectionsData } = trpc.reflections.list.useQuery(
    { page: 1, limit: 1 },
    { enabled: !!user }
  );
  const totalReflections = reflectionsData?.total || 0;
  const minReflections = 4;

  // Mutations
  const generateDreamEvolution = trpc.evolution.generateDreamEvolution.useMutation({
    onSuccess: () => {
      refetchReports();
      setGenerating(false);
      setSelectedDreamId('');
    },
    onError: (error) => {
      // Error will be shown by tRPC error handling
      setGenerating(false);
    },
  });

  const generateCrossDreamEvolution = trpc.evolution.generateCrossDreamEvolution.useMutation({
    onSuccess: () => {
      refetchReports();
      setGenerating(false);
    },
    onError: (error) => {
      // Error will be shown by tRPC error handling
      setGenerating(false);
    },
  });

  const handleGenerateDreamEvolution = async () => {
    if (!selectedDreamId) {
      return; // UI already disables button if no dream selected
    }
    setGenerating(true);
    generateDreamEvolution.mutate({ dreamId: selectedDreamId });
  };

  const handleGenerateCrossDreamEvolution = async () => {
    setGenerating(true);
    generateCrossDreamEvolution.mutate();
  };

  // Loading state - show if auth OR queries are loading
  if (authLoading || dreamsLoading || reportsLoading || eligibilityLoading) {
    return (
      <div className="from-mirror-dark via-mirror-midnight to-mirror-dark flex min-h-screen items-center justify-center bg-gradient-to-br p-8">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="mb-2 text-5xl">🌱</div>
          <CosmicLoader size="lg" label="Gathering your journey" />
          <div className="space-y-2">
            <p className="text-lg text-white/80">Gathering your journey...</p>
            <p className="text-sm text-white/50">Your patterns are surfacing</p>
          </div>
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
      <AppNavigation currentPage="evolution" />

      <div className="mx-auto max-w-6xl">
        {/* Page Title */}
        <div className="mb-8">
          <GradientText gradient="cosmic" className="text-h1 mb-2">
            Your Journey
          </GradientText>
          <p className="text-body text-white/70">
            See the patterns emerging from your reflections over time
          </p>
        </div>

        {/* Generation Controls */}
        <GlassCard elevated className="mb-8">
          <GradientText gradient="primary" className="text-h2 mb-6">
            Generate New Report
          </GradientText>

          {user.tier === 'free' ? (
            <FeatureLockOverlay
              featureName="Evolution Reports"
              description="Track your growth and transformation over time with AI-powered evolution analysis."
              requiredTier="pro"
              benefits={[
                'Recurring themes and insights',
                'Growth patterns over time',
                'Dream evolution trajectories',
                'Monthly progress reports',
              ]}
            />
          ) : (
            <div className="space-y-6">
              {/* Dream-Specific Report */}
              <GlassCard>
                <GradientText gradient="primary" className="mb-2 text-lg font-medium">
                  Dream-Specific Report
                </GradientText>
                <p className="mb-4 text-sm text-white/60">
                  Analyze your evolution on a single dream (requires 4+ reflections)
                </p>

                {/* Dream Selection Buttons */}
                <div className="mb-4">
                  <label className="mb-3 block text-sm font-medium text-white/80">
                    Select Dream
                  </label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

                <GlowButton
                  variant="primary"
                  size="lg"
                  onClick={handleGenerateDreamEvolution}
                  disabled={generating || !selectedDreamId}
                  className="w-full"
                >
                  {generating ? (
                    <span className="flex items-center gap-2">
                      <CosmicLoader size="sm" />
                      Generating...
                    </span>
                  ) : (
                    'Generate Dream Report'
                  )}
                </GlowButton>
              </GlassCard>

              {/* Cross-Dream Report */}
              <GlassCard>
                <GradientText gradient="primary" className="mb-2 text-lg font-medium">
                  Cross-Dream Report
                </GradientText>
                <p className="mb-4 text-sm text-white/60">
                  Analyze patterns across all your dreams (requires 12+ total reflections)
                </p>

                <GlowButton
                  variant="primary"
                  size="lg"
                  onClick={handleGenerateCrossDreamEvolution}
                  disabled={generating}
                  className="w-full"
                >
                  {generating ? (
                    <span className="flex items-center gap-2">
                      <CosmicLoader size="sm" />
                      Generating...
                    </span>
                  ) : (
                    'Generate Cross-Dream Report'
                  )}
                </GlowButton>
              </GlassCard>

              {/* Eligibility Info */}
              {eligibility && !eligibility.eligible && (
                <GlassCard className="border-l-4 border-blue-500">
                  <div className="flex items-center gap-3">
                    <GlowBadge variant="info">i</GlowBadge>
                    <p className="text-sm text-white/80">{eligibility.reason}</p>
                  </div>
                </GlassCard>
              )}
            </div>
          )}
        </GlassCard>

        {/* Reports List */}
        <GlassCard elevated>
          <GradientText gradient="primary" className="text-h2 mb-6">
            Your Reports
          </GradientText>

          {!reportsData || reportsData.reports.length === 0 ? (
            <EmptyState
              icon="🌱"
              title="Your evolution is brewing"
              description="After 4 reflections, patterns emerge and your journey reveals itself."
              progress={{
                current: Math.min(totalReflections, minReflections),
                total: minReflections,
                label: 'reflections to unlock evolution',
              }}
              ctaLabel="Continue Reflecting"
              ctaAction={() => router.push('/reflection')}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {reportsData.reports.map((report: any) => (
                <GlassCard
                  key={report.id}
                  interactive
                  className="cursor-pointer"
                  onClick={() => router.push(`/evolution/${report.id}`)}
                >
                  <div className="mb-3 flex items-start justify-between">
                    <GradientText gradient="cosmic" className="flex-1 text-lg font-bold">
                      {report.report_category === 'dream-specific' ? (
                        <>{report.dreams?.title || 'Dream Report'}</>
                      ) : (
                        'Cross-Dream Analysis'
                      )}
                    </GradientText>
                    <GlowBadge variant="info">
                      {report.report_category === 'dream-specific' ? 'Dream' : 'Cross'}
                    </GlowBadge>
                  </div>

                  <p className="mb-3 text-sm text-white/50">
                    {report.reflection_count} reflections analyzed
                  </p>

                  <p className="mb-3 line-clamp-2 text-sm text-white/70">
                    <MarkdownPreview
                      content={report.analysis || ''}
                      maxLength={200}
                      className="text-white/70"
                    />
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40">
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                    <GlowButton variant="ghost" size="sm">
                      View Details
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
