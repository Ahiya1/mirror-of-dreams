// test/fixtures/dreams.ts - Dream test data factory
// Provides reusable dream fixtures for testing Dreams router

/**
 * Dream database row type
 */
export interface DreamRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  category: string;
  priority: number;
  status: 'active' | 'achieved' | 'archived' | 'released';
  achieved_at: string | null;
  archived_at: string | null;
  released_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Dream category options
 */
export type DreamCategory =
  | 'health'
  | 'career'
  | 'relationships'
  | 'financial'
  | 'personal_growth'
  | 'creative'
  | 'spiritual'
  | 'entrepreneurial'
  | 'educational'
  | 'other';

/**
 * Creates a mock dream row with sensible defaults
 *
 * @param overrides - Partial dream data to merge with defaults
 * @returns Complete DreamRow object
 *
 * Usage:
 * ```typescript
 * const dream = createMockDream({ status: 'achieved', title: 'Learn Guitar' });
 * ```
 */
export const createMockDream = (overrides: Partial<DreamRow> = {}): DreamRow => ({
  id: '11111111-1111-4111-a111-111111111111',
  user_id: '22222222-2222-4222-a222-222222222222',
  title: 'Learn to play guitar',
  description: 'Master basic chords and play my favorite songs',
  target_date: '2025-12-31',
  category: 'creative',
  priority: 5,
  status: 'active',
  achieved_at: null,
  archived_at: null,
  released_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// =============================================================================
// Pre-configured Dream Scenarios
// =============================================================================

/**
 * Active dream - default state
 */
export const activeDream = createMockDream({
  id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
  title: 'Learn guitar',
  status: 'active',
});

/**
 * Achieved dream - completed successfully
 */
export const achievedDream = createMockDream({
  id: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
  title: 'Run a marathon',
  status: 'achieved',
  achieved_at: new Date().toISOString(),
});

/**
 * Archived dream - put on hold
 */
export const archivedDream = createMockDream({
  id: 'cccccccc-cccc-4ccc-cccc-cccccccccccc',
  title: 'Write a novel',
  status: 'archived',
  archived_at: new Date().toISOString(),
});

/**
 * Released dream - let go intentionally
 */
export const releasedDream = createMockDream({
  id: 'dddddddd-dddd-4ddd-dddd-dddddddddddd',
  title: 'Become an astronaut',
  status: 'released',
  released_at: new Date().toISOString(),
});

/**
 * Dream with no target date
 */
export const openEndedDream = createMockDream({
  id: 'eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee',
  title: 'Learn to meditate',
  target_date: null,
  description: null,
});

/**
 * High priority dream
 */
export const highPriorityDream = createMockDream({
  id: 'ffffffff-ffff-4fff-ffff-ffffffffffff',
  title: 'Urgent career goal',
  priority: 10,
  category: 'career',
});

/**
 * Low priority dream
 */
export const lowPriorityDream = createMockDream({
  id: '00000000-0000-4000-a000-000000000001',
  title: 'Nice to have goal',
  priority: 1,
  category: 'other',
});

/**
 * Dream with past target date (overdue)
 */
export const overdueDream = createMockDream({
  id: '00000000-0000-4000-a000-000000000002',
  title: 'Finish project',
  target_date: '2024-01-01',
});

/**
 * Dream with far future target date
 */
export const futureDream = createMockDream({
  id: '00000000-0000-4000-a000-000000000003',
  title: 'Long-term vision',
  target_date: '2030-12-31',
});

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Creates multiple dreams for a user
 *
 * @param count - Number of dreams to create
 * @param userId - User ID to associate dreams with
 * @returns Array of DreamRow objects
 */
export const createMockDreams = (
  count: number,
  userId: string = '22222222-2222-4222-a222-222222222222'
): DreamRow[] =>
  Array.from({ length: count }, (_, index) =>
    createMockDream({
      id: `00000000-0000-4000-a000-${String(index + 100).padStart(12, '0')}`,
      user_id: userId,
      title: `Dream ${index + 1}`,
      priority: (index % 10) + 1,
    })
  );

/**
 * Creates a dream for a specific user
 *
 * @param userId - User ID to associate dream with
 * @param overrides - Partial dream data to merge
 * @returns DreamRow object
 */
export const createDreamForUser = (userId: string, overrides: Partial<DreamRow> = {}): DreamRow =>
  createMockDream({
    user_id: userId,
    ...overrides,
  });

/**
 * Creates dreams at free tier limit (2 dreams)
 *
 * @param userId - User ID to associate dreams with
 * @returns Array of 2 DreamRow objects
 */
export const createFreeTierDreams = (userId: string): DreamRow[] => [
  createMockDream({
    id: '00000000-0000-4000-a000-000000000201',
    user_id: userId,
    title: 'Dream 1',
  }),
  createMockDream({
    id: '00000000-0000-4000-a000-000000000202',
    user_id: userId,
    title: 'Dream 2',
  }),
];

/**
 * Creates dreams at pro tier limit (5 dreams)
 *
 * @param userId - User ID to associate dreams with
 * @returns Array of 5 DreamRow objects
 */
export const createProTierDreams = (userId: string): DreamRow[] => createMockDreams(5, userId);

/**
 * Creates a dream with specific category
 *
 * @param category - Dream category
 * @param overrides - Partial dream data to merge
 * @returns DreamRow object
 */
export const createDreamWithCategory = (
  category: DreamCategory,
  overrides: Partial<DreamRow> = {}
): DreamRow =>
  createMockDream({
    category,
    title: `${category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')} dream`,
    ...overrides,
  });

/**
 * Creates a dream with specific status and corresponding timestamp
 *
 * @param status - Dream status
 * @param overrides - Partial dream data to merge
 * @returns DreamRow object with appropriate timestamp set
 */
export const createDreamWithStatus = (
  status: DreamRow['status'],
  overrides: Partial<DreamRow> = {}
): DreamRow => {
  const dream = createMockDream({ status, ...overrides });

  if (status === 'achieved') {
    dream.achieved_at = new Date().toISOString();
  } else if (status === 'archived') {
    dream.archived_at = new Date().toISOString();
  } else if (status === 'released') {
    dream.released_at = new Date().toISOString();
  }

  return dream;
};

/**
 * Creates a dream with stats (for list operations)
 *
 * @param overrides - Partial dream data to merge
 * @returns Dream with stats fields
 */
export const createMockDreamWithStats = (
  overrides: Partial<DreamRow> & {
    reflectionCount?: number;
    lastReflectionAt?: string | null;
    daysLeft?: number | null;
  } = {}
) => {
  const {
    reflectionCount = 0,
    lastReflectionAt = null,
    daysLeft = null,
    ...dreamOverrides
  } = overrides;
  const dream = createMockDream(dreamOverrides);

  return {
    ...dream,
    reflectionCount,
    lastReflectionAt,
    daysLeft,
  };
};

// =============================================================================
// Tier Limit Constants (matching router)
// =============================================================================

export const DREAM_TIER_LIMITS = {
  free: 2,
  pro: 5,
  unlimited: 999999,
} as const;
