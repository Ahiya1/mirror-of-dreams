// test/fixtures/lifecycle.ts - Lifecycle test data factory
// Provides reusable fixtures for lifecycle router testing (evolution, ceremony, ritual)

/**
 * Evolution event database row type
 */
export interface EvolutionEventRow {
  id: string;
  user_id: string;
  dream_id: string;
  old_title: string;
  old_description: string | null;
  old_target_date: string | null;
  old_category: string;
  new_title: string;
  new_description: string | null;
  new_target_date: string | null;
  new_category: string;
  evolution_reflection: string;
  created_at: string;
}

/**
 * Achievement ceremony database row type
 */
export interface AchievementCeremonyRow {
  id: string;
  user_id: string;
  dream_id: string;
  dream_title: string;
  dream_description: string | null;
  dream_category: string;
  who_you_were: string | null;
  who_you_became: string | null;
  journey_synthesis: string | null;
  personal_note: string | null;
  reflections_analyzed: string[];
  reflection_count: number;
  created_at: string;
}

/**
 * Release ritual database row type
 */
export interface ReleaseRitualRow {
  id: string;
  user_id: string;
  dream_id: string;
  dream_title: string;
  dream_description: string | null;
  dream_category: string;
  what_i_learned: string;
  what_im_grateful_for: string;
  what_i_release: string;
  final_message: string | null;
  reason: string | null;
  reflection_count: number;
  created_at: string;
}

// =============================================================================
// EVOLUTION EVENT FIXTURES
// =============================================================================

/**
 * Creates a mock evolution event
 */
export const createMockEvolutionEvent = (
  overrides: Partial<EvolutionEventRow> = {}
): EvolutionEventRow => ({
  id: 'eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee',
  user_id: 'test-user-uuid-1234',
  dream_id: '11111111-1111-4111-a111-111111111111',
  old_title: 'Original Dream Title',
  old_description: 'Original description',
  old_target_date: '2025-06-30',
  old_category: 'personal_growth',
  new_title: 'Evolved Dream Title',
  new_description: 'Updated description after evolution',
  new_target_date: '2025-12-31',
  new_category: 'personal_growth',
  evolution_reflection:
    'My dream has evolved because I have grown and learned new things along the way.',
  created_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Creates multiple evolution events for a dream
 */
export const createEvolutionHistory = (
  count: number,
  dreamId: string,
  userId: string
): EvolutionEventRow[] =>
  Array.from({ length: count }, (_, index) =>
    createMockEvolutionEvent({
      id: `evolution-${index + 1}`,
      dream_id: dreamId,
      user_id: userId,
      old_title: `Version ${index}`,
      new_title: `Version ${index + 1}`,
      evolution_reflection: `Evolution ${index + 1}: My dream has shifted because I discovered new aspects of my goal.`,
      created_at: new Date(Date.now() - (count - index) * 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
  );

// =============================================================================
// ACHIEVEMENT CEREMONY FIXTURES
// =============================================================================

/**
 * Creates a mock achievement ceremony
 */
export const createMockCeremony = (
  overrides: Partial<AchievementCeremonyRow> = {}
): AchievementCeremonyRow => ({
  id: 'cccccccc-cccc-4ccc-cccc-cccccccccccc',
  user_id: 'test-user-uuid-1234',
  dream_id: '11111111-1111-4111-a111-111111111111',
  dream_title: 'Achieved Dream',
  dream_description: 'A dream that was achieved through dedication',
  dream_category: 'personal_growth',
  who_you_were:
    '<div class="mirror-reflection" style="font-family:\'Inter\',sans-serif;font-size:1.05rem;line-height:1.7;color:#333;"><p style="margin:0 0 1.4rem 0;">When you began this journey, you were someone seeking change and growth.</p></div>',
  who_you_became:
    '<div class="mirror-reflection" style="font-family:\'Inter\',sans-serif;font-size:1.05rem;line-height:1.7;color:#333;"><p style="margin:0 0 1.4rem 0;">Through dedication and growth, you became someone who embraces challenges.</p></div>',
  journey_synthesis:
    '<div class="mirror-reflection" style="font-family:\'Inter\',sans-serif;font-size:1.05rem;line-height:1.7;color:#333;"><p style="margin:0 0 1.4rem 0;">Your path has been marked by moments of discovery and transformation.</p></div>',
  personal_note: null,
  reflections_analyzed: ['ref-1', 'ref-2', 'ref-3', 'ref-4'],
  reflection_count: 4,
  created_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Ceremony without AI synthesis (no reflections case)
 */
export const ceremonyWithoutSynthesis = createMockCeremony({
  id: 'ceremony-no-synthesis',
  who_you_were: null,
  who_you_became: null,
  journey_synthesis: null,
  reflections_analyzed: [],
  reflection_count: 0,
});

/**
 * Ceremony with personal note
 */
export const ceremonyWithNote = createMockCeremony({
  id: 'ceremony-with-note',
  personal_note: 'This achievement means the world to me. I never thought I could do it.',
});

// =============================================================================
// RELEASE RITUAL FIXTURES
// =============================================================================

/**
 * Creates a mock release ritual
 */
export const createMockRitual = (overrides: Partial<ReleaseRitualRow> = {}): ReleaseRitualRow => ({
  id: 'rrrrrrrr-rrrr-4rrr-rrrr-rrrrrrrrrrrr',
  user_id: 'test-user-uuid-1234',
  dream_id: '11111111-1111-4111-a111-111111111111',
  dream_title: 'Released Dream',
  dream_description: 'A dream that was released with gratitude',
  dream_category: 'career',
  what_i_learned:
    'I learned that some dreams need to transform into new ones as we grow and change.',
  what_im_grateful_for: 'I am grateful for the journey and all the lessons learned along the way.',
  what_i_release:
    'I release my attachment to this specific outcome and open myself to new possibilities.',
  final_message: 'Thank you for the growth you brought me. I carry your lessons forward.',
  reason: 'evolved_beyond',
  reflection_count: 3,
  created_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Release ritual with minimal content
 */
export const minimalRitual = createMockRitual({
  id: 'minimal-ritual',
  final_message: null,
  reason: null,
});

/**
 * Release ritual for different reasons
 */
export const ritualReasons = {
  evolvedBeyond: createMockRitual({
    id: 'ritual-evolved',
    reason: 'evolved_beyond',
  }),
  noLongerResonates: createMockRitual({
    id: 'ritual-no-resonance',
    reason: 'no_longer_resonates',
  }),
  completedDifferently: createMockRitual({
    id: 'ritual-completed-diff',
    reason: 'completed_differently',
  }),
  circumstancesChanged: createMockRitual({
    id: 'ritual-circumstances',
    reason: 'circumstances_changed',
  }),
  other: createMockRitual({
    id: 'ritual-other',
    reason: 'other',
  }),
};

// =============================================================================
// INPUT FIXTURES
// =============================================================================

/**
 * Valid evolve input
 */
export const validEvolveInput = {
  dreamId: '11111111-1111-4111-a111-111111111111',
  newTitle: 'Evolved Dream Title',
  newDescription: 'Updated description after evolution',
  newTargetDate: '2025-12-31',
  newCategory: 'personal_growth' as const,
  evolutionReflection:
    'My dream has evolved because I have grown and learned new things along the way.',
};

/**
 * Minimal evolve input (required fields only)
 */
export const minimalEvolveInput = {
  dreamId: '11111111-1111-4111-a111-111111111111',
  newTitle: 'Evolved Dream',
  evolutionReflection: 'My dream has evolved in a meaningful way.',
};

/**
 * Valid achieve input
 */
export const validAchieveInput = {
  dreamId: '11111111-1111-4111-a111-111111111111',
  personalNote: 'I feel so proud of accomplishing this dream.',
};

/**
 * Minimal achieve input
 */
export const minimalAchieveInput = {
  dreamId: '11111111-1111-4111-a111-111111111111',
};

/**
 * Valid release input
 */
export const validReleaseInput = {
  dreamId: '11111111-1111-4111-a111-111111111111',
  whatILearned:
    'I learned that growth comes in many forms and sometimes letting go is the wisest choice.',
  whatImGratefulFor:
    'I am grateful for the courage to pursue this dream and the lessons it taught me.',
  whatIRelease:
    'I release my attachment to this specific outcome and trust that my path will unfold.',
  finalMessage: 'Thank you for being part of my journey. I carry your lessons forward.',
  reason: 'evolved_beyond' as const,
};

/**
 * Minimal release input (required fields only)
 */
export const minimalReleaseInput = {
  dreamId: '11111111-1111-4111-a111-111111111111',
  whatILearned: 'I learned that growth is not always linear and that is okay.',
  whatImGratefulFor: 'I am grateful for the experience and what it taught me about myself.',
  whatIRelease: 'I release my attachment to this dream with love and acceptance.',
};

// =============================================================================
// AI RESPONSE FIXTURES
// =============================================================================

/**
 * Mock AI ceremony synthesis response
 */
export const mockCeremonySynthesisResponse = {
  id: 'msg_ceremony_12345',
  type: 'message' as const,
  role: 'assistant' as const,
  content: [
    {
      type: 'text' as const,
      text: `---WHO_YOU_WERE---
When you began this journey, you were someone seeking change, uncertain of the path ahead but driven by an inner calling. You carried both hope and doubt, taking the first tentative steps toward your dream.

---WHO_YOU_BECAME---
Through dedication, perseverance, and countless moments of growth, you became someone who embraces challenges as opportunities. You discovered reserves of strength you didn't know you had and learned to trust the process.

---JOURNEY_SYNTHESIS---
Your path has been marked by moments of discovery, breakthrough, and transformation. Each reflection revealed new layers of understanding. The obstacles you faced became stepping stones, and the victories, both large and small, built upon each other to create this moment of achievement.`,
    },
  ],
  model: 'claude-sonnet-4-5-20250929',
  stop_reason: 'end_turn' as const,
  stop_sequence: null,
  usage: { input_tokens: 500, output_tokens: 800 },
};

/**
 * Mock AI ceremony response with malformed sections (for error testing)
 */
export const mockMalformedCeremonyResponse = {
  id: 'msg_malformed_12345',
  type: 'message' as const,
  role: 'assistant' as const,
  content: [
    {
      type: 'text' as const,
      text: 'Here is your ceremony synthesis without proper markers.',
    },
  ],
  model: 'claude-sonnet-4-5-20250929',
  stop_reason: 'end_turn' as const,
  stop_sequence: null,
  usage: { input_tokens: 100, output_tokens: 50 },
};
