// app/dreams/page.tsx - Dreams list page with glass components

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { DreamCard } from '@/components/dreams/DreamCard';
import { CreateDreamModal } from '@/components/dreams/CreateDreamModal';
import { CosmicLoader, GlowButton, GlassCard, GradientText } from '@/components/ui/glass';
import { AppNavigation } from '@/components/shared/AppNavigation';
import { EmptyState } from '@/components/shared/EmptyState';

export default function DreamsPage() {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'active' | 'achieved' | 'archived' | 'released' | undefined>('active');

  // Fetch dreams
  const { data: dreams, isLoading, refetch } = trpc.dreams.list.useQuery({
    status: statusFilter,
    includeStats: true,
  });

  // Fetch limits
  const { data: limits } = trpc.dreams.getLimits.useQuery();

  const handleCreateSuccess = () => {
    refetch();
  };

  const handleReflect = (dreamId: string) => {
    router.push(`/reflection?dreamId=${dreamId}`);
  };

  const handleEvolution = (dreamId: string) => {
    router.push(`/evolution?dreamId=${dreamId}`);
  };

  const handleVisualize = (dreamId: string) => {
    router.push(`/visualizations?dreamId=${dreamId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark p-8">
        <div className="flex flex-col items-center gap-4">
          <CosmicLoader size="lg" />
          <p className="text-small text-white/60">Loading your dreams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark pt-nav px-4 sm:px-8 pb-8">
      <AppNavigation currentPage="dreams" />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <GlassCard elevated className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <GradientText gradient="cosmic" className="text-h1 mb-2">
                Your Dreams
              </GradientText>
              <p className="text-body text-white/70">
                Track and reflect on your life's aspirations
              </p>
            </div>
            <GlowButton
              variant="primary"
              size="md"
              onClick={() => setIsCreateModalOpen(true)}
              disabled={limits && !limits.canCreate}
              className="w-full sm:w-auto whitespace-nowrap"
            >
              + Create Dream
            </GlowButton>
          </div>
        </GlassCard>

        {/* Limits Info */}
        {limits && (
          <GlassCard
            className="mb-6 border-l-4 border-mirror-purple/60"
          >
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <span className="text-white/90 font-medium">
                {limits.dreamsUsed} / {limits.dreamsLimit === 999999 ? '∞' : limits.dreamsLimit} dreams
              </span>
              {!limits.canCreate && (
                <span className="text-small text-mirror-warning">
                  Upgrade to create more dreams
                </span>
              )}
            </div>
          </GlassCard>
        )}

        {/* Status Filter */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <GlowButton
            variant={statusFilter === 'active' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setStatusFilter('active')}
          >
            Active
          </GlowButton>
          <GlowButton
            variant={statusFilter === 'achieved' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setStatusFilter('achieved')}
          >
            Achieved
          </GlowButton>
          <GlowButton
            variant={statusFilter === 'archived' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setStatusFilter('archived')}
          >
            Archived
          </GlowButton>
          <GlowButton
            variant={statusFilter === undefined ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setStatusFilter(undefined)}
          >
            All
          </GlowButton>
        </div>

        {/* Dreams Grid */}
        {dreams && dreams.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {dreams.map((dream: any) => (
              <DreamCard
                key={dream.id}
                id={dream.id}
                title={dream.title}
                description={dream.description}
                targetDate={dream.target_date}
                daysLeft={dream.daysLeft}
                status={dream.status}
                category={dream.category}
                reflectionCount={dream.reflectionCount || 0}
                lastReflectionAt={dream.lastReflectionAt}
                onReflect={() => handleReflect(dream.id)}
                onEvolution={() => handleEvolution(dream.id)}
                onVisualize={() => handleVisualize(dream.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="✨"
            title="Your Dream Journey Awaits"
            description="Every great journey begins with a single dream. What will yours be?"
            ctaLabel="Create My First Dream"
            ctaAction={() => setIsCreateModalOpen(true)}
          />
        )}
      </div>

      {/* Create Modal */}
      <CreateDreamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
