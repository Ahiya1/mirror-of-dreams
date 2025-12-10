// e2e/fixtures/test-data.fixture.ts - Shared test data constants and factories

/**
 * Shared test data constants and factories
 *
 * Provides consistent test data across all E2E test files.
 */

export const TEST_DREAM = {
  title: 'E2E Test Dream',
  description: 'A dream created by E2E tests for validation',
  category: 'career' as const,
};

export const TEST_REFLECTION = {
  dream: 'What I am holding is my aspiration to grow professionally.',
  plan: 'I will take small steps each day toward my goal.',
  relationship: 'This dream connects to my desire for fulfillment.',
  offering: 'I offer my patience and persistence.',
};

export const DREAM_CATEGORIES = [
  'career',
  'health',
  'relationships',
  'personal_growth',
  'financial',
  'creative',
  'adventure',
] as const;

export const DREAM_STATUSES = ['active', 'achieved', 'archived', 'released'] as const;

export const REFLECTION_TONES = ['fusion', 'gentle', 'intense'] as const;

/**
 * Category emoji mapping (same as used in components)
 */
export const CATEGORY_EMOJIS: Record<string, string> = {
  health: '?',
  career: '?',
  relationships: '?',
  financial: '?',
  personal_growth: '?',
  creative: '?',
  spiritual: '?',
  entrepreneurial: '?',
  educational: '?',
  other: '?',
};

/**
 * Status emoji mapping
 */
export const STATUS_EMOJIS: Record<string, string> = {
  active: '?',
  achieved: '?',
  archived: '?',
  released: '??',
};

/**
 * Generate unique test dream title
 */
export function generateTestDreamTitle(): string {
  return `E2E Dream ${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Generate unique test email (re-exported from auth fixture pattern)
 */
export function generateTestEmail(): string {
  return `e2e-test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.local`;
}

/**
 * Test timeouts for various operations
 */
export const TEST_TIMEOUTS = {
  pageLoad: 30000,
  navigation: 15000,
  animation: 5000,
  networkIdle: 10000,
  elementVisible: 10000,
};

/**
 * Mobile viewport configurations
 */
export const MOBILE_VIEWPORTS = {
  iphone13: { width: 390, height: 844 },
  iphoneSE: { width: 375, height: 667 },
  androidSmall: { width: 360, height: 640 },
};

/**
 * Dashboard card names for testing
 */
export const DASHBOARD_CARDS = [
  'dreams',
  'reflections',
  'progress',
  'evolution',
  'visualization',
  'subscription',
  'clarify', // paid users only
] as const;

/**
 * Time of day greetings (same as DashboardHero logic)
 */
export function getExpectedGreeting(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
}
