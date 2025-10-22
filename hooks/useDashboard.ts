'use client';

import { useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from './useAuth';

interface DashboardData {
  usage: {
    current: number;
    limit: number | 'unlimited';
    percentage: number;
    tier: string;
    canReflect: boolean;
  } | null;
  reflections: any[] | null;
  evolutionStatus: {
    canGenerate: boolean;
    hasGenerated: boolean;
    lastGenerated: Date | null;
  } | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Dashboard hook that aggregates all dashboard data
 * Migrated from useDashboard.js with tRPC integration
 */
export function useDashboard(): DashboardData {
  const { user, isAuthenticated } = useAuth();

  // Fetch usage data
  const {
    data: usageData,
    isLoading: usageLoading,
    error: usageError,
    refetch: refetchUsage,
  } = trpc.subscriptions.getStatus.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: 1,
  });

  // Fetch recent reflections (paginated)
  const {
    data: reflectionsData,
    isLoading: reflectionsLoading,
    error: reflectionsError,
    refetch: refetchReflections,
  } = trpc.reflections.list.useQuery({
    page: 1,
    limit: 10,
  }, {
    enabled: isAuthenticated,
    retry: 1,
  });

  // Fetch evolution eligibility status
  const {
    data: evolutionData,
    isLoading: evolutionLoading,
    error: evolutionError,
    refetch: refetchEvolution,
  } = trpc.evolution.checkEligibility.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: 1,
  });

  // Compute derived state
  const usage = useMemo(() => {
    if (!usageData || !user) return null;

    // Define tier limits
    const TIER_LIMITS: Record<string, number> = {
      free: 1,
      essential: 5,
      premium: 10,
    };

    // Calculate limit based on tier
    const tierLimit = user.isCreator || user.isAdmin
      ? Infinity
      : TIER_LIMITS[usageData.tier] || 1;

    const limit: number | 'unlimited' = tierLimit === Infinity ? 'unlimited' : tierLimit;
    const current = user.reflectionCountThisMonth || 0;
    const percentage = limit === 'unlimited' ? 100 : Math.min((current / limit) * 100, 100);
    const canReflect = limit === 'unlimited' || current < limit;

    return {
      current,
      limit,
      percentage,
      tier: String(usageData.tier || 'free'),
      canReflect,
    };
  }, [usageData, user]);

  const evolutionStatus = useMemo(() => {
    if (!evolutionData) return null;

    return {
      canGenerate: evolutionData.eligible || false,
      hasGenerated: false, // checkEligibility doesn't return this, would need separate call
      lastGenerated: null, // checkEligibility doesn't return this, would need separate call
    };
  }, [evolutionData]);

  const isLoading = usageLoading || reflectionsLoading || evolutionLoading;
  const error = usageError?.message || reflectionsError?.message || evolutionError?.message || null;

  const refetch = () => {
    refetchUsage();
    refetchReflections();
    refetchEvolution();
  };

  return {
    usage,
    reflections: reflectionsData?.items || null,
    evolutionStatus,
    isLoading,
    error,
    refetch,
  };
}
