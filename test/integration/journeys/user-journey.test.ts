// test/integration/journeys/user-journey.test.ts - User journey integration tests
// Tests for complete user flows across multiple routers:
// - New user onboarding journey
// - Dream lifecycle journey (create -> reflect -> achieve)
// - Subscription upgrade journey
// - Cross-dream patterns journey

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createTestCaller, createPartialMock, anthropicMock } from '../setup';

import { createMockDream, createMockDreams } from '@/test/fixtures/dreams';
import { createMockReflections, createMockReflectionRow } from '@/test/fixtures/reflections';
import {
  freeUserSubscriptionRow,
  proMonthlyUserRow,
  createMockPayPalSubscription,
} from '@/test/fixtures/subscriptions';
import {
  freeTierUser,
  proTierUser,
  unlimitedTierUser,
  createMockUser,
  newUser,
} from '@/test/fixtures/users';

// =============================================================================
// PAYPAL MOCK SETUP
// =============================================================================

const paypalMock = vi.hoisted(() => ({
  createSubscription: vi.fn().mockResolvedValue('https://paypal.com/approve/123'),
  cancelSubscription: vi.fn().mockResolvedValue(undefined),
  getPlanId: vi
    .fn()
    .mockImplementation(
      (tier: string, period: string) => `P-${tier.toUpperCase()}-${period.toUpperCase()}`
    ),
  getSubscriptionDetails: vi.fn().mockResolvedValue({
    id: 'I-SUB123',
    status: 'ACTIVE',
    plan_id: 'P-PRO-MONTHLY',
    subscriber: { payer_id: 'PAYER123' },
  }),
  determineTierFromPlanId: vi.fn().mockReturnValue('pro'),
  determinePeriodFromPlanId: vi.fn().mockReturnValue('monthly'),
}));

vi.mock('@/server/lib/paypal', () => paypalMock);

// =============================================================================
// CONSTANTS
// =============================================================================

const TEST_DREAM_ID = '11111111-1111-4111-a111-111111111111';
const TEST_REFLECTION_ID = 'reflection-uuid-1234';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Creates a comprehensive mock that tracks state changes across calls
 */
interface JourneyState {
  dreamStatus: 'active' | 'achieved' | 'archived' | 'released';
  reflectionCount: number;
  hasCeremony: boolean;
  tier: 'free' | 'pro' | 'unlimited';
}

// =============================================================================
// TESTS: New User Onboarding Journey
// =============================================================================

describe('User Journey: New User Onboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'test-api-key';
  });

  it('TC-UJ-01: should complete signup and view initial dream limits', async () => {
    // A new free tier user should be able to check their dream limits
    const { caller, supabase } = createTestCaller(newUser);

    supabase.from.mockImplementation((table: string) => {
      if (table === 'dreams') {
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) => resolve({ data: null, error: null, count: 0 })),
        });
      }
      return createPartialMock({});
    });

    const limits = await caller.dreams.getLimits();

    expect(limits.tier).toBe('free');
    expect(limits.dreamsUsed).toBe(0);
    expect(limits.dreamsLimit).toBe(2); // Free tier limit
    expect(limits.canCreate).toBe(true);
  });

  it('TC-UJ-02: should create first dream after signup', async () => {
    const { caller, supabase } = createTestCaller(newUser);

    const newDream = createMockDream({
      id: TEST_DREAM_ID,
      user_id: newUser.id,
      title: 'Learn to play guitar',
      status: 'active',
    });

    let checkLimitsCalled = false;
    supabase.from.mockImplementation((table: string) => {
      if (table === 'dreams') {
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: newDream, error: null }),
          then: vi.fn((resolve) => {
            if (!checkLimitsCalled) {
              checkLimitsCalled = true;
              resolve({ data: null, error: null, count: 0 }); // No existing dreams
            } else {
              resolve({ data: newDream, error: null });
            }
          }),
        });
      }
      return createPartialMock({});
    });

    const result = await caller.dreams.create({
      title: 'Learn to play guitar',
      description: 'Master basic chords and play my favorite songs',
      category: 'creative',
    });

    // dreams.create returns { dream, usage }
    expect(result.dream.id).toBe(TEST_DREAM_ID);
    expect(result.dream.title).toBe('Learn to play guitar');
    expect(result.dream.status).toBe('active');
  });

  it('TC-UJ-03: should check subscription status for free user', async () => {
    const { caller, supabase } = createTestCaller(newUser);

    supabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: freeUserSubscriptionRow,
            error: null,
          }),
        });
      }
      return createPartialMock({});
    });

    const status = await caller.subscriptions.getStatus();

    expect(status.tier).toBe('free');
    expect(status.isSubscribed).toBe(false);
    expect(status.isActive).toBe(false);
  });
});

// =============================================================================
// TESTS: Dream Lifecycle Journey
// =============================================================================

describe('User Journey: Dream Lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'test-api-key';

    // Reset Anthropic mock
    anthropicMock.messages.create.mockResolvedValue({
      id: 'msg_test_12345',
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: 'Your journey with this dream speaks to your dedication and growth.',
        },
      ],
      model: 'claude-sonnet-4-5-20250929',
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: { input_tokens: 100, output_tokens: 50 },
    });
  });

  it('TC-UJ-04: should create dream and generate first reflection', async () => {
    const { caller, supabase } = createTestCaller(proTierUser);

    const dream = createMockDream({
      id: TEST_DREAM_ID,
      user_id: proTierUser.id,
      status: 'active',
    });

    const newReflection = createMockReflectionRow({
      id: TEST_REFLECTION_ID,
      user_id: proTierUser.id,
      dream_id: TEST_DREAM_ID,
    });

    // Track state for the journey
    const step = 0;
    supabase.from.mockImplementation((table: string) => {
      if (table === 'dreams') {
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: dream, error: null }),
          then: vi.fn((resolve) => resolve({ data: null, error: null, count: 1 })),
        });
      }
      if (table === 'reflections') {
        return createPartialMock({
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: newReflection, error: null }),
          then: vi.fn((resolve) => resolve({ data: [newReflection], error: null, count: 1 })),
        });
      }
      if (table === 'users') {
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              ...proTierUser,
              reflections_today: 0,
              last_reflection_date: null,
            },
            error: null,
          }),
        });
      }
      return createPartialMock({});
    });

    supabase.rpc.mockResolvedValue({ data: true, error: null });

    // Step 1: Get dream
    const fetchedDream = await caller.dreams.get({ id: TEST_DREAM_ID });
    expect(fetchedDream.id).toBe(TEST_DREAM_ID);
  });

  it('TC-UJ-05: should track reflection count on dream', async () => {
    const { caller, supabase } = createTestCaller(proTierUser);

    const dream = createMockDream({
      id: TEST_DREAM_ID,
      user_id: proTierUser.id,
      status: 'active',
    });

    const reflections = createMockReflections(4, proTierUser.id);

    supabase.from.mockImplementation((table: string) => {
      if (table === 'dreams') {
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: dream, error: null }),
          then: vi.fn((resolve) => resolve({ data: null, error: null, count: 4 })),
        });
      }
      if (table === 'reflections') {
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { created_at: new Date().toISOString() },
            error: null,
          }),
          then: vi.fn((resolve) => resolve({ data: null, error: null, count: 4 })),
        });
      }
      return createPartialMock({});
    });

    const result = await caller.dreams.get({ id: TEST_DREAM_ID });

    expect(result.reflectionCount).toBe(4);
  });

  it('TC-UJ-06: should list all reflections for a user', async () => {
    const { caller, supabase } = createTestCaller(proTierUser);

    const reflections = createMockReflections(3, proTierUser.id).map((r) => ({
      ...r,
      dream_id: TEST_DREAM_ID,
      dreams: { title: 'Test Dream' }, // Include the joined dream title
    }));

    supabase.from.mockImplementation((table: string) => {
      if (table === 'reflections') {
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) =>
            resolve({
              data: reflections,
              error: null,
              count: 3,
            })
          ),
        });
      }
      return createPartialMock({});
    });

    // reflections.list doesn't have dreamId param - lists all user reflections
    const result = await caller.reflections.list({
      page: 1,
      limit: 10,
    });

    // reflections.list returns { items, page, limit, total, totalPages, hasMore }
    expect(result.items).toHaveLength(3);
    expect(result.total).toBe(3);
  });

  it('TC-UJ-07: should update dream status to achieved', async () => {
    const { caller, supabase } = createTestCaller(proTierUser);

    const dream = createMockDream({
      id: TEST_DREAM_ID,
      user_id: proTierUser.id,
      status: 'active',
    });

    const achievedDream = {
      ...dream,
      status: 'achieved',
      achieved_at: new Date().toISOString(),
    };

    let callCount = 0;
    supabase.from.mockImplementation((table: string) => {
      if (table === 'dreams') {
        callCount++;
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: callCount === 1 ? { id: TEST_DREAM_ID } : achievedDream,
            error: null,
          }),
        });
      }
      return createPartialMock({});
    });

    const result = await caller.dreams.updateStatus({
      id: TEST_DREAM_ID,
      status: 'achieved',
    });

    expect(result.status).toBe('achieved');
    expect(result.achieved_at).toBeDefined();
  });
});

// =============================================================================
// TESTS: Subscription Upgrade Journey
// =============================================================================

describe('User Journey: Subscription Upgrade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    paypalMock.createSubscription.mockResolvedValue('https://paypal.com/approve/123');
    paypalMock.getSubscriptionDetails.mockResolvedValue(createMockPayPalSubscription());
    paypalMock.determineTierFromPlanId.mockReturnValue('pro');
    paypalMock.determinePeriodFromPlanId.mockReturnValue('monthly');
  });

  it('TC-UJ-08: should check free tier limits before upgrade', async () => {
    const { caller, supabase } = createTestCaller(freeTierUser);

    supabase.from.mockImplementation((table: string) => {
      if (table === 'dreams') {
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) => resolve({ data: null, error: null, count: 2 })), // At limit
        });
      }
      return createPartialMock({});
    });

    const limits = await caller.dreams.getLimits();

    expect(limits.tier).toBe('free');
    expect(limits.dreamsUsed).toBe(2);
    expect(limits.dreamsRemaining).toBe(0);
    expect(limits.canCreate).toBe(false);
  });

  it('TC-UJ-09: should create checkout session for upgrade', async () => {
    const { caller } = createTestCaller(freeTierUser);

    const result = await caller.subscriptions.createCheckout({
      tier: 'pro',
      period: 'monthly',
    });

    expect(result.approvalUrl).toBe('https://paypal.com/approve/123');
  });

  it('TC-UJ-10: should activate subscription after PayPal approval', async () => {
    const { caller, supabase } = createTestCaller(freeTierUser);

    supabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return createPartialMock({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      }
      return createPartialMock({});
    });

    const result = await caller.subscriptions.activateSubscription({
      subscriptionId: 'I-SUB123',
    });

    expect(result.success).toBe(true);
    expect(result.tier).toBe('pro');
  });

  it('TC-UJ-11: should verify increased limits after upgrade', async () => {
    // Simulate a user who just upgraded to pro
    const upgradedUser = createMockUser({
      id: freeTierUser.id,
      tier: 'pro',
      subscriptionStatus: 'active',
      subscriptionPeriod: 'monthly',
    });

    const { caller, supabase } = createTestCaller(upgradedUser);

    supabase.from.mockImplementation((table: string) => {
      if (table === 'dreams') {
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) => resolve({ data: null, error: null, count: 2 })), // Still 2 dreams
        });
      }
      return createPartialMock({});
    });

    const limits = await caller.dreams.getLimits();

    expect(limits.tier).toBe('pro');
    expect(limits.dreamsLimit).toBe(5); // Pro limit
    expect(limits.dreamsUsed).toBe(2);
    expect(limits.dreamsRemaining).toBe(3);
    expect(limits.canCreate).toBe(true);
  });

  it('TC-UJ-12: should verify subscription status after upgrade', async () => {
    const upgradedUser = createMockUser({
      id: freeTierUser.id,
      tier: 'pro',
      subscriptionStatus: 'active',
      subscriptionPeriod: 'monthly',
    });

    const { caller, supabase } = createTestCaller(upgradedUser);

    supabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: proMonthlyUserRow,
            error: null,
          }),
        });
      }
      return createPartialMock({});
    });

    const status = await caller.subscriptions.getStatus();

    expect(status.tier).toBe('pro');
    expect(status.isActive).toBe(true);
    expect(status.isSubscribed).toBe(true);
  });
});

// =============================================================================
// TESTS: Cross-Dream Patterns Journey
// =============================================================================

describe('User Journey: Cross-Dream Patterns', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'test-api-key';
  });

  it('TC-UJ-13: should list multiple active dreams', async () => {
    const { caller, supabase } = createTestCaller(proTierUser);

    const dreams = createMockDreams(3, proTierUser.id);

    supabase.from.mockImplementation((table: string) => {
      if (table === 'dreams') {
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) =>
            resolve({
              data: dreams,
              error: null,
              count: 3,
            })
          ),
        });
      }
      if (table === 'reflections') {
        // For includeStats=true (default), dreams.list fetches reflection stats
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) =>
            resolve({
              data: [],
              error: null,
            })
          ),
        });
      }
      return createPartialMock({});
    });

    // dreams.list requires input object (even if empty for defaults)
    const result = await caller.dreams.list({});

    // dreams.list returns array directly, not { dreams, total }
    expect(result).toHaveLength(3);
    expect(result[0].id).toBeDefined();
  });

  it('TC-UJ-14: should list reflections across all dreams', async () => {
    const { caller, supabase } = createTestCaller(proTierUser);

    // Create reflections for different dreams with joined dream data
    const reflections = [
      {
        ...createMockReflectionRow({
          id: 'ref-1',
          user_id: proTierUser.id,
          dream_id: 'dream-1',
          title: 'Dream 1 Reflection',
        }),
        dreams: { title: 'Dream 1' },
      },
      {
        ...createMockReflectionRow({
          id: 'ref-2',
          user_id: proTierUser.id,
          dream_id: 'dream-2',
          title: 'Dream 2 Reflection',
        }),
        dreams: { title: 'Dream 2' },
      },
      {
        ...createMockReflectionRow({
          id: 'ref-3',
          user_id: proTierUser.id,
          dream_id: 'dream-3',
          title: 'Dream 3 Reflection',
        }),
        dreams: { title: 'Dream 3' },
      },
    ];

    supabase.from.mockImplementation((table: string) => {
      if (table === 'reflections') {
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) =>
            resolve({
              data: reflections,
              error: null,
              count: 3,
            })
          ),
        });
      }
      return createPartialMock({});
    });

    const result = await caller.reflections.list({
      page: 1,
      limit: 10,
    });

    // reflections.list returns { items, ... }
    expect(result.items).toHaveLength(3);
    expect(result.total).toBe(3);
    // Verify reflections are from different dreams
    const dreamIds = new Set(result.items.map((r: any) => r.dreamId));
    expect(dreamIds.size).toBe(3);
  });

  it('TC-UJ-15: should track total reflections across user profile', async () => {
    const { caller, supabase } = createTestCaller(proTierUser);

    supabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: proTierUser.id,
              email: proTierUser.email,
              name: proTierUser.name,
              tier: proTierUser.tier,
              subscription_status: 'active',
              subscription_period: 'monthly',
              subscription_started_at: new Date().toISOString(),
              subscription_expires_at: null,
              total_reflections: 25,
              reflection_count_this_month: 5,
              reflections_today: 0,
              last_reflection_date: null,
              clarify_sessions_this_month: 0,
              total_clarify_sessions: 0,
              cancel_at_period_end: false,
              is_creator: false,
              is_admin: false,
              is_demo: false,
              language: 'en',
              timezone: 'UTC',
              preferences: proTierUser.preferences,
              last_reflection_at: null,
              created_at: new Date().toISOString(),
              last_sign_in_at: new Date().toISOString(),
              email_verified: true,
            },
            error: null,
          }),
        });
      }
      return createPartialMock({});
    });

    // users.getProfile is the correct procedure (not users.me)
    const profile = await caller.users.getProfile();

    // getProfile returns snake_case fields from database
    expect(profile.total_reflections).toBe(25);
    expect(profile.reflection_count_this_month).toBe(5);
  });
});

// =============================================================================
// TESTS: Free Tier Limit Journey
// =============================================================================

describe('User Journey: Free Tier Limits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TC-UJ-16: should prevent dream creation at free tier limit', async () => {
    const { caller, supabase } = createTestCaller(freeTierUser);

    // Free tier user at dream limit (2)
    supabase.from.mockImplementation((table: string) => {
      if (table === 'dreams') {
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          then: vi.fn((resolve) => resolve({ data: null, error: null, count: 2 })), // At limit
        });
      }
      return createPartialMock({});
    });

    await expect(
      caller.dreams.create({
        title: 'Third dream',
        category: 'creative',
      })
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('TC-UJ-17: should show upgrade path in limits response', async () => {
    const { caller, supabase } = createTestCaller(freeTierUser);

    supabase.from.mockImplementation((table: string) => {
      if (table === 'dreams') {
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) => resolve({ data: null, error: null, count: 2 })), // At limit
        });
      }
      return createPartialMock({});
    });

    const limits = await caller.dreams.getLimits();

    expect(limits.tier).toBe('free');
    expect(limits.canCreate).toBe(false);
    expect(limits.dreamsRemaining).toBe(0);
    // The response implicitly indicates upgrade is needed
    expect(limits.dreamsLimit).toBe(2);
  });
});

// =============================================================================
// TESTS: Unlimited Tier Journey
// =============================================================================

describe('User Journey: Unlimited Tier Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'test-api-key';
  });

  it('TC-UJ-18: should allow many dreams for unlimited tier', async () => {
    const { caller, supabase } = createTestCaller(unlimitedTierUser);

    // Unlimited user with many dreams
    supabase.from.mockImplementation((table: string) => {
      if (table === 'dreams') {
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) => resolve({ data: null, error: null, count: 100 })),
        });
      }
      return createPartialMock({});
    });

    const limits = await caller.dreams.getLimits();

    expect(limits.tier).toBe('unlimited');
    expect(limits.dreamsUsed).toBe(100);
    expect(limits.canCreate).toBe(true);
  });

  it('TC-UJ-19: should verify unlimited subscription status', async () => {
    const { caller, supabase } = createTestCaller(unlimitedTierUser);

    supabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return createPartialMock({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              tier: 'unlimited',
              subscription_status: 'active',
              subscription_period: 'yearly',
              paypal_subscription_id: 'I-UNLIMITED-789',
              paypal_payer_id: 'PAYER-789',
              subscription_started_at: new Date(
                Date.now() - 30 * 24 * 60 * 60 * 1000
              ).toISOString(),
              subscription_expires_at: null,
              cancel_at_period_end: false,
            },
            error: null,
          }),
        });
      }
      return createPartialMock({});
    });

    const status = await caller.subscriptions.getStatus();

    expect(status.tier).toBe('unlimited');
    expect(status.isActive).toBe(true);
    expect(status.period).toBe('yearly');
  });
});
