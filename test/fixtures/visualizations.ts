// test/fixtures/visualizations.ts - Visualization test data factory
// Provides reusable visualization fixtures for testing Visualizations router

/**
 * Visualization row type matching database schema
 */
export interface VisualizationRow {
  id: string;
  user_id: string;
  dream_id: string | null;
  style: 'achievement' | 'spiral' | 'synthesis';
  narrative: string;
  reflections_analyzed: string[];
  reflection_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Creates a mock visualization row with sensible defaults
 *
 * @param overrides - Partial visualization data to merge with defaults
 * @returns Complete VisualizationRow object
 *
 * Usage:
 * ```typescript
 * const viz = createMockVisualization({ style: 'spiral', dream_id: 'uuid' });
 * ```
 */
export const createMockVisualization = (
  overrides: Partial<VisualizationRow> = {}
): VisualizationRow => ({
  id: 'viz-uuid-1234',
  user_id: 'test-user-uuid-1234',
  dream_id: 'dream-uuid-1234',
  style: 'achievement',
  narrative:
    'Your journey unfolds like a path through morning mist, each step revealing new vistas of possibility. From the first tentative explorations to confident strides forward, the landscape of your growth stretches magnificently...',
  reflections_analyzed: ['ref-1', 'ref-2', 'ref-3', 'ref-4'],
  reflection_count: 4,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Creates a mock cross-dream visualization (no specific dream_id)
 *
 * @param overrides - Partial visualization data to merge with defaults
 * @returns VisualizationRow with null dream_id
 */
export const createMockCrossDreamVisualization = (
  overrides: Partial<VisualizationRow> = {}
): VisualizationRow => ({
  ...createMockVisualization(),
  id: 'cross-viz-uuid-1234',
  dream_id: null,
  reflection_count: 12,
  reflections_analyzed: Array.from({ length: 12 }, (_, i) => `ref-${i + 1}`),
  narrative:
    'Across the constellation of your dreams, patterns emerge like stars revealing themselves at dusk. Each aspiration connects to the others in an intricate web of meaning and purpose...',
  ...overrides,
});

// =============================================================================
// Pre-configured Visualization Scenarios
// =============================================================================

/**
 * Achievement style visualization - linear journey narrative
 */
export const achievementVisualization = createMockVisualization({
  id: 'achievement-viz-001',
  style: 'achievement',
  narrative:
    'Your path rises steadily like a mountain trail, each milestone marking progress toward the summit. The early steps laid strong foundations, while middle passages tested resolve. Now you stand at a vantage point, surveying all you have accomplished.',
});

/**
 * Spiral style visualization - cyclical growth narrative
 */
export const spiralVisualization = createMockVisualization({
  id: 'spiral-viz-001',
  style: 'spiral',
  narrative:
    'Like seasons returning with deeper wisdom each year, your reflections spiral inward toward core truths. Each revolution brings you closer to understanding, as themes resurface transformed and enriched.',
});

/**
 * Synthesis style visualization - interconnected web narrative
 */
export const synthesisVisualization = createMockVisualization({
  id: 'synthesis-viz-001',
  style: 'synthesis',
  narrative:
    'A constellation of insights emerges from your reflections, each point of light connected to others by threads of meaning. This luminous web reveals how separate dreams weave together into a tapestry of purpose.',
});

/**
 * Cross-dream synthesis visualization
 */
export const crossDreamSynthesis = createMockCrossDreamVisualization({
  id: 'cross-synthesis-001',
  style: 'synthesis',
});

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Creates multiple visualizations for a user
 *
 * @param count - Number of visualizations to create
 * @param userId - User ID to associate visualizations with
 * @returns Array of VisualizationRow objects
 */
export const createMockVisualizations = (
  count: number,
  userId: string = 'test-user-uuid-1234'
): VisualizationRow[] =>
  Array.from({ length: count }, (_, index) => {
    const styles: Array<'achievement' | 'spiral' | 'synthesis'> = [
      'achievement',
      'spiral',
      'synthesis',
    ];
    return createMockVisualization({
      id: `viz-${index + 1}`,
      user_id: userId,
      style: styles[index % 3],
      created_at: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
    });
  });

/**
 * Creates a visualization for a specific user
 *
 * @param userId - User ID to assign
 * @param overrides - Additional overrides
 * @returns VisualizationRow object
 */
export const createVisualizationForUser = (
  userId: string,
  overrides: Partial<VisualizationRow> = {}
): VisualizationRow =>
  createMockVisualization({
    user_id: userId,
    ...overrides,
  });

/**
 * Creates a visualization for a specific dream
 *
 * @param dreamId - Dream ID to link to
 * @param overrides - Additional overrides
 * @returns VisualizationRow object
 */
export const createVisualizationForDream = (
  dreamId: string,
  overrides: Partial<VisualizationRow> = {}
): VisualizationRow =>
  createMockVisualization({
    dream_id: dreamId,
    ...overrides,
  });

/**
 * Creates a visualization with specific style
 *
 * @param style - Visualization style
 * @param overrides - Additional overrides
 * @returns VisualizationRow object
 */
export const createVisualizationWithStyle = (
  style: 'achievement' | 'spiral' | 'synthesis',
  overrides: Partial<VisualizationRow> = {}
): VisualizationRow =>
  createMockVisualization({
    style,
    ...overrides,
  });

/**
 * Creates a visualization with joined dream info (for list queries)
 *
 * @param overrides - Partial visualization data
 * @returns Visualization with dreams relation
 */
export const createVisualizationWithDream = (
  overrides: Partial<VisualizationRow> & {
    dreams?: { title: string; category?: string } | null;
  } = {}
) => {
  const { dreams = { title: 'Test Dream', category: 'personal' }, ...vizOverrides } = overrides;
  const viz = createMockVisualization(vizOverrides);

  return {
    ...viz,
    dreams,
  };
};

/**
 * Creates a cross-dream visualization with joined dreams (null)
 */
export const createCrossDreamVisualizationWithRelation = (
  overrides: Partial<VisualizationRow> = {}
) => {
  const viz = createMockCrossDreamVisualization(overrides);

  return {
    ...viz,
    dreams: null,
  };
};
