// test/fixtures/evolution.ts - Evolution report test data factory
// Provides reusable evolution report fixtures for testing

import type { Database } from '@/types/supabase';

type EvolutionReportRow = Database['public']['Tables']['evolution_reports']['Row'];

/**
 * Creates a mock evolution report row with sensible defaults
 *
 * @param overrides - Partial data to merge with defaults
 * @returns Complete EvolutionReportRow object
 */
export const createMockEvolutionReport = (
  overrides: Partial<EvolutionReportRow> = {}
): EvolutionReportRow => ({
  id: 'evolution-uuid-1234',
  user_id: 'test-user-uuid-1234',
  dream_id: 'dream-uuid-1234',
  report_category: 'dream-specific',
  report_type: 'essential',
  analysis:
    'Your journey with this dream reveals a pattern of growth and deepening understanding. Over the course of your reflections, you have shown remarkable evolution in how you approach and embody this aspiration.',
  reflections_analyzed: ['ref-1', 'ref-2', 'ref-3', 'ref-4'],
  reflection_count: 4,
  time_period_start: '2024-01-01T00:00:00Z',
  time_period_end: '2024-06-01T00:00:00Z',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Creates a mock cross-dream evolution report
 *
 * @param overrides - Partial data to merge with defaults
 * @returns EvolutionReportRow object configured for cross-dream analysis
 */
export const createMockCrossDreamReport = (
  overrides: Partial<EvolutionReportRow> = {}
): EvolutionReportRow => ({
  ...createMockEvolutionReport(),
  id: 'cross-evolution-uuid-1234',
  dream_id: null,
  report_category: 'cross-dream',
  reflections_analyzed: Array.from({ length: 12 }, (_, i) => `ref-${i + 1}`),
  reflection_count: 12,
  ...overrides,
});

/**
 * Creates multiple evolution reports for pagination testing
 *
 * @param count - Number of reports to create
 * @param userId - User ID to assign
 * @returns Array of EvolutionReportRow objects
 */
export const createMockEvolutionReports = (
  count: number,
  userId: string = 'test-user-uuid-1234'
): EvolutionReportRow[] =>
  Array.from({ length: count }, (_, index) =>
    createMockEvolutionReport({
      id: `evolution-${index + 1}`,
      user_id: userId,
      created_at: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
    })
  );

/**
 * Creates a premium evolution report (for unlimited tier)
 *
 * @param overrides - Partial data to merge with defaults
 * @returns EvolutionReportRow with premium configuration
 */
export const createMockPremiumEvolutionReport = (
  overrides: Partial<EvolutionReportRow> = {}
): EvolutionReportRow =>
  createMockEvolutionReport({
    report_type: 'premium',
    analysis:
      'Your evolution has been extraordinary. With extended thinking analysis, we can trace deeper patterns in your journey that reveal profound growth...',
    ...overrides,
  });

/**
 * Creates an evolution report with dream info (for joined queries)
 *
 * @param overrides - Partial data to merge
 * @returns Evolution report with dreams field
 */
export const createMockEvolutionReportWithDream = (
  overrides: Partial<EvolutionReportRow> & {
    dreams?: { title: string; category?: string } | null;
  } = {}
) => {
  const { dreams, ...reportOverrides } = overrides;
  return {
    ...createMockEvolutionReport(reportOverrides),
    dreams: dreams ?? { title: 'Learn Guitar', category: 'creative' },
  };
};

/**
 * Creates a cross-dream report with null dreams (for joined queries)
 *
 * @param overrides - Partial data to merge
 * @returns Cross-dream report with null dreams field
 */
export const createMockCrossDreamReportWithDream = (
  overrides: Partial<EvolutionReportRow> = {}
) => ({
  ...createMockCrossDreamReport(overrides),
  dreams: null,
});
