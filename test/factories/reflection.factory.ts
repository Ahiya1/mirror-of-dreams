// test/factories/reflection.factory.ts - Reflection test data factory
// Provides reusable reflection factories for testing

import type { ReflectionRow, ReflectionTone } from '@/types/reflection';

/**
 * Mock reflection interface for simplified test fixtures
 * Matches a subset of the database row structure
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
 * Creates a mock reflection row with sensible defaults (simplified version)
 *
 * @param overrides - Partial reflection data to merge with defaults
 * @returns MockReflection object
 *
 * @example
 * ```typescript
 * const reflection = createMockReflection({ tone: 'gentle' });
 * ```
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
 *
 * @example
 * ```typescript
 * const reflectionRow = createMockReflectionRow({ is_premium: true });
 * ```
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
 * Fusion tone reflection (default/balanced)
 */
export const fusionReflection = createMockReflectionRow({
  id: 'fusion-reflection-001',
  title: 'Balanced Growth',
  tone: 'fusion',
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

/**
 * High view count reflection
 */
export const popularReflection = createMockReflectionRow({
  id: 'popular-reflection-001',
  title: 'Popular Insight',
  view_count: 100,
  rating: 10,
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
 *
 * @example
 * ```typescript
 * const reflections = createMockReflections(5, 'user-123');
 * ```
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
 *
 * @example
 * ```typescript
 * const reflection = createReflectionForUser('user-123', { tone: 'gentle' });
 * ```
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
 *
 * @example
 * ```typescript
 * const reflection = createReflectionForDream('dream-123');
 * ```
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
 *
 * @example
 * ```typescript
 * const toneReflections = createToneVarietyReflections('user-123');
 * ```
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
 * Creates a reflection with specific tone
 *
 * @param tone - Reflection tone (gentle, intense, fusion)
 * @param overrides - Additional overrides
 * @returns ReflectionRow object
 *
 * @example
 * ```typescript
 * const gentleRef = createReflectionWithTone('gentle');
 * ```
 */
export const createReflectionWithTone = (
  tone: ReflectionTone,
  overrides: Partial<ReflectionRow> = {}
): ReflectionRow =>
  createMockReflectionRow({
    tone,
    title: `${tone.charAt(0).toUpperCase() + tone.slice(1)} Reflection`,
    ...overrides,
  });

/**
 * Creates a paginated set of reflections
 *
 * @param total - Total number of reflections
 * @param userId - User ID for all reflections
 * @returns Array of ReflectionRow objects ordered by created_at desc
 *
 * @example
 * ```typescript
 * const reflections = createPaginatedReflections(20, 'user-123');
 * ```
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

/**
 * Creates a reflection with premium features
 *
 * @param overrides - Additional overrides
 * @returns ReflectionRow object with is_premium set to true
 *
 * @example
 * ```typescript
 * const premiumRef = createPremiumReflection({ word_count: 1000 });
 * ```
 */
export const createPremiumReflection = (overrides: Partial<ReflectionRow> = {}): ReflectionRow =>
  createMockReflectionRow({
    is_premium: true,
    word_count: 800,
    estimated_read_time: 4,
    ...overrides,
  });
