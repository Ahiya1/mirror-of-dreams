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
  const { data: reportsData, isLoading: reportsLoading, refetch: refetchReports } = trpc.evolution.list.useQuery(
    { page: 1, limit: 20 },
    { enabled: !!user }
  );

  // Check eligibility
  const { data: eligibility, isLoading: eligibilityLoading } = trpc.evolution.checkEligibility.useQuery(undefined, {
    enabled: !!user,
  });

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark p-8">
        <div className="flex flex-col items-center gap-4">
          <CosmicLoader size="lg" label="Loading evolution reports" />
          <p className="text-small text-white/60">Loading your evolution reports...</p>
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
      <AppNavigation currentPage="evolution" />

      <div className="max-w-6xl mx-auto">
        {/* Page Title */}
        <div className="mb-8">
          <GradientText gradient="cosmic" className="text-h1 mb-2">
            Evolution Reports
          </GradientText>
          <p className="text-body text-white/70">
            AI-powered insights into your growth journey across time
          </p>
        </div>

        {/* Generation Controls */}
        <GlassCard elevated className="mb-8">
          <GradientText gradient="primary" className="text-h2 mb-6">
            Generate New Report
          </GradientText>

          {user.tier === 'free' ? (
            <GlassCard
              elevated
              className="border-l-4 border-yellow-500"
            >
              <div className="flex items-center gap-3">
                <GlowBadge variant="warning">
                  !
                </GlowBadge>
                <div className="flex-1">
                  <p className="text-white/90 font-medium">Upgrade to Essential</p>
                  <p className="text-small text-white/70">
                    Evolution reports are available for Essential tier and higher.
                  </p>
                </div>
                <GlowButton
                  variant="primary"
                  size="sm"
                  onClick={() => router.push('/dashboard')}
                >
                  Upgrade Now
                </GlowButton>
              </div>
            </GlassCard>
          ) : (
            <div className="space-y-6">
              {/* Dream-Specific Report */}
              <GlassCard>
                <GradientText gradient="primary" className="text-lg font-medium mb-2">
                  Dream-Specific Report
                </GradientText>
                <p className="text-white/60 text-sm mb-4">
                  Analyze your evolution on a single dream (requires 4+ reflections)
                </p>

                {/* Dream Selection Buttons */}
                <div className="mb-4">
                  <label className="block text-white/80 mb-3 font-medium text-sm">
                    Select Dream
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <GradientText gradient="primary" className="text-lg font-medium mb-2">
                  Cross-Dream Report
                </GradientText>
                <p className="text-white/60 text-sm mb-4">
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
                <GlassCard
                  className="border-l-4 border-blue-500"
                >
                  <div className="flex items-center gap-3">
                    <GlowBadge variant="info">i</GlowBadge>
                    <p className="text-white/80 text-sm">{eligibility.reason}</p>
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
              title="Your Growth Story Awaits"
              description="With 12+ reflections, we can reveal the patterns in your transformation. Keep reflecting!"
              ctaLabel="Reflect Now"
              ctaAction={() => router.push('/reflection')}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {reportsData.reports.map((report: any) => (
                <GlassCard
                  key={report.id}
                  interactive
                  className="cursor-pointer"
                  onClick={() => router.push(`/evolution/${report.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <GradientText gradient="cosmic" className="text-lg font-bold flex-1">
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

                  <p className="text-white/50 text-sm mb-3">
                    {report.reflection_count} reflections analyzed
                  </p>

                  <p className="text-white/70 text-sm line-clamp-2 mb-3">
                    {report.evolution?.substring(0, 200)}...
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
    </div>
  );
}
