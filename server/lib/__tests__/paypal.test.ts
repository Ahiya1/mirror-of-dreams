// server/lib/__tests__/paypal.test.ts - PayPal client library tests

import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  getPayPalAccessToken,
  createSubscription,
  cancelSubscription,
  getSubscriptionDetails,
  verifyWebhookSignature,
  getPlanId,
  determineTierFromPlanId,
  determinePeriodFromPlanId,
  type PayPalWebhookHeaders,
} from '../paypal';

// Mock fetch globally
global.fetch = vi.fn();

// Mock environment variables
const mockEnv = {
  PAYPAL_CLIENT_ID: 'test-client-id',
  PAYPAL_CLIENT_SECRET: 'test-client-secret',
  PAYPAL_ENVIRONMENT: 'sandbox',
  PAYPAL_WEBHOOK_ID: 'test-webhook-id',
  PAYPAL_PRO_MONTHLY_PLAN_ID: 'P-PRO-MONTHLY',
  PAYPAL_PRO_YEARLY_PLAN_ID: 'P-PRO-YEARLY',
  PAYPAL_UNLIMITED_MONTHLY_PLAN_ID: 'P-UNLIMITED-MONTHLY',
  PAYPAL_UNLIMITED_YEARLY_PLAN_ID: 'P-UNLIMITED-YEARLY',
  DOMAIN: 'http://localhost:3000',
};

describe('PayPal Client Library', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Reset environment
    Object.assign(process.env, mockEnv);
  });

  describe('getPayPalAccessToken', () => {
    test('should fetch and cache access token', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'test-token-123',
          expires_in: 3600,
        }),
      } as Response);

      const token = await getPayPalAccessToken();

      expect(token).toBe('test-token-123');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api-m.sandbox.paypal.com/v1/oauth2/token',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded',
          }),
        })
      );
    });

    test('should use cached token if still valid', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'test-token-123',
          expires_in: 3600,
        }),
      } as Response);

      // First call
      await getPayPalAccessToken();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await getPayPalAccessToken();
      expect(mockFetch).toHaveBeenCalledTimes(1); // Still 1, no new request
    });

    test('should throw error on failed token request', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      } as Response);

      await expect(getPayPalAccessToken()).rejects.toThrow('PayPal token error: 401');
    });
  });

  describe('createSubscription', () => {
    test('should create subscription and return approval URL', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

      // Mock token request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'test-token',
          expires_in: 3600,
        }),
      } as Response);

      // Mock subscription creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          id: 'SUB-123',
          status: 'APPROVAL_PENDING',
          links: [
            { href: 'https://paypal.com/approve?token=xyz', rel: 'approve' },
            { href: 'https://api.paypal.com/v1/billing/subscriptions/SUB-123', rel: 'self' },
          ],
        }),
      } as Response);

      const approvalUrl = await createSubscription('user-123', 'P-PRO-MONTHLY');

      expect(approvalUrl).toBe('https://paypal.com/approve?token=xyz');
      expect(mockFetch).toHaveBeenCalledTimes(2); // Token + subscription
    });
  });

  describe('cancelSubscription', () => {
    test('should cancel subscription successfully', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

      // Mock token request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'test-token',
          expires_in: 3600,
        }),
      } as Response);

      // Mock cancellation (204 No Content)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      } as Response);

      await expect(cancelSubscription('SUB-123')).resolves.toBeUndefined();
    });
  });

  describe('getSubscriptionDetails', () => {
    test('should fetch subscription details', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

      // Mock token request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'test-token',
          expires_in: 3600,
        }),
      } as Response);

      // Mock subscription details
      const mockSubscription = {
        id: 'SUB-123',
        status: 'ACTIVE',
        plan_id: 'P-PRO-MONTHLY',
        subscriber: {
          payer_id: 'PAYER-123',
          email_address: 'user@example.com',
          name: { given_name: 'John', surname: 'Doe' },
        },
        billing_info: {
          next_billing_time: '2025-12-30T00:00:00Z',
          cycle_executions: [],
        },
        custom_id: 'user-123',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubscription,
      } as Response);

      const details = await getSubscriptionDetails('SUB-123');

      expect(details).toEqual(mockSubscription);
    });
  });

  describe('verifyWebhookSignature', () => {
    test('should verify valid webhook signature', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

      // Mock token request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'test-token',
          expires_in: 3600,
        }),
      } as Response);

      // Mock verification response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          verification_status: 'SUCCESS',
        }),
      } as Response);

      const headers: PayPalWebhookHeaders = {
        transmissionId: 'test-id',
        transmissionTime: '2025-11-30T00:00:00Z',
        certUrl: 'https://api.paypal.com/cert',
        authAlgo: 'SHA256withRSA',
        transmissionSig: 'test-sig',
      };

      const body = JSON.stringify({ id: 'event-123', event_type: 'TEST' });

      const isValid = await verifyWebhookSignature(body, headers);

      expect(isValid).toBe(true);
    });

    test('should return false for missing headers', async () => {
      const headers: PayPalWebhookHeaders = {
        transmissionId: null,
        transmissionTime: null,
        certUrl: null,
        authAlgo: null,
        transmissionSig: null,
      };

      const isValid = await verifyWebhookSignature('{}', headers);

      expect(isValid).toBe(false);
    });
  });

  describe('getPlanId', () => {
    test('should return correct plan ID for pro monthly', () => {
      expect(getPlanId('pro', 'monthly')).toBe('P-PRO-MONTHLY');
    });

    test('should return correct plan ID for pro yearly', () => {
      expect(getPlanId('pro', 'yearly')).toBe('P-PRO-YEARLY');
    });

    test('should return correct plan ID for unlimited monthly', () => {
      expect(getPlanId('unlimited', 'monthly')).toBe('P-UNLIMITED-MONTHLY');
    });

    test('should return correct plan ID for unlimited yearly', () => {
      expect(getPlanId('unlimited', 'yearly')).toBe('P-UNLIMITED-YEARLY');
    });

    test('should throw error for missing plan ID', () => {
      delete process.env.PAYPAL_PRO_MONTHLY_PLAN_ID;
      expect(() => getPlanId('pro', 'monthly')).toThrow('No plan ID found');
    });
  });

  describe('determineTierFromPlanId', () => {
    test('should return pro for pro plan IDs', () => {
      expect(determineTierFromPlanId('P-PRO-MONTHLY')).toBe('pro');
      expect(determineTierFromPlanId('P-PRO-YEARLY')).toBe('pro');
    });

    test('should return unlimited for unlimited plan IDs', () => {
      expect(determineTierFromPlanId('P-UNLIMITED-MONTHLY')).toBe('unlimited');
      expect(determineTierFromPlanId('P-UNLIMITED-YEARLY')).toBe('unlimited');
    });

    test('should throw error for unknown plan ID', () => {
      expect(() => determineTierFromPlanId('P-UNKNOWN')).toThrow('Unknown plan ID');
    });
  });

  describe('determinePeriodFromPlanId', () => {
    test('should return monthly for monthly plan IDs', () => {
      expect(determinePeriodFromPlanId('P-PRO-MONTHLY')).toBe('monthly');
      expect(determinePeriodFromPlanId('P-UNLIMITED-MONTHLY')).toBe('monthly');
    });

    test('should return yearly for yearly plan IDs', () => {
      expect(determinePeriodFromPlanId('P-PRO-YEARLY')).toBe('yearly');
      expect(determinePeriodFromPlanId('P-UNLIMITED-YEARLY')).toBe('yearly');
    });

    test('should throw error for unknown plan ID', () => {
      expect(() => determinePeriodFromPlanId('P-UNKNOWN')).toThrow('Unknown plan ID');
    });
  });
});
