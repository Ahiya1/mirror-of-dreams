// test/integration/subscriptions/subscriptions.test.ts - Subscriptions router integration tests
// Tests for subscriptions.getStatus, subscriptions.createCheckout, subscriptions.getPlanId,
// subscriptions.activateSubscription, subscriptions.cancel

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createTestCaller, createPartialMock } from '../setup';

import {
  freeUserSubscriptionRow,
  proMonthlyUserRow,
  proYearlyUserRow,
  unlimitedUserRow,
  canceledUserRow,
  createMockPayPalSubscription,
  approvedPayPalSubscription,
  suspendedPayPalSubscription,
  PLAN_IDS,
} from '@/test/fixtures/subscriptions';
import { freeTierUser, proTierUser, unlimitedTierUser, demoUser } from '@/test/fixtures/users';

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

const TEST_USER_ID = proTierUser.id;

// =============================================================================
// TESTS: subscriptions.getStatus
// =============================================================================

describe('subscriptions.getStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // SUCCESS CASES
  // ===========================================================================

  describe('success cases', () => {
    it('TC-SB-01: should return free tier status for free user', async () => {
      const { caller, supabase } = createTestCaller(freeTierUser);

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

      const result = await caller.subscriptions.getStatus();

      expect(result.tier).toBe('free');
      expect(result.isActive).toBe(false);
      expect(result.isSubscribed).toBe(false);
      expect(result.subscriptionId).toBeNull();
    });

    it('TC-SB-02: should return pro monthly status for subscribed user', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

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

      const result = await caller.subscriptions.getStatus();

      expect(result.tier).toBe('pro');
      expect(result.status).toBe('active');
      expect(result.period).toBe('monthly');
      expect(result.isActive).toBe(true);
      expect(result.isSubscribed).toBe(true);
      expect(result.subscriptionId).toBe('I-PRO-MONTHLY-123');
    });

    it('TC-SB-03: should return pro yearly status', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: proYearlyUserRow,
              error: null,
            }),
          });
        }
        return createPartialMock({});
      });

      const result = await caller.subscriptions.getStatus();

      expect(result.tier).toBe('pro');
      expect(result.period).toBe('yearly');
      expect(result.isActive).toBe(true);
    });

    it('TC-SB-04: should return unlimited tier status', async () => {
      const { caller, supabase } = createTestCaller(unlimitedTierUser);

      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: unlimitedUserRow,
              error: null,
            }),
          });
        }
        return createPartialMock({});
      });

      const result = await caller.subscriptions.getStatus();

      expect(result.tier).toBe('unlimited');
      expect(result.isActive).toBe(true);
      expect(result.isSubscribed).toBe(true);
    });

    it('TC-SB-05: should return canceled status with cancelAtPeriodEnd flag', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: canceledUserRow,
              error: null,
            }),
          });
        }
        return createPartialMock({});
      });

      const result = await caller.subscriptions.getStatus();

      expect(result.tier).toBe('pro');
      expect(result.isActive).toBe(true);
      expect(result.cancelAtPeriodEnd).toBe(true);
      expect(result.expiresAt).toBeDefined();
    });

    it('TC-SB-06: should calculate nextBilling date for monthly subscription', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);
      const startDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);

      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                ...proMonthlyUserRow,
                subscription_started_at: startDate.toISOString(),
              },
              error: null,
            }),
          });
        }
        return createPartialMock({});
      });

      const result = await caller.subscriptions.getStatus();

      expect(result.nextBilling).toBeDefined();
      const nextBillingDate = new Date(result.nextBilling!);
      expect(nextBillingDate.getTime()).toBeGreaterThan(Date.now());
    });
  });

  // ===========================================================================
  // ERROR HANDLING
  // ===========================================================================

  describe('error handling', () => {
    it('TC-SB-07: should return default free tier on database error', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Database connection failed'),
            }),
          });
        }
        return createPartialMock({});
      });

      const result = await caller.subscriptions.getStatus();

      // Should gracefully fallback to free tier
      expect(result.tier).toBe('free');
      expect(result.isActive).toBe(false);
      expect(result.isSubscribed).toBe(false);
    });
  });

  // ===========================================================================
  // AUTHORIZATION
  // ===========================================================================

  describe('authorization', () => {
    it('TC-SB-08: should reject unauthenticated user', async () => {
      const { caller } = createTestCaller(null);

      await expect(caller.subscriptions.getStatus()).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });
});

// =============================================================================
// TESTS: subscriptions.createCheckout
// =============================================================================

describe('subscriptions.createCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    paypalMock.createSubscription.mockResolvedValue('https://paypal.com/approve/123');
    paypalMock.getPlanId.mockImplementation(
      (tier: string, period: string) => `P-${tier.toUpperCase()}-${period.toUpperCase()}`
    );
  });

  // ===========================================================================
  // SUCCESS CASES
  // ===========================================================================

  describe('success cases', () => {
    it('TC-SB-09: should create checkout for pro monthly', async () => {
      const { caller } = createTestCaller(freeTierUser);

      const result = await caller.subscriptions.createCheckout({
        tier: 'pro',
        period: 'monthly',
      });

      expect(result.approvalUrl).toBe('https://paypal.com/approve/123');
      expect(paypalMock.getPlanId).toHaveBeenCalledWith('pro', 'monthly');
      expect(paypalMock.createSubscription).toHaveBeenCalled();
    });

    it('TC-SB-10: should create checkout for pro yearly', async () => {
      const { caller } = createTestCaller(freeTierUser);

      const result = await caller.subscriptions.createCheckout({
        tier: 'pro',
        period: 'yearly',
      });

      expect(result.approvalUrl).toBe('https://paypal.com/approve/123');
      expect(paypalMock.getPlanId).toHaveBeenCalledWith('pro', 'yearly');
    });

    it('TC-SB-11: should create checkout for unlimited tier', async () => {
      const { caller } = createTestCaller(freeTierUser);

      const result = await caller.subscriptions.createCheckout({
        tier: 'unlimited',
        period: 'yearly',
      });

      expect(result.approvalUrl).toBe('https://paypal.com/approve/123');
      expect(paypalMock.getPlanId).toHaveBeenCalledWith('unlimited', 'yearly');
    });
  });

  // ===========================================================================
  // ERROR HANDLING
  // ===========================================================================

  describe('error handling', () => {
    it('TC-SB-12: should handle PayPal createSubscription error', async () => {
      const { caller } = createTestCaller(freeTierUser);

      paypalMock.createSubscription.mockRejectedValueOnce(new Error('PayPal API error'));

      await expect(
        caller.subscriptions.createCheckout({
          tier: 'pro',
          period: 'monthly',
        })
      ).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'PayPal API error',
      });
    });
  });

  // ===========================================================================
  // VALIDATION
  // ===========================================================================

  describe('validation', () => {
    it('TC-SB-13: should reject invalid tier', async () => {
      const { caller } = createTestCaller(freeTierUser);

      await expect(
        caller.subscriptions.createCheckout({
          tier: 'invalid' as any,
          period: 'monthly',
        })
      ).rejects.toThrow();
    });

    it('TC-SB-14: should reject invalid period', async () => {
      const { caller } = createTestCaller(freeTierUser);

      await expect(
        caller.subscriptions.createCheckout({
          tier: 'pro',
          period: 'weekly' as any,
        })
      ).rejects.toThrow();
    });
  });

  // ===========================================================================
  // AUTHORIZATION
  // ===========================================================================

  describe('authorization', () => {
    it('TC-SB-15: should reject unauthenticated user', async () => {
      const { caller } = createTestCaller(null);

      await expect(
        caller.subscriptions.createCheckout({
          tier: 'pro',
          period: 'monthly',
        })
      ).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });
});

// =============================================================================
// TESTS: subscriptions.getPlanId
// =============================================================================

describe('subscriptions.getPlanId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    paypalMock.getPlanId.mockImplementation(
      (tier: string, period: string) => `P-${tier.toUpperCase()}-${period.toUpperCase()}`
    );
  });

  describe('success cases', () => {
    it('TC-SB-16: should return plan ID for pro monthly', async () => {
      const { caller } = createTestCaller(proTierUser);

      const result = await caller.subscriptions.getPlanId({
        tier: 'pro',
        period: 'monthly',
      });

      expect(result.planId).toBe('P-PRO-MONTHLY');
    });

    it('TC-SB-17: should return plan ID for pro yearly', async () => {
      const { caller } = createTestCaller(proTierUser);

      const result = await caller.subscriptions.getPlanId({
        tier: 'pro',
        period: 'yearly',
      });

      expect(result.planId).toBe('P-PRO-YEARLY');
    });

    it('TC-SB-18: should return plan ID for unlimited monthly', async () => {
      const { caller } = createTestCaller(proTierUser);

      const result = await caller.subscriptions.getPlanId({
        tier: 'unlimited',
        period: 'monthly',
      });

      expect(result.planId).toBe('P-UNLIMITED-MONTHLY');
    });

    it('TC-SB-19: should return plan ID for unlimited yearly', async () => {
      const { caller } = createTestCaller(proTierUser);

      const result = await caller.subscriptions.getPlanId({
        tier: 'unlimited',
        period: 'yearly',
      });

      expect(result.planId).toBe('P-UNLIMITED-YEARLY');
    });
  });

  describe('authorization', () => {
    it('TC-SB-20: should reject unauthenticated user', async () => {
      const { caller } = createTestCaller(null);

      await expect(
        caller.subscriptions.getPlanId({
          tier: 'pro',
          period: 'monthly',
        })
      ).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });
});

// =============================================================================
// TESTS: subscriptions.activateSubscription
// =============================================================================

describe('subscriptions.activateSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    paypalMock.getSubscriptionDetails.mockResolvedValue(createMockPayPalSubscription());
    paypalMock.determineTierFromPlanId.mockReturnValue('pro');
    paypalMock.determinePeriodFromPlanId.mockReturnValue('monthly');
  });

  // ===========================================================================
  // SUCCESS CASES
  // ===========================================================================

  describe('success cases', () => {
    it('TC-SB-21: should activate subscription with ACTIVE status', async () => {
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
      expect(result.period).toBe('monthly');
      expect(paypalMock.getSubscriptionDetails).toHaveBeenCalledWith('I-SUB123');
    });

    it('TC-SB-22: should activate subscription with APPROVED status', async () => {
      const { caller, supabase } = createTestCaller(freeTierUser);

      paypalMock.getSubscriptionDetails.mockResolvedValueOnce(approvedPayPalSubscription);

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
    });
  });

  // ===========================================================================
  // ERROR HANDLING
  // ===========================================================================

  describe('error handling', () => {
    it('TC-SB-23: should reject non-active subscription status', async () => {
      const { caller } = createTestCaller(freeTierUser);

      paypalMock.getSubscriptionDetails.mockResolvedValueOnce(suspendedPayPalSubscription);

      await expect(
        caller.subscriptions.activateSubscription({
          subscriptionId: 'I-SUB123',
        })
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: expect.stringContaining('not active'),
      });
    });

    it('TC-SB-24: should handle database update error', async () => {
      const { caller, supabase } = createTestCaller(freeTierUser);

      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Database error'),
            }),
          });
        }
        return createPartialMock({});
      });

      await expect(
        caller.subscriptions.activateSubscription({
          subscriptionId: 'I-SUB123',
        })
      ).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
      });
    });
  });

  // ===========================================================================
  // AUTHORIZATION
  // ===========================================================================

  describe('authorization', () => {
    it('TC-SB-25: should reject unauthenticated user', async () => {
      const { caller } = createTestCaller(null);

      await expect(
        caller.subscriptions.activateSubscription({
          subscriptionId: 'I-SUB123',
        })
      ).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });
});

// =============================================================================
// TESTS: subscriptions.cancel
// =============================================================================

describe('subscriptions.cancel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    paypalMock.cancelSubscription.mockResolvedValue(undefined);
  });

  // ===========================================================================
  // SUCCESS CASES
  // ===========================================================================

  describe('success cases', () => {
    it('TC-SB-26: should cancel subscription successfully', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      let callCount = 0;
      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          callCount++;
          if (callCount === 1) {
            // First call: fetch user with subscription
            return createPartialMock({
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { paypal_subscription_id: 'I-SUB123' },
                error: null,
              }),
            });
          } else {
            // Second call: update cancel_at_period_end
            return createPartialMock({
              update: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            });
          }
        }
        return createPartialMock({});
      });

      const result = await caller.subscriptions.cancel();

      expect(result.success).toBe(true);
      expect(paypalMock.cancelSubscription).toHaveBeenCalledWith('I-SUB123');
    });
  });

  // ===========================================================================
  // ERROR HANDLING
  // ===========================================================================

  describe('error handling', () => {
    it('TC-SB-27: should throw NOT_FOUND when no subscription exists', async () => {
      const { caller, supabase } = createTestCaller(freeTierUser);

      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { paypal_subscription_id: null },
              error: null,
            }),
          });
        }
        return createPartialMock({});
      });

      await expect(caller.subscriptions.cancel()).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'No active subscription found',
      });
    });

    it('TC-SB-28: should handle PayPal cancel error', async () => {
      const { caller, supabase } = createTestCaller(proTierUser);

      paypalMock.cancelSubscription.mockRejectedValueOnce(new Error('PayPal cancel failed'));

      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return createPartialMock({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { paypal_subscription_id: 'I-SUB123' },
              error: null,
            }),
          });
        }
        return createPartialMock({});
      });

      await expect(caller.subscriptions.cancel()).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'PayPal cancel failed',
      });
    });
  });

  // ===========================================================================
  // AUTHORIZATION
  // ===========================================================================

  describe('authorization', () => {
    it('TC-SB-29: should reject unauthenticated user', async () => {
      const { caller } = createTestCaller(null);

      await expect(caller.subscriptions.cancel()).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });
});
