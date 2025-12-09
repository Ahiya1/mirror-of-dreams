/**
 * Temporal Distribution Algorithm
 *
 * Selects reflections across a user's timeline to show growth over time.
 * Divides reflections into 3 equal periods (Early, Middle, Recent) and
 * selects evenly-spaced reflections from each period.
 *
 * This ensures that evolution reports capture the full journey, not just
 * recent reflections.
 */

export interface Reflection {
  id: string;
  created_at: string;
  [key: string]: any;
}

/**
 * Select reflections using temporal distribution
 *
 * @param allReflections - All reflections sorted by created_at ASC
 * @param contextLimit - Maximum number of reflections to select
 * @returns Selected reflections distributed across time periods
 */
export function selectTemporalContext(
  allReflections: Reflection[],
  contextLimit: number
): Reflection[] {
  // If we have fewer reflections than the limit, return all
  if (allReflections.length <= contextLimit) {
    return allReflections;
  }

  // 1. Sort reflections by created_at ASC (earliest first)
  const sorted = [...allReflections].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // 2. Divide timeline into 3 equal periods
  const totalCount = sorted.length;
  const earlyEnd = Math.floor(totalCount / 3);
  const middleEnd = Math.floor((totalCount * 2) / 3);

  const earlyPeriod = sorted.slice(0, earlyEnd);
  const middlePeriod = sorted.slice(earlyEnd, middleEnd);
  const recentPeriod = sorted.slice(middleEnd);

  // 3. Calculate reflections needed per period
  const perPeriod = Math.floor(contextLimit / 3);
  const remainder = contextLimit % 3;

  // 4. Select evenly-spaced reflections from each period
  // Give the remainder to recent period (most recent context prioritized)
  const selectedEarly = selectEvenly(earlyPeriod, perPeriod);
  const selectedMiddle = selectEvenly(middlePeriod, perPeriod);
  const selectedRecent = selectEvenly(recentPeriod, perPeriod + remainder);

  return [...selectedEarly, ...selectedMiddle, ...selectedRecent];
}

/**
 * Select evenly-spaced reflections from a period
 *
 * @param period - Reflections in this time period
 * @param count - Number of reflections to select
 * @returns Evenly-spaced reflections
 */
function selectEvenly(period: Reflection[], count: number): Reflection[] {
  // If period has fewer reflections than needed, return all
  if (period.length <= count) {
    return period;
  }

  const step = period.length / count;
  const selected: Reflection[] = [];

  for (let i = 0; i < count; i++) {
    const index = Math.floor(i * step);
    selected.push(period[index]);
  }

  return selected;
}

/**
 * Get tier-specific context limits for evolution reports
 */
export const EVOLUTION_CONTEXT_LIMITS = {
  dream_specific: {
    free: 4,
    pro: 6,
    unlimited: 12,
  },
  cross_dream: {
    free: 0, // Not available
    pro: 12,
    unlimited: 30,
  },
} as const;

/**
 * Get context limit for a specific tier and report type
 */
export function getContextLimit(
  tier: 'free' | 'pro' | 'unlimited',
  reportType: 'dream_specific' | 'cross_dream'
): number {
  return EVOLUTION_CONTEXT_LIMITS[reportType][tier];
}

/**
 * Check if user has enough reflections for evolution report
 *
 * @param reflectionCount - Number of reflections
 * @param reportType - Type of evolution report
 * @returns Whether threshold is met
 */
export function meetsEvolutionThreshold(
  reflectionCount: number,
  reportType: 'dream_specific' | 'cross_dream'
): boolean {
  if (reportType === 'dream_specific') {
    return reflectionCount >= 4; // Threshold: 4 reflections per dream
  } else {
    return reflectionCount >= 12; // Threshold: 12 total reflections
  }
}
