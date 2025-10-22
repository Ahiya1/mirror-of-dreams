'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from './useAuth';

// Constants for thresholds (from dashboardConstants.js)
const EVOLUTION_THRESHOLDS: Record<string, number | null> = {
  free: null,
  essential: 4,
  premium: 6,
  creator: 3,
};

const MILESTONE_THRESHOLDS = {
  REFLECTIONS: [1, 5, 10, 25, 50, 100, 250, 500],
  EVOLUTION_REPORTS: [1, 3, 5, 10, 20],
  STREAK_DAYS: [3, 7, 14, 30, 60, 100],
};

interface UsageData {
  current: number;
  limit: number | 'unlimited';
  percentage: number;
  tier: string;
  canReflect: boolean;
  percentUsed?: number;
  status?: string;
  totalReflections?: number;
  currentCount?: number;
}

interface EvolutionData {
  canGenerate: boolean;
  hasGenerated: boolean;
  lastGenerated: Date | null;
  progress?: {
    current: number;
    threshold: number;
    needed: number;
    percentage: number;
    canGenerate: boolean;
  };
  status?: string;
  canGenerateNext?: boolean;
}

interface Reflection {
  id: string;
  created_at: string;
  tone?: string;
  timeAgo?: string;
  toneName?: string;
  [key: string]: any;
}

interface Milestone {
  type: string;
  count: number;
  message: string;
  icon: string;
}

interface Streak {
  currentDays: number;
  longestDays: number;
  isActive: boolean;
}

interface Insight {
  type: string;
  title: string;
  message: string;
  icon: string;
  priority?: string;
  action?: string;
  actionUrl?: string;
}

interface Stats {
  totalReflections: number;
  currentMonthReflections: number;
  evolutionReportsGenerated: number;
  currentStreak: number;
}

interface Permissions {
  canReflect: boolean;
  canGenerateEvolution: boolean;
  canViewHistory: boolean;
  canUpgrade: boolean;
  isCreator: boolean;
}

interface DashboardData {
  usage: UsageData | null;
  reflections: Reflection[] | null;
  evolutionStatus: EvolutionData | null;
  milestones?: Milestone[];
  streaks?: Streak;
  insights?: Insight[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  isRefreshing: boolean;
  lastRefresh: number | null;
  stats?: Stats;
  permissions?: Permissions;
  isEmpty?: boolean;
  hasData?: boolean;
  hasError?: boolean;
  retryCount: number;
  greeting?: string;
  welcomeMessage?: string;
  nextActions?: string[];
}

/**
 * Calculate usage percentage
 */
const calculateUsagePercent = (usage: any): number => {
  if (!usage || usage.limit === 'unlimited') return 0;
  const current = usage.currentCount || usage.current || 0;
  const limit = usage.limit || 1;
  return Math.min((current / limit) * 100, 100);
};

/**
 * Get usage status label
 */
const getUsageStatus = (usage: any): string => {
  if (!usage) return 'unknown';
  if (usage.limit === 'unlimited') return 'unlimited';

  const percent = calculateUsagePercent(usage);
  if (percent === 0) return 'fresh';
  if (percent < 50) return 'active';
  if (percent < 80) return 'moderate';
  if (percent < 100) return 'approaching';
  return 'complete';
};

/**
 * Check if user can create reflections
 */
const checkCanReflect = (usage: any, userInfo: any): boolean => {
  if (userInfo?.isCreator || userInfo?.isAdmin || usage?.limit === 'unlimited') return true;
  const current = usage?.currentCount || usage?.current || 0;
  const limit = usage?.limit || 1;
  return current < limit;
};

/**
 * Calculate evolution progress with threshold
 */
const calculateEvolutionProgress = (evolution: any, userInfo: any) => {
  const tier = userInfo?.tier || 'free';
  const threshold = EVOLUTION_THRESHOLDS[tier];

  if (!threshold) {
    return {
      current: 0,
      threshold: 0,
      needed: 0,
      percentage: 0,
      canGenerate: false,
    };
  }

  const current = evolution?.progress?.current || 0;
  const needed = Math.max(0, threshold - current);
  const percentage = Math.min((current / threshold) * 100, 100);

  return {
    current,
    threshold,
    needed,
    percentage,
    canGenerate: current >= threshold,
  };
};

/**
 * Get evolution status label
 */
const getEvolutionStatus = (evolution: any, userInfo: any): string => {
  const tier = userInfo?.tier || 'free';

  if (tier === 'free') return 'upgrade';
  if (evolution?.canGenerateNext || evolution?.canGenerate) return 'ready';

  const progress = calculateEvolutionProgress(evolution, userInfo);
  if (progress.needed <= 2) return 'close';
  return 'progress';
};

/**
 * Detect milestone achievements
 */
const detectMilestones = (data: any, userInfo: any): Milestone[] => {
  const milestones: Milestone[] = [];
  const totalReflections = data.usage?.totalReflections || 0;
  const evolutionReports = data.evolution?.progress?.current || 0;

  // Reflection milestones
  if (MILESTONE_THRESHOLDS.REFLECTIONS.includes(totalReflections)) {
    milestones.push({
      type: 'reflections',
      count: totalReflections,
      message: `${totalReflections} reflection${totalReflections === 1 ? '' : 's'} completed!`,
      icon: '🎉',
    });
  }

  // Evolution report milestones
  if (MILESTONE_THRESHOLDS.EVOLUTION_REPORTS.includes(evolutionReports)) {
    milestones.push({
      type: 'evolution',
      count: evolutionReports,
      message: `${evolutionReports} evolution report${evolutionReports === 1 ? '' : 's'} generated!`,
      icon: '🦋',
    });
  }

  return milestones;
};

/**
 * Calculate current and longest day streaks
 */
const calculateStreaks = (reflections: Reflection[]): Streak => {
  if (!reflections?.length) {
    return { currentDays: 0, longestDays: 0, isActive: false };
  }

  // Sort reflections by date (newest first)
  const sortedReflections = [...reflections].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let lastDate: Date | null = null;

  for (const reflection of sortedReflections) {
    const reflectionDate = new Date(reflection.created_at);
    reflectionDate.setHours(0, 0, 0, 0);

    if (!lastDate) {
      tempStreak = 1;
      lastDate = reflectionDate;
      continue;
    }

    const daysDiff = Math.floor(
      (lastDate.getTime() - reflectionDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === 1) {
      tempStreak++;
    } else if (daysDiff === 0) {
      // Same day, continue streak
      continue;
    } else {
      // Streak broken
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }

    lastDate = reflectionDate;
  }

  longestStreak = Math.max(longestStreak, tempStreak);

  // Check if current streak is active (within last 2 days)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastReflectionDate = new Date(sortedReflections[0].created_at);
  lastReflectionDate.setHours(0, 0, 0, 0);
  const daysSinceLastReflection = Math.floor(
    (today.getTime() - lastReflectionDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceLastReflection <= 1) {
    currentStreak = tempStreak;
  }

  return {
    currentDays: currentStreak,
    longestDays: longestStreak,
    isActive: currentStreak > 0,
  };
};

/**
 * Enhance insights with personalized context and priorities
 */
const enhanceInsights = (insights: Insight[], data: any, userInfo: any): Insight[] => {
  const enhanced = [...insights];

  // Add personalized insights based on usage patterns
  const usage = data.usage || {};
  const evolution = data.evolution || {};

  // Usage pattern insights
  if (usage.currentCount && usage.limit !== 'unlimited') {
    const usagePercent = (usage.currentCount / usage.limit) * 100;

    if (usagePercent >= 80) {
      enhanced.push({
        type: 'usage_high',
        title: 'Active Reflection Journey',
        message: `You've used ${usage.currentCount} of ${usage.limit} reflections this month`,
        icon: '📊',
        priority: 'medium',
      });
    }
  }

  // Evolution readiness insights
  const progress = calculateEvolutionProgress(evolution, userInfo);
  if (progress.needed === 1) {
    enhanced.push({
      type: 'evolution_ready',
      title: 'Evolution Report Almost Ready!',
      message: 'One more reflection to unlock your consciousness patterns',
      icon: '🦋',
      action: 'Create Reflection',
      actionUrl: '/reflection',
      priority: 'high',
    });
  }

  // Sort by priority
  return enhanced.sort((a, b) => {
    const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
    return (priorityOrder[b.priority || 'low'] || 1) - (priorityOrder[a.priority || 'low'] || 1);
  });
};

/**
 * Format time ago for reflections
 */
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
    }
  }

  return 'just now';
};

/**
 * Format tone name for display
 */
const formatToneName = (tone?: string): string => {
  if (!tone) return 'Unknown';

  const toneNames: Record<string, string> = {
    fusion: 'Sacred Fusion',
    gentle: 'Gentle Clarity',
    intense: 'Luminous Intensity',
  };

  return toneNames[tone.toLowerCase()] || tone;
};

/**
 * Process raw dashboard data and add computed properties
 */
const processRawDashboardData = (rawData: any, userInfo: any) => {
  const processed = {
    ...rawData,

    // Add computed usage properties
    usage: rawData.usage ? {
      ...rawData.usage,
      percentUsed: calculateUsagePercent(rawData.usage),
      status: getUsageStatus(rawData.usage),
      canReflect: checkCanReflect(rawData.usage, userInfo),
    } : null,

    // Add computed evolution properties
    evolution: rawData.evolutionStatus || rawData.evolution ? {
      ...(rawData.evolutionStatus || rawData.evolution),
      progress: calculateEvolutionProgress(rawData.evolutionStatus || rawData.evolution, userInfo),
      status: getEvolutionStatus(rawData.evolutionStatus || rawData.evolution, userInfo),
    } : null,

    // Process reflections with time formatting
    reflections: (rawData.reflections || []).map((reflection: Reflection) => ({
      ...reflection,
      timeAgo: formatTimeAgo(reflection.created_at),
      toneName: formatToneName(reflection.tone),
    })),

    // Add milestone detection
    milestones: detectMilestones(rawData, userInfo),

    // Add streaks if available
    streaks: calculateStreaks(rawData.reflections || []),

    // Enhance insights
    insights: enhanceInsights(rawData.insights || [], rawData, userInfo),
  };

  return processed;
};

/**
 * Get time-based greeting
 */
const getTimeBasedGreeting = (): string => {
  const hour = new Date().getHours();

  if (hour < 5) return 'Night reflections';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  if (hour < 22) return 'Good evening';
  return 'Night reflections';
};

/**
 * Get personalized welcome message
 */
const getPersonalizedWelcomeMessage = (user: any, data: any): string => {
  if (!data) return 'Your journey awaits...';

  const tier = user?.tier || 'free';
  const reflectionCount = data.usage?.totalReflections || 0;

  if (reflectionCount === 0) {
    return 'Take your first step into conscious self-discovery...';
  }

  const tierMessages: Record<string, string> = {
    free: 'Your monthly sacred space for deep reflection...',
    essential: 'Continue exploring your inner landscape with intention...',
    premium: 'Dive deeper into the mysteries of your consciousness...',
    creator: 'Your infinite creative space awaits...',
  };

  return tierMessages[tier] || 'Welcome back to your journey...';
};

/**
 * Get motivational call-to-action
 */
const getMotivationalCTA = (user: any, usage: any): string[] => {
  const actions: string[] = [];

  if (usage?.canReflect) {
    actions.push('Create a new reflection');
  }

  if (user?.tier === 'free') {
    actions.push('Explore premium features');
  }

  return actions;
};

/**
 * Dashboard hook that aggregates all dashboard data with enhanced state management
 * Migrated from useDashboard.js with tRPC integration and all missing features
 */
export function useDashboard(): DashboardData {
  const { user, isAuthenticated } = useAuth();

  // Core state
  const [lastRefresh, setLastRefresh] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cachedData, setCachedData] = useState(new Map());
  const [retryCount, setRetryCount] = useState(0);

  // Refs for cleanup
  const mountedRef = useRef(true);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Compute derived usage state
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
      currentCount: current,
      totalReflections: (user as any).reflectionCount || 0,
      percentUsed: percentage,
      status: getUsageStatus({ current, limit, currentCount: current }),
    };
  }, [usageData, user]);

  const evolutionStatus = useMemo(() => {
    if (!evolutionData || !user) return null;

    const progress = calculateEvolutionProgress(evolutionData, user);
    const status = getEvolutionStatus(evolutionData, user);

    return {
      canGenerate: evolutionData.eligible || false,
      hasGenerated: false,
      lastGenerated: null,
      progress,
      status,
      canGenerateNext: evolutionData.eligible || false,
    };
  }, [evolutionData, user]);

  // Process reflections with time formatting
  const processedReflections = useMemo(() => {
    if (!reflectionsData?.items) return null;

    return reflectionsData.items.map((reflection: any) => ({
      ...reflection,
      timeAgo: formatTimeAgo(reflection.created_at),
      toneName: formatToneName(reflection.tone),
    }));
  }, [reflectionsData]);

  // Calculate milestones
  const milestones = useMemo(() => {
    if (!usage || !evolutionStatus) return [];

    return detectMilestones({ usage, evolution: evolutionStatus }, user);
  }, [usage, evolutionStatus, user]);

  // Calculate streaks
  const streaks = useMemo(() => {
    return calculateStreaks(processedReflections || []);
  }, [processedReflections]);

  // Enhance insights
  const insights = useMemo(() => {
    return enhanceInsights([], { usage, evolution: evolutionStatus }, user);
  }, [usage, evolutionStatus, user]);

  const isLoading = usageLoading || reflectionsLoading || evolutionLoading;
  const error = usageError?.message || reflectionsError?.message || evolutionError?.message || null;

  const refetch = useCallback(() => {
    setIsRefreshing(true);
    refetchUsage();
    refetchReflections();
    refetchEvolution();
    setLastRefresh(Date.now());
    setTimeout(() => setIsRefreshing(false), 500);
  }, [refetchUsage, refetchReflections, refetchEvolution]);

  // Computed values for easy access
  const computedValues = useMemo(() => {
    const hasData = !!usage || !!processedReflections;

    if (!hasData) {
      return {
        greeting: getTimeBasedGreeting(),
        welcomeMessage: 'Your journey awaits...',
        stats: {
          totalReflections: 0,
          currentMonthReflections: 0,
          evolutionReportsGenerated: 0,
          currentStreak: 0,
        },
        permissions: {
          canReflect: false,
          canGenerateEvolution: false,
          canViewHistory: false,
          canUpgrade: false,
          isCreator: false,
        },
        nextActions: [],
        isEmpty: true,
        hasError: !!error,
        hasData: false,
      };
    }

    return {
      greeting: getTimeBasedGreeting(),
      welcomeMessage: getPersonalizedWelcomeMessage(user, { usage, evolutionStatus }),
      stats: {
        totalReflections: usage?.totalReflections || 0,
        currentMonthReflections: usage?.currentCount || 0,
        evolutionReportsGenerated: evolutionStatus?.progress?.current || 0,
        currentStreak: streaks?.currentDays || 0,
      },
      permissions: {
        canReflect: usage?.canReflect ?? true,
        canGenerateEvolution: evolutionStatus?.canGenerateNext ?? false,
        canViewHistory: isAuthenticated,
        canUpgrade: user?.tier === 'free' || user?.tier === 'essential',
        isCreator: user?.isCreator ?? false,
      },
      nextActions: getMotivationalCTA(user, usage),
      isEmpty: !processedReflections?.length,
      hasError: !!error,
      hasData: true,
    };
  }, [usage, evolutionStatus, processedReflections, streaks, user, isAuthenticated, error]);

  // Auto-refresh data periodically (every 10 minutes)
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const refreshInterval = setInterval(() => {
      if (!document.hidden && !isLoading && !isRefreshing) {
        refetch();
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, user, isLoading, isRefreshing, refetch]);

  // Handle visibility change for smart refreshing
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && usage && !isLoading) {
        const timeSinceLastRefresh = Date.now() - (lastRefresh || 0);

        // Refresh if data is older than 5 minutes
        if (timeSinceLastRefresh > 5 * 60 * 1000) {
          refetch();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [usage, isLoading, lastRefresh, refetch]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    usage,
    reflections: processedReflections,
    evolutionStatus,
    milestones,
    streaks,
    insights,
    isLoading,
    error,
    refetch,
    isRefreshing,
    lastRefresh,
    retryCount,
    ...computedValues,
  };
}
