'use client';

import { useCallback } from 'react';
import { trpc } from '@/lib/trpc';

/**
 * Simplified Dashboard Hook
 *
 * Previous Implementation: 739 lines with dual data fetching (hook + cards)
 * Refactored: Builder-2 (Iteration 19)
 *
 * This hook now provides ONLY utility functions for dashboard-wide actions.
 * Individual cards fetch their own data via tRPC queries.
 *
 * Benefits:
 * - Eliminates dual fetching and data inconsistency
 * - Simpler state management
 * - Cards own their data (single source of truth)
 * - TanStack Query handles caching automatically
 */

interface DashboardUtils {
  /**
   * Invalidate all dashboard queries to force refetch
   * Use this for the "Refresh Dashboard" button
   */
  refreshAll: () => void;
}

export function useDashboard(): DashboardUtils {
  const utils = trpc.useUtils();

  /**
   * Refresh all dashboard data by invalidating queries
   * Each card will refetch its own data automatically
   */
  const refreshAll = useCallback(() => {
    // Invalidate all relevant queries
    utils.subscriptions.getStatus.invalidate();
    utils.reflections.list.invalidate();
    utils.reflections.checkUsage.invalidate();
    utils.dreams.list.invalidate();
    utils.evolution.checkEligibility.invalidate();
  }, [utils]);

  return {
    refreshAll,
  };
}
