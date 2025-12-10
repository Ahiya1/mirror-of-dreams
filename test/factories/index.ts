// test/factories/index.ts - Barrel export for all test factories
// Import from '@/test/factories' to access all factory functions and fixtures

// =============================================================================
// User Factories
// =============================================================================

export {
  // Factory functions
  createMockUser,
  createMockUserRow,
  createUserWithTier,
  createUserWithReflections,
  createUserWithLanguage,
  createMockUsers,
  // Pre-configured scenarios
  freeTierUser,
  freeTierAtLimit,
  proTierUser,
  proTierAtDailyLimit,
  unlimitedTierUser,
  unlimitedTierAtDailyLimit,
  canceledSubscriptionUser,
  expiredSubscriptionUser,
  creatorUser,
  adminUser,
  demoUser,
  hebrewUser,
  customPreferencesUser,
  newUser,
  // Constants
  defaultTestPreferences,
} from './user.factory';

// =============================================================================
// Dream Factories
// =============================================================================

export {
  // Factory functions
  createMockDream,
  createMockDreams,
  createDreamForUser,
  createFreeTierDreams,
  createProTierDreams,
  createDreamWithCategory,
  createDreamWithStatus,
  createMockDreamWithStats,
  // Pre-configured scenarios
  activeDream,
  achievedDream,
  archivedDream,
  releasedDream,
  openEndedDream,
  highPriorityDream,
  lowPriorityDream,
  overdueDream,
  futureDream,
  // Constants
  DREAM_TIER_LIMITS,
  // Types
  type DreamRow,
  type DreamCategory,
  type DreamStatus,
  type DreamWithStats,
} from './dream.factory';

// =============================================================================
// Reflection Factories
// =============================================================================

export {
  // Factory functions
  createMockReflection,
  createMockReflectionRow,
  createMockReflections,
  createReflectionForUser,
  createReflectionForDream,
  createToneVarietyReflections,
  createReflectionWithTone,
  createPaginatedReflections,
  createPremiumReflection,
  // Pre-configured scenarios
  basicReflection,
  premiumReflection,
  gentleReflection,
  intenseReflection,
  fusionReflection,
  ratedReflection,
  legacyReflection,
  noDateReflection,
  popularReflection,
  // Types
  type MockReflection,
} from './reflection.factory';

// =============================================================================
// Clarify Factories
// =============================================================================

export {
  // Session factories
  createMockClarifySession,
  createMockClarifySessionRow,
  createMockClarifySessions,
  createSessionWithMessages,
  createSessionForUser,
  createSessionWithStatus,
  // Message factories
  createMockClarifyMessage,
  createMockClarifyMessageRow,
  createMockClarifyMessages,
  createMessageWithRole,
  // Pattern factories
  createMockClarifyPattern,
  createMockClarifyPatternRow,
  createMockClarifyPatterns,
  createPatternWithType,
  // Tool use factory
  createDreamToolUse,
  // Pre-configured session scenarios
  activeSession,
  archivedSession,
  sessionWithDream,
  emptySession,
  // Pre-configured message scenarios
  userMessage,
  assistantMessage,
  messageWithToolUse,
  longMessage,
  // Pre-configured pattern scenarios
  recurringThemePattern,
  tensionPattern,
  potentialDreamPattern,
  identitySignalPattern,
} from './clarify.factory';
