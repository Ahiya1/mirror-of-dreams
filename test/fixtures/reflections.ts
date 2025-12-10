// test/fixtures/reflections.ts - Reflection test data factory
// Provides reusable reflection fixtures for testing

import type { ReflectionRow, ReflectionTone } from '@/types/reflection';

/**
 * Mock reflection interface for test fixtures
 * Matches the database row structure
 */
export interface MockReflection {
  id: string;
  user_id: string;
  dream_id: string | null;
  content: string;
  ai_response: string;
  tone: string;
  created_at: string;
}

/**
 * Creates a mock reflection row with sensible defaults
 * This is the simplified version matching the fixture interface
 *
 * @param overrides - Partial reflection data to merge with defaults
 * @returns MockReflection object
 */
export function createMockReflection(overrides?: Partial<MockReflection>): MockReflection {
  return {
    id: 'reflection-uuid-1234',
    user_id: 'test-user-uuid-1234',
    dream_id: 'dream-uuid-1234',
    content: 'I want to learn guitar',
    ai_response: 'Your journey with guitar speaks to your creative spirit...',
    tone: 'fusion',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates a full reflection row with all database fields
 * Matches the ReflectionRow type from @/types/reflection
 *
 * @param overrides - Partial row data to merge with defaults
 * @returns Complete ReflectionRow object
 */
export const createMockReflectionRow = (overrides: Partial<ReflectionRow> = {}): ReflectionRow => ({
  id: 'reflection-uuid-1234',
  user_id: 'test-user-uuid-1234',
  dream_id: 'dream-uuid-1234',
  dream: 'I want to learn guitar',
  plan: 'Practice 30 minutes daily',
  has_date: 'yes',
  dream_date: '2025-12-31',
  relationship: 'This dream connects me to my creative side',
  offering: 'Time and dedication',
  ai_response: 'Your journey with guitar speaks to your creative spirit...',
  tone: 'fusion',
  is_premium: false,
  word_count: 350,
  estimated_read_time: 2,
  title: 'Learning Guitar',
  tags: ['creativity', 'music'],
  rating: null,
  user_feedback: null,
  view_count: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// =============================================================================
// Pre-configured Reflection Scenarios
// =============================================================================

/**
 * Basic reflection - default state
 */
export const basicReflection = createMockReflectionRow({
  id: 'basic-reflection-001',
  title: 'Learning Guitar',
  tone: 'fusion',
});

/**
 * Premium reflection - enhanced AI response
 */
export const premiumReflection = createMockReflectionRow({
  id: 'premium-reflection-001',
  title: 'Deep Career Exploration',
  tone: 'intense',
  is_premium: true,
  word_count: 800,
  estimated_read_time: 4,
});

/**
 * Gentle tone reflection
 */
export const gentleReflection = createMockReflectionRow({
  id: 'gentle-reflection-001',
  title: 'Nurturing Creativity',
  tone: 'gentle',
});

/**
 * Intense tone reflection
 */
export const intenseReflection = createMockReflectionRow({
  id: 'intense-reflection-001',
  title: 'Breaking Through Barriers',
  tone: 'intense',
});

/**
 * Reflection with rating and feedback
 */
export const ratedReflection = createMockReflectionRow({
  id: 'rated-reflection-001',
  title: 'Transformative Insight',
  rating: 9,
  user_feedback: 'This really helped me see my dreams differently',
  view_count: 5,
});

/**
 * Reflection without dream_id (legacy format)
 */
export const legacyReflection = createMockReflectionRow({
  id: 'legacy-reflection-001',
  dream_id: null,
  title: 'Open-ended Dream',
});

/**
 * Reflection without target date
 */
export const noDateReflection = createMockReflectionRow({
  id: 'no-date-reflection-001',
  has_date: 'no',
  dream_date: null,
  title: 'Timeless Aspiration',
});

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Creates multiple reflections for a user
 *
 * @param count - Number of reflections to create
 * @param userId - User ID for all reflections
 * @returns Array of ReflectionRow objects
 */
export const createMockReflections = (
  count: number,
  userId: string = 'test-user-uuid-1234'
): ReflectionRow[] =>
  Array.from({ length: count }, (_, index) =>
    createMockReflectionRow({
      id: `reflection-${index + 1}`,
      user_id: userId,
      title: `Reflection ${index + 1}`,
      created_at: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(), // Stagger dates
    })
  );

/**
 * Creates a reflection for a specific user
 *
 * @param userId - User ID to assign
 * @param overrides - Additional overrides
 * @returns ReflectionRow object
 */
export const createReflectionForUser = (
  userId: string,
  overrides: Partial<ReflectionRow> = {}
): ReflectionRow =>
  createMockReflectionRow({
    user_id: userId,
    ...overrides,
  });

/**
 * Creates a reflection for a specific dream
 *
 * @param dreamId - Dream ID to link to
 * @param overrides - Additional overrides
 * @returns ReflectionRow object
 */
export const createReflectionForDream = (
  dreamId: string,
  overrides: Partial<ReflectionRow> = {}
): ReflectionRow =>
  createMockReflectionRow({
    dream_id: dreamId,
    ...overrides,
  });

/**
 * Creates reflections with different tones
 *
 * @param userId - User ID for all reflections
 * @returns Array of 3 reflections (one per tone)
 */
export const createToneVarietyReflections = (userId: string): ReflectionRow[] => [
  createMockReflectionRow({
    id: 'gentle-tone-001',
    user_id: userId,
    tone: 'gentle',
    title: 'Gentle Reflection',
  }),
  createMockReflectionRow({
    id: 'intense-tone-001',
    user_id: userId,
    tone: 'intense',
    title: 'Intense Reflection',
  }),
  createMockReflectionRow({
    id: 'fusion-tone-001',
    user_id: userId,
    tone: 'fusion',
    title: 'Fusion Reflection',
  }),
];

/**
 * Creates a paginated set of reflections
 *
 * @param total - Total number of reflections
 * @param userId - User ID for all reflections
 * @returns Array of ReflectionRow objects ordered by created_at desc
 */
export const createPaginatedReflections = (
  total: number,
  userId: string = 'test-user-uuid-1234'
): ReflectionRow[] => {
  const reflections = createMockReflections(total, userId);
  // Sort by created_at descending (newest first)
  return reflections.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};
