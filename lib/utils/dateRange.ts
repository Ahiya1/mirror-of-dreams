/**
 * Date Range Utilities
 * Builder: Builder-3 (Iteration 14)
 *
 * Helper functions for date range filtering in reflection collections
 */

export type DateRangeOption = 'all' | '7d' | '30d' | '90d';

export const DATE_RANGE_OPTIONS = [
  { value: 'all' as DateRangeOption, label: 'All Time' },
  { value: '7d' as DateRangeOption, label: 'Last 7 Days' },
  { value: '30d' as DateRangeOption, label: 'Last 30 Days' },
  { value: '90d' as DateRangeOption, label: 'Last 90 Days' },
] as const;

/**
 * Calculate date cutoff for a given range
 * Returns undefined for 'all' (no filter)
 */
export function getDateRangeFilter(range: DateRangeOption): Date | undefined {
  if (range === 'all') return undefined;

  const now = new Date();
  const daysAgo = parseInt(range.replace('d', ''));

  const cutoffDate = new Date(now);
  cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

  return cutoffDate;
}

/**
 * Filter reflections by date range
 * Used for client-side filtering if needed
 */
export function filterByDateRange<T extends { createdAt: string | Date }>(
  items: T[],
  range: DateRangeOption
): T[] {
  if (range === 'all') return items;

  const cutoff = getDateRangeFilter(range);
  if (!cutoff) return items;

  return items.filter((item) => {
    const itemDate = new Date(item.createdAt);
    return itemDate >= cutoff;
  });
}
