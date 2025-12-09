// test/fixtures/users.ts - User test data factory
// Provides reusable user fixtures for testing

import type {
  User,
  UserRow,
  UserPreferences,
  SubscriptionTier,
  SubscriptionStatus,
  Language,
} from '@/types/user';

/**
 * Default preferences for test users
 */
export const defaultTestPreferences: UserPreferences = {
  notification_email: true,
  reflection_reminders: 'off',
  evolution_email: true,
  marketing_emails: false,
  default_tone: 'fusion',
  show_character_counter: true,
  reduce_motion_override: null,
  analytics_opt_in: true,
};

/**
 * Creates a mock User object with sensible defaults
 *
 * @param overrides - Partial user data to merge with defaults
 * @returns Complete User object
 *
 * Usage:
 * ```typescript
 * const user = createMockUser({ tier: 'pro', name: 'John' });
 * ```
 */
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'test-user-uuid-1234',
  email: 'test@example.com',
  name: 'Test User',
  tier: 'free',
  subscriptionStatus: 'active',
  subscriptionPeriod: null,
  reflectionCountThisMonth: 0,
  reflectionsToday: 0,
  lastReflectionDate: null,
  totalReflections: 0,
  clarifySessionsThisMonth: 0,
  totalClarifySessions: 0,
  currentMonthYear: new Date().toISOString().slice(0, 7), // "2025-01"
  cancelAtPeriodEnd: false,
  isCreator: false,
  isAdmin: false,
  isDemo: false,
  language: 'en',
  emailVerified: true,
  preferences: { ...defaultTestPreferences },
  createdAt: new Date().toISOString(),
  lastSignInAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Creates a mock UserRow (database representation)
 *
 * @param overrides - Partial row data to merge with defaults
 * @returns Complete UserRow object
 */
export const createMockUserRow = (overrides: Partial<UserRow> = {}): UserRow => ({
  id: 'test-user-uuid-1234',
  email: 'test@example.com',
  password_hash: '$2b$10$test-hash',
  name: 'Test User',
  tier: 'free',
  subscription_status: 'active',
  subscription_period: null,
  reflection_count_this_month: 0,
  reflections_today: 0,
  last_reflection_date: null,
  total_reflections: 0,
  clarify_sessions_this_month: 0,
  total_clarify_sessions: 0,
  current_month_year: new Date().toISOString().slice(0, 7),
  cancel_at_period_end: false,
  is_creator: false,
  is_admin: false,
  is_demo: false,
  language: 'en',
  email_verified: true,
  preferences: { ...defaultTestPreferences },
  created_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// =============================================================================
// Pre-configured User Scenarios
// =============================================================================

/**
 * Free tier user - fresh account, no reflections
 */
export const freeTierUser = createMockUser({
  id: 'free-user-001',
  email: 'free@example.com',
  name: 'Free User',
  tier: 'free',
  reflectionCountThisMonth: 0,
  totalReflections: 0,
});

/**
 * Free tier user at monthly limit (2 reflections)
 */
export const freeTierAtLimit = createMockUser({
  id: 'free-user-at-limit',
  email: 'free-limit@example.com',
  name: 'Free User At Limit',
  tier: 'free',
  reflectionCountThisMonth: 2, // Free tier monthly limit
  totalReflections: 2,
});

/**
 * Pro tier user - active subscription
 */
export const proTierUser = createMockUser({
  id: 'pro-user-001',
  email: 'pro@example.com',
  name: 'Pro User',
  tier: 'pro',
  subscriptionStatus: 'active',
  subscriptionPeriod: 'monthly',
  reflectionCountThisMonth: 5,
  totalReflections: 25,
});

/**
 * Pro tier user at daily limit (1 reflection today)
 */
export const proTierAtDailyLimit = createMockUser({
  id: 'pro-user-daily-limit',
  email: 'pro-daily@example.com',
  name: 'Pro User Daily Limit',
  tier: 'pro',
  subscriptionStatus: 'active',
  subscriptionPeriod: 'monthly',
  reflectionsToday: 1, // Pro daily limit is 1
  lastReflectionDate: new Date().toISOString().split('T')[0],
});

/**
 * Unlimited tier user - active subscription
 */
export const unlimitedTierUser = createMockUser({
  id: 'unlimited-user-001',
  email: 'unlimited@example.com',
  name: 'Unlimited User',
  tier: 'unlimited',
  subscriptionStatus: 'active',
  subscriptionPeriod: 'yearly',
  reflectionCountThisMonth: 20,
  totalReflections: 150,
});

/**
 * Unlimited tier user at daily limit (2 reflections today)
 */
export const unlimitedTierAtDailyLimit = createMockUser({
  id: 'unlimited-user-daily-limit',
  email: 'unlimited-daily@example.com',
  name: 'Unlimited User Daily Limit',
  tier: 'unlimited',
  subscriptionStatus: 'active',
  subscriptionPeriod: 'yearly',
  reflectionsToday: 2, // Unlimited daily limit is 2
  lastReflectionDate: new Date().toISOString().split('T')[0],
});

/**
 * User with canceled subscription (grace period)
 */
export const canceledSubscriptionUser = createMockUser({
  id: 'canceled-user-001',
  email: 'canceled@example.com',
  name: 'Canceled User',
  tier: 'pro',
  subscriptionStatus: 'canceled',
  subscriptionPeriod: 'monthly',
  cancelAtPeriodEnd: true,
});

/**
 * User with expired subscription
 */
export const expiredSubscriptionUser = createMockUser({
  id: 'expired-user-001',
  email: 'expired@example.com',
  name: 'Expired User',
  tier: 'free', // Downgraded to free
  subscriptionStatus: 'expired',
  subscriptionPeriod: null,
});

/**
 * Creator user (special access)
 */
export const creatorUser = createMockUser({
  id: 'creator-user-001',
  email: 'creator@example.com',
  name: 'Creator',
  tier: 'unlimited',
  subscriptionStatus: 'active',
  isCreator: true,
});

/**
 * Admin user
 */
export const adminUser = createMockUser({
  id: 'admin-user-001',
  email: 'admin@example.com',
  name: 'Admin User',
  tier: 'unlimited',
  subscriptionStatus: 'active',
  isAdmin: true,
});

/**
 * Demo user (limited functionality)
 */
export const demoUser = createMockUser({
  id: 'demo-user-001',
  email: 'demo@example.com',
  name: 'Demo User',
  tier: 'free',
  isDemo: true,
  emailVerified: false,
});

/**
 * Hebrew language user
 */
export const hebrewUser = createMockUser({
  id: 'hebrew-user-001',
  email: 'user@example.co.il',
  name: 'Hebrew User',
  tier: 'pro',
  language: 'he',
});

/**
 * User with all preferences customized
 */
export const customPreferencesUser = createMockUser({
  id: 'custom-prefs-user',
  email: 'custom@example.com',
  name: 'Custom Preferences User',
  preferences: {
    notification_email: false,
    reflection_reminders: 'weekly',
    evolution_email: false,
    marketing_emails: true,
    default_tone: 'gentle',
    show_character_counter: false,
    reduce_motion_override: true,
    analytics_opt_in: false,
  },
});

/**
 * User who has never signed in (new account)
 */
export const newUser = createMockUser({
  id: 'new-user-001',
  email: 'new@example.com',
  name: 'New User',
  tier: 'free',
  emailVerified: false,
  totalReflections: 0,
  reflectionCountThisMonth: 0,
});

// =============================================================================
// Factory Functions for Dynamic User Generation
// =============================================================================

/**
 * Creates a user with specific tier and status
 */
export const createUserWithTier = (
  tier: SubscriptionTier,
  status: SubscriptionStatus = 'active'
): User =>
  createMockUser({
    id: `${tier}-user-${Date.now()}`,
    email: `${tier}@example.com`,
    name: `${tier.charAt(0).toUpperCase() + tier.slice(1)} User`,
    tier,
    subscriptionStatus: status,
    subscriptionPeriod: tier === 'free' ? null : 'monthly',
  });

/**
 * Creates a user with specific reflection counts
 */
export const createUserWithReflections = (
  monthlyCount: number,
  dailyCount: number = 0,
  totalCount?: number
): User =>
  createMockUser({
    reflectionCountThisMonth: monthlyCount,
    reflectionsToday: dailyCount,
    lastReflectionDate: dailyCount > 0 ? new Date().toISOString().split('T')[0] : null,
    totalReflections: totalCount ?? monthlyCount,
  });

/**
 * Creates a user with specific language
 */
export const createUserWithLanguage = (language: Language): User =>
  createMockUser({
    language,
    name: language === 'he' ? 'Hebrew User' : 'English User',
  });

/**
 * Creates multiple unique users
 */
export const createMockUsers = (count: number): User[] =>
  Array.from({ length: count }, (_, index) =>
    createMockUser({
      id: `user-${index + 1}`,
      email: `user${index + 1}@example.com`,
      name: `User ${index + 1}`,
    })
  );
