import { beforeEach, vi } from 'vitest';

// Set test environment variables
// Note: NODE_ENV is already set to 'test' by Vitest
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

// PayPal test environment variables
process.env.PAYPAL_CLIENT_ID = 'test-paypal-client-id';
process.env.PAYPAL_CLIENT_SECRET = 'test-paypal-client-secret';
process.env.PAYPAL_ENVIRONMENT = 'sandbox';
process.env.PAYPAL_WEBHOOK_ID = 'test-webhook-id';
process.env.PAYPAL_PRO_MONTHLY_PLAN_ID = 'P-PRO-MONTHLY';
process.env.PAYPAL_PRO_YEARLY_PLAN_ID = 'P-PRO-YEARLY';
process.env.PAYPAL_UNLIMITED_MONTHLY_PLAN_ID = 'P-UNLIMITED-MONTHLY';
process.env.PAYPAL_UNLIMITED_YEARLY_PLAN_ID = 'P-UNLIMITED-YEARLY';

// Anthropic test environment variables
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';

// App configuration
process.env.DOMAIN = 'http://localhost:3000';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';

// Reset mocks between tests
beforeEach(() => {
  vi.resetAllMocks();
});

// Global fetch mock (can be overridden in individual tests)
global.fetch = vi.fn();
